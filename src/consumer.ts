import { IConfig, TConsumerOptions, ICallback, TUnaryFunction } from '../types';
import { Instance } from './instance';
import { Message } from './message';
import { ConsumerStatsProvider } from './stats-provider/consumer-stats-provider';
import { events } from './events';
import { Heartbeat } from './heartbeat';
import { GarbageCollector } from './gc';
import { SchedulerRunner } from './scheduler-runner';
import { RedisClient } from './redis-client';

export abstract class Consumer extends Instance {
  protected schedulerRunnerInstance: SchedulerRunner;
  protected garbageCollectorInstance: GarbageCollector;
  protected heartbeatInstance: Heartbeat;
  protected statsProvider: ConsumerStatsProvider | null = null;
  protected options: TConsumerOptions = {
    messageConsumeTimeout: 0,
    messageRetryThreshold: 3,
    messageRetryDelay: 60,
    messageTTL: 0,
  };
  protected redisClient: RedisClient | null = null;

  constructor(
    queueName: string,
    config: IConfig = {},
    options: Partial<TConsumerOptions> = {},
  ) {
    super(queueName, config);
    this.options = {
      ...this.options,
      ...options,
    };
    this.heartbeatInstance = new Heartbeat(this);
    this.garbageCollectorInstance = new GarbageCollector(this);
    this.schedulerRunnerInstance = new SchedulerRunner(this);
  }

  getOptions(): TConsumerOptions {
    return this.options;
  }

  getStatsProvider(): ConsumerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ConsumerStatsProvider(this);
    }
    return this.statsProvider;
  }

  protected hasGoneUp(): boolean {
    return (
      super.hasGoneUp() &&
      this.startupFiredEvents.includes(events.GC_UP) &&
      this.startupFiredEvents.includes(events.HEARTBEAT_UP) &&
      this.startupFiredEvents.includes(events.SCHEDULER_RUNNER_UP)
    );
  }

  protected isReadyToGoDown(): boolean {
    return (
      super.isReadyToGoDown() &&
      this.shutdownFiredEvents.includes(events.HEARTBEAT_DOWN) &&
      this.shutdownFiredEvents.includes(events.GC_DOWN) &&
      this.shutdownFiredEvents.includes(events.SCHEDULER_RUNNER_DOWN)
    );
  }

  protected getRedisClient(cb: TUnaryFunction<RedisClient>) {
    if (!this.redisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.redisClient);
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.HEARTBEAT_UP, () =>
      this.handleStartupEvent(events.HEARTBEAT_UP),
    );
    this.on(events.HEARTBEAT_DOWN, () => {
      this.handleShutdownEvent(events.HEARTBEAT_DOWN);
    });
    this.on(events.GC_UP, () => this.handleStartupEvent(events.GC_UP));
    this.on(events.GC_DOWN, () => {
      this.handleShutdownEvent(events.GC_DOWN);
    });
    this.on(events.SCHEDULER_RUNNER_UP, () =>
      this.handleStartupEvent(events.SCHEDULER_RUNNER_UP),
    );
    this.on(events.SCHEDULER_RUNNER_DOWN, () => {
      this.handleShutdownEvent(events.SCHEDULER_RUNNER_DOWN);
    });
    this.on(events.GOING_UP, () => {
      RedisClient.getInstance(this.config, (client) => {
        this.redisClient = client;
        this.heartbeatInstance.start();
        this.garbageCollectorInstance.start();
        this.schedulerRunnerInstance.start();
      });
    });
    this.on(events.GOING_DOWN, () => {
      if (this.redisClient) {
        this.redisClient.end(true);
        this.redisClient = null;
      }
      this.heartbeatInstance.stop();
      this.garbageCollectorInstance.stop();
      this.schedulerRunnerInstance.stop();
    });
    this.on(events.UP, () => {
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.getRedisClient((client) => {
          this.loggerInstance.info('Waiting for new messages...');
          this.getBroker().dequeueMessage(client, this.getOptions());
        });
      }
    });
    this.on(events.MESSAGE_RECEIVED, (message: Message) => {
      this.loggerInstance.info('Got new message...');
      if (this.powerManager.isRunning()) {
        if (this.statsProvider) this.statsProvider.incrementProcessingSlot();
        this.handleConsume(message);
      }
    });
    this.on(events.MESSAGE_EXPIRED, (message: Message) => {
      this.loggerInstance.info(`Message [${message.getId()}] has expired`);
      const { keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
      this.getBroker().dequeueExpiredMessage(
        message,
        keyConsumerProcessingQueue,
        (err) => {
          if (err) this.emit(events.ERROR, err);
          else {
            this.loggerInstance.info(
              `Expired message [${message.getId()}] has been deleted`,
            );
            if (this.statsProvider)
              this.statsProvider.incrementAcknowledgedSlot();
            this.emit(events.MESSAGE_NEXT);
          }
        },
      );
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, () => {
      if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, (message: Message) => {
      if (this.statsProvider) this.statsProvider.incrementUnacknowledgedSlot();
      const { keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
      this.getBroker().retry(
        message,
        keyConsumerProcessingQueue,
        this.getOptions(),
        (err) => {
          if (err) this.emit(events.ERROR, err);
          else this.emit(events.MESSAGE_NEXT);
        },
      );
    });
    this.on(events.MESSAGE_CONSUME_TIMEOUT, (message: Message) => {
      this.handleConsumeFailure(message, new Error(`Consumer timed out.`));
    });
  }

  protected handleConsume(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    this.loggerInstance.info(`Processing message [${msg.getId()}]...`);
    try {
      const consumeTimeout = msg.getConsumeTimeout();
      if (consumeTimeout) {
        timer = setTimeout(() => {
          isTimeout = true;
          timer = null;
          this.emit(events.MESSAGE_CONSUME_TIMEOUT, msg);
        }, consumeTimeout);
      }
      const onConsumed = (err?: Error | null) => {
        if (this.powerManager.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err) this.handleConsumeFailure(msg, err);
          else
            this.getBroker().acknowledgeMessage((err) => {
              if (err) this.emit(events.ERROR, err);
              else {
                this.loggerInstance.info(
                  `Message [${msg.getId()}] successfully processed`,
                );
                this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
              }
            });
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
