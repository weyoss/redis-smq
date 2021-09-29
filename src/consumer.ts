import {
  IConfig,
  IConsumerConstructorOptions,
  ICallback,
  TUnitaryFunction,
} from '../types';
import { Instance } from './instance';
import { Message } from './message';
import { ConsumerStatsProvider } from './stats-provider/consumer-stats-provider';
import { events } from './events';
import { Heartbeat } from './heartbeat';
import { GarbageCollector } from './gc';
import { SchedulerRunner } from './scheduler-runner';
import { RedisClient } from './redis-client';
import { queueHelpers } from './queue-helpers';

export abstract class Consumer extends Instance {
  protected readonly options: Required<IConsumerConstructorOptions> = {
    messageTTL: 0,
    messageConsumeTimeout: 0,
    messageRetryThreshold: 3,
    messageRetryDelay: 60,
  };
  protected schedulerRunnerInstance: SchedulerRunner | null = null;
  protected statsProvider: ConsumerStatsProvider | null = null;
  protected garbageCollectorInstance: GarbageCollector | null = null;
  protected heartbeatInstance: Heartbeat | null = null;

  constructor(
    queueName: string,
    config: IConfig = {},
    options: IConsumerConstructorOptions = {},
  ) {
    super(queueName, config);
    this.options = {
      ...this.options,
      ...options,
    };
  }

  getConsumerMessageConsumeTimeout(): number {
    return this.options.messageConsumeTimeout;
  }

  getMessageRetryThreshold(): number {
    return this.options.messageRetryThreshold;
  }

  getConsumerMessageTTL(): number {
    return this.options.messageTTL;
  }

  getMessageRetryDelay(): number {
    return this.options.messageRetryDelay;
  }

  getOptions() {
    return this.options;
  }

