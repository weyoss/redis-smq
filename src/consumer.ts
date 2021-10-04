import { IConfig, IConsumerConstructorOptions, ICallback } from '../types';
import { Instance } from './instance';
import { Message } from './message';
import { ConsumerStatsProvider } from './stats-provider/consumer-stats-provider';
import { events } from './events';
import { HeartBeat } from './heartbeat';
import { GarbageCollector } from './gc';
import { SchedulerRunner } from './scheduler-runner';

export abstract class Consumer extends Instance {
  protected readonly options: IConsumerConstructorOptions;
  protected readonly consumerMessageTTL: number;
  protected readonly consumerMessageConsumeTimeout: number;
  protected readonly messageRetryThreshold: number;
  protected readonly messageRetryDelay: number;
  protected schedulerRunnerInstance: SchedulerRunner | null = null;
  protected statsProvider: ConsumerStatsProvider | null = null;
  protected garbageCollectorInstance: GarbageCollector | null = null;
  protected heartBeatInstance: ReturnType<typeof HeartBeat> | null = null;

  constructor(
    queueName: string,
    config: IConfig = {},
    options: IConsumerConstructorOptions = {},
  ) {
    super(queueName, config);
    this.options = options;
    this.consumerMessageTTL = +(options.messageTTL ?? 0);
    this.consumerMessageConsumeTimeout = +(options.messageConsumeTimeout ?? 0);
    this.messageRetryThreshold = +(options.messageRetryThreshold ?? 3);
    this.messageRetryDelay = +(options.messageRetryDelay ?? 0);
  }

  getConsumerMessageConsumeTimeout(): number {
    return this.consumerMessageConsumeTimeout;
  }

  getMessageRetryThreshold(): number {
    return this.messageRetryThreshold;
  }

  getConsumerMessageTTL(): number {
    return this.consumerMessageTTL;
  }

  getMessageRetryDelay(): number {
    return this.messageRetryDelay;
  }

  getOptions(): IConsumerConstructorOptions {
    return this.options;
  }

  protected getStatsProvider(): ConsumerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ConsumerStatsProvider(this);
    }
    return this.statsProvider;
  }

  protected getNextMessage(): void {
    this.loggerInstance.info('Waiting for new messages...');
    const { keyQueue, keyConsumerProcessingQueue } = this.redisKeys;
    this.getRedisInstance().brpoplpush(
      keyQueue,
      keyConsumerProcessingQueue,
      0,
      (err, json) => {
        if (err) this.error(err);
        else if (!json) throw new Error();
        else {
          this.loggerInstance.info('Got new message...');
          const message = Message.createFromMessage(json);
          this.emit(events.MESSAGE_RECEIVED, message);
        }
      },
    );
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
    this.on(events.HEARTBEAT_DOWN, () =>
      this.handleShutdownEvent(events.HEARTBEAT_DOWN),
    );
    this.on(events.GC_UP, () => this.handleStartupEvent(events.GC_UP));
    this.on(events.GC_DOWN, () => this.handleShutdownEvent(events.GC_DOWN));
    this.on(events.GOING_UP, () => {
      this.getHeartBeatInstance().start();
      this.getGarbageCollectorInstance().start();
      this.getSchedulerRunnerInstance().start();
    });
    this.on(events.GOING_DOWN, () => {
      this.getHeartBeatInstance().stop();
      this.getGarbageCollectorInstance().stop();
      this.getSchedulerRunnerInstance().stop();
    });
    this.on(events.DOWN, () => {
      this.garbageCollectorInstance = null;
      this.heartBeatInstance = null;
      this.statsProvider = null;
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
      const messageCollector =
        this.getGarbageCollectorInstance().getMessageCollector();
      if (this.powerManager.isRunning()) {
        if (this.statsProvider) this.statsProvider.incrementProcessingSlot();
        if (messageCollector.hasMessageExpired(message)) {
          this.emit(events.MESSAGE_EXPIRED, message);
        } else this.handleConsume(message);
      }
    });
    this.on(events.MESSAGE_EXPIRED, (message: Message) => {
      this.loggerInstance.info(`Message [${message.getId()}] has expired`);
      const { keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
      const messageCollector =
        this.getGarbageCollectorInstance().getMessageCollector();
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
      this.expired(message)
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, () => {
      if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, (msg: Message) => {
      if (this.statsProvider) this.statsProvider.incrementUnacknowledgedSlot();
      const keys = this.getInstanceRedisKeys();
      const messageCollector =
        this.getGarbageCollectorInstance().getMessageCollector();
      messageCollector.collectMessage(
        msg,
        keys.keyConsumerProcessingQueue,
        (err) => {
          if (err) this.error(err);
          else this.emit(events.MESSAGE_NEXT);
        },
      );
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

  protected setupHeartBeat(): void {
    this.heartBeatInstance = HeartBeat(this);
  }

  protected setupGarbageCollector(): void {
    this.garbageCollectorInstance = new GarbageCollector(this);
  }

  protected getGarbageCollectorInstance(): GarbageCollector {
    if (!this.garbageCollectorInstance) {
      throw new Error(`Expected an instance of GarbageCollector`);
    }
    return this.garbageCollectorInstance;
  }

  protected getHeartBeatInstance(): ReturnType<typeof HeartBeat> {
    if (!this.heartBeatInstance) {
      throw new Error(`Expected an instance of HeartBeat`);
    }
    return this.heartBeatInstance;
  }

  protected getSchedulerRunnerInstance(): SchedulerRunner {
    if (!this.schedulerRunnerInstance) {
      throw new Error('Expected instance of SchedulerRunner');
    }
    return this.schedulerRunnerInstance;
  }

  protected setupSchedulerRunner() {
    this.schedulerRunnerInstance = new SchedulerRunner(
      this.getQueueName(),
      this.config,
    );
    this.schedulerRunnerInstance.on(events.SCHEDULER_RUNNER_UP, () =>
      this.handleStartupEvent(events.SCHEDULER_RUNNER_UP),
    );
    this.schedulerRunnerInstance.on(events.SCHEDULER_RUNNER_DOWN, () => {
      this.schedulerRunnerInstance = null;
      this.handleShutdownEvent(events.SCHEDULER_RUNNER_DOWN);
    });
  }

  protected setupQueues(): void {
    this.getQueueInstance().setupConsumerQueues(
      this.getQueueName(),
      this.getId(),
      (err) => {
        if (err) this.error(err);
        else super.setupQueues();
      },
    );
  }

  protected bootstrap() {
    super.bootstrap();
    this.setupHeartBeat();
    this.setupGarbageCollector();
    this.setupSchedulerRunner();
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
        this.getRedisInstance().rpop(
          keys.keyConsumerProcessingQueue,
          (err?: Error | null) => {
            if (err) this.error(err);
            else {
              this.loggerInstance.info(
                `Message [${msg.getId()}] successfully processed`,
              );
              this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
            }
          },
        );
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
  abstract expired(msg: Message): void;
}