  getStatsProvider(): ConsumerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ConsumerStatsProvider(this);
    }
    return this.statsProvider;
  }

  protected getNextMessage(): void {
    this.loggerInstance.info('Waiting for new messages...');
    const { keyQueue, keyConsumerProcessingQueue } = this.redisKeys;
    this.getRedisInstance((client) => {
      client.brpoplpush(
        keyQueue,
        keyConsumerProcessingQueue,
        0,
        (err, json) => {
          if (err) this.handleError(err);
          else if (!json)
            this.handleError(new Error('Expected a non empty string'));
          else {
            this.loggerInstance.info('Got new message...');
            const message = Message.createFromMessage(json);
            this.emit(events.MESSAGE_RECEIVED, message);
          }
        },
      );
    });
  }

  protected hasGoneUp(): boolean {
    return (
      super.hasGoneUp() &&
      this.startupFiredEvents.includes(events.GC_UP) &&
      this.startupFiredEvents.includes(events.HEARTBEAT_UP) &&
      this.startupFiredEvents.includes(events.SCHEDULER_RUNNER_UP)
    );
  }

  protected hasGoneDown(): boolean {
    return (
      super.hasGoneDown() &&
      this.shutdownFiredEvents.includes(events.GC_DOWN) &&
      this.shutdownFiredEvents.includes(events.HEARTBEAT_DOWN) &&
      this.shutdownFiredEvents.includes(events.SCHEDULER_RUNNER_DOWN)
    );
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.HEARTBEAT_UP, () =>
      this.handleStartupEvent(events.HEARTBEAT_UP),
    );
    this.on(events.HEARTBEAT_DOWN, () => {
      this.heartbeatInstance = null;
      this.handleShutdownEvent(events.HEARTBEAT_DOWN);
    });
    this.on(events.GC_UP, () => this.handleStartupEvent(events.GC_UP));
    this.on(events.GC_DOWN, () => {
      this.garbageCollectorInstance = null;
      this.handleShutdownEvent(events.GC_DOWN);
    });
    this.on(events.SCHEDULER_RUNNER_UP, () =>
      this.handleStartupEvent(events.SCHEDULER_RUNNER_UP),
    );
    this.on(events.SCHEDULER_RUNNER_DOWN, () => {
      this.schedulerRunnerInstance = null;
      this.handleShutdownEvent(events.SCHEDULER_RUNNER_DOWN);
    });
    this.on(events.GOING_UP, () => {
      this.getHeartBeatInstance((hb) => hb.start());
      this.getGarbageCollectorInstance((gc) => gc.start());
      this.getSchedulerRunnerInstance((sr) => sr.start());
    });
    this.on(events.GOING_DOWN, () => {
      this.getHeartBeatInstance((hb) => hb.stop());
      this.getGarbageCollectorInstance((gc) => gc.stop());
      this.getSchedulerRunnerInstance((sr) => sr.stop());
    });
    this.on(events.UP, () => {
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.getNextMessage();
      }
    });
    this.on(events.MESSAGE_RECEIVED, (message: Message) => {
      if (this.powerManager.isRunning()) {
        this.getGarbageCollectorInstance((gc) => {
          gc.getMessageCollector((messageCollector) => {
            if (this.statsProvider)
              this.statsProvider.incrementProcessingSlot();
            if (messageCollector.hasMessageExpired(message)) {
              this.emit(events.MESSAGE_EXPIRED, message);
            } else this.handleConsume(message);
          });
        });
      }
    });
    this.on(events.MESSAGE_EXPIRED, (message: Message) => {
      this.loggerInstance.info(`Message [${message.getId()}] has expired`);
      const { keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
      this.getGarbageCollectorInstance((gc) => {
        gc.getMessageCollector((messageCollector) => {
          messageCollector.collectExpiredMessage(
            message,
            keyConsumerProcessingQueue,
            () => {
              if (this.statsProvider)
                this.statsProvider.incrementAcknowledgedSlot();
              this.loggerInstance.info(
                `Message [${message.getId()}] successfully processed`,
              );
              this.emit(events.MESSAGE_NEXT);
            },
          );
        });
      });
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, () => {
      if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, (msg: Message) => {
      if (this.statsProvider) this.statsProvider.incrementUnacknowledgedSlot();
      const keys = this.getInstanceRedisKeys();
      this.getGarbageCollectorInstance((gc) => {
        gc.getMessageCollector((messageCollector) => {
          messageCollector.collectMessage(
            msg,
            keys.keyConsumerProcessingQueue,
            (err) => {
              if (err) this.handleError(err);
              else this.emit(events.MESSAGE_NEXT);
            },
          );
        });
      });
    });
    this.on(events.MESSAGE_CONSUME_TIMEOUT, (message: Message) => {
      this.handleConsumeFailure(
        message,
        new Error(
          `Consumer timed out after [${this.getConsumerMessageConsumeTimeout()}]`,
        ),
      );
    });
  }

  protected getGarbageCollectorInstance(
    cb: TUnitaryFunction<GarbageCollector>,
  ): void {
    if (!this.garbageCollectorInstance)
      this.emit(
        events.ERROR,
        new Error(`Expected an instance of GarbageCollector`),
      );
    else cb(this.garbageCollectorInstance);
  }

  protected getHeartBeatInstance(cb: TUnitaryFunction<Heartbeat>): void {
    if (!this.heartbeatInstance)
      this.emit(events.ERROR, new Error(`Expected an instance of HeartBeat`));
    else cb(this.heartbeatInstance);
  }

  protected getSchedulerRunnerInstance(
    cb: TUnitaryFunction<SchedulerRunner>,
  ): void {
    if (!this.schedulerRunnerInstance)
      this.emit(
        events.ERROR,
        new Error('Expected instance of SchedulerRunner'),
      );
    else cb(this.schedulerRunnerInstance);
  }

  protected setupQueues(client: RedisClient, cb: ICallback<void>): void {
    super.setupQueues(client, (err) => {
      if (err) cb(err);
      else {
        queueHelpers.setupConsumerQueues(
          client,
          this.getQueueName(),
          this.getId(),
          cb,
        );
      }
    });
  }

  protected bootstrap(cb: ICallback<void>) {
    super.bootstrap((err) => {
      if (err) cb(err);
      else {
        this.heartbeatInstance = new Heartbeat(this);
        this.garbageCollectorInstance = new GarbageCollector(this);
        this.schedulerRunnerInstance = new SchedulerRunner(this);
        cb();
      }
    });
  }

  protected handleConsume(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    const timeout = msg.getConsumeTimeout();
    const consumeTimeout =
      typeof timeout === 'number'
        ? timeout
        : this.getConsumerMessageConsumeTimeout();
    this.loggerInstance.info(`Processing message [${msg.getId()}]...`);
    const keys = this.getInstanceRedisKeys();
    try {
      if (consumeTimeout) {
        timer = setTimeout(() => {
          isTimeout = true;
          timer = null;
          this.emit(events.MESSAGE_CONSUME_TIMEOUT, msg);
        }, consumeTimeout);
      }
      const acknowledgeMessage = () => {
        this.getRedisInstance((client) => {
          client.rpop(keys.keyConsumerProcessingQueue, (err?: Error | null) => {
            if (err) this.handleError(err);
            else {
              this.loggerInstance.info(
                `Message [${msg.getId()}] successfully processed`,
              );
              this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
            }
          });
        });
      };
      const onConsumed = (err?: Error | null) => {
        if (this.powerManager.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err) this.handleConsumeFailure(msg, err);
          else acknowledgeMessage();
        }
      };
      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.consume(Message.createFromMessage(msg), onConsumed);
    } catch (error: unknown) {
      const err =
        error instanceof Error ? error : new Error(`Unexpected error`);
      this.handleConsumeFailure(msg, err);
    }
  }

  protected handleConsumeFailure(msg: Message, error: Error): void {
    this.loggerInstance.error(
      `Consumer failed to consume message [${msg.getId()}]...`,
    );
    this.loggerInstance.error(error);
    this.emit(events.MESSAGE_UNACKNOWLEDGED, msg);
  }

  abstract consume(msg: Message, cb: ICallback<void>): void;
}
