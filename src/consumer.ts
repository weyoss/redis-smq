import {
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
  TConsumerOptions,
  TUnaryFunction,
} from '../types';
import { Instance } from './instance';
import { Message } from './message';
import { ConsumerStatsProvider } from './stats-provider/consumer-stats-provider';
import { events } from './events';
import { Heartbeat } from './heartbeat';
import { GarbageCollector } from './gc';
import { SchedulerRunner } from './scheduler-runner';
import { RedisClient } from './redis-client';

export abstract class Consumer extends Instance {
  protected options: TConsumerOptions = {
    messageConsumeTimeout: 0,
    messageRetryThreshold: 3,
    messageRetryDelay: 60,
    messageTTL: 0,
  };

  // exclusive redis clients
  protected consumerRedisClient: RedisClient | null = null;
  protected heartbeatRedisClient: RedisClient | null = null;
  protected gcRedisClient: RedisClient | null = null;
  protected schedulerRunnerRedisClient: RedisClient | null = null;

  protected schedulerRunnerInstance: SchedulerRunner | null = null;
  protected garbageCollectorInstance: GarbageCollector | null = null;
  protected heartbeatInstance: Heartbeat | null = null;
  protected statsProvider: ConsumerStatsProvider | null = null;

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

  protected getConsumerRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.consumerRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.consumerRedisClient);
  }

  protected getGarbageCollector(cb: TUnaryFunction<GarbageCollector>): void {
    if (!this.garbageCollectorInstance)
      this.emit(
        events.ERROR,
        new Error('Expected an instance of GarbageCollector'),
      );
    else cb(this.garbageCollectorInstance);
  }

  protected getHeartbeat(cb: TUnaryFunction<Heartbeat>): void {
    if (!this.heartbeatInstance)
      this.emit(events.ERROR, new Error('Expected an instance of Heartbeat'));
    else cb(this.heartbeatInstance);
  }

  protected getSchedulerRunner(cb: TUnaryFunction<SchedulerRunner>): void {
    if (!this.schedulerRunnerInstance)
      this.emit(
        events.ERROR,
        new Error('Expected an instance of SchedulerRunner'),
      );
    else cb(this.schedulerRunnerInstance);
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.UP, () => this.emit(events.MESSAGE_NEXT));
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.getConsumerRedisClient((client) => {
          this.loggerInstance.info('Waiting for new messages...');
          this.getBroker((broker) => {
            broker.dequeueMessage(client, this.getOptions());
          });
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
      const { keyQueueProcessing } = this.getInstanceRedisKeys();
      this.getConsumerRedisClient((client) => {
        this.getBroker((broker) => {
          broker.handleMessageWithExpiredTTL(
            client,
            message,
            keyQueueProcessing,
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
      });
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, () => {
      if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, () => {
      if (this.statsProvider) this.statsProvider.incrementUnacknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_CONSUME_TIMEOUT, (message: Message) => {
      this.getConsumerRedisClient((client) => {
        this.getBroker((broker) => {
          broker.unacknowledgeMessage(
            client,
            message,
            EMessageUnacknowledgedCause.TIMEOUT,
            this.getOptions(),
          );
        });
      });
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
          if (err)
            this.unacknowledgeMessage(
              msg,
              EMessageUnacknowledgedCause.UNACKNOWLEDGED,
              err,
            );
          else
            this.getConsumerRedisClient((client) => {
              this.getBroker((broker) => {
                broker.acknowledgeMessage(client, msg, (err) => {
                  if (err) this.emit(events.ERROR, err);
                  else {
                    this.loggerInstance.info(
                      `Message [${msg.getId()}] successfully processed`,
                    );
                    this.emit(events.MESSAGE_ACKNOWLEDGED, msg, this.queueName);
                  }
                });
              });
            });
        }
      };
      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.consume(Message.createFromMessage(msg), onConsumed);
    } catch (error: unknown) {
      const err =
        error instanceof Error ? error : new Error(`Unexpected error`);
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgedCause.CAUGHT_ERROR,
        err,
      );
    }
  }

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    this.getConsumerRedisClient((client) => {
      this.getBroker((broker) => {
        broker.unacknowledgeMessage(
          client,
          msg,
          EMessageUnacknowledgedCause.CAUGHT_ERROR,
          this.getOptions(),
          err,
        );
      });
    });
  }

  goingUp(): TUnaryFunction<ICallback<void>>[] {
    //return super.goingUp();
    const setupConsumerRedisClient = (cb: ICallback<void>): void => {
      RedisClient.getNewInstance(this.config, (client) => {
        this.consumerRedisClient = client;
        cb();
      });
    };
    const startHeartbeat = (cb: ICallback<void>) => {
      RedisClient.getNewInstance(this.config, (client) => {
        this.heartbeatRedisClient = client;
        this.heartbeatInstance = new Heartbeat(this, client);
        cb();
      });
    };
    const startGC = (cb: ICallback<void>) => {
      RedisClient.getNewInstance(this.config, (client) => {
        this.gcRedisClient = client;
        this.garbageCollectorInstance = new GarbageCollector(this, client);
        cb();
      });
    };
    const startSchedulerRunner = (cb: ICallback<void>) => {
      RedisClient.getNewInstance(this.config, (client) => {
        this.schedulerRunnerRedisClient = client;
        this.schedulerRunnerInstance = new SchedulerRunner(this, client);
        cb();
      });
    };
    return super
      .goingUp()
      .concat([
        setupConsumerRedisClient,
        startHeartbeat,
        startGC,
        startSchedulerRunner,
      ]);
  }

  goingDown(): TUnaryFunction<ICallback<void>>[] {
    //return super.goingDown();
    const stopSchedulerRunner = (cb: ICallback<void>) => {
      this.getSchedulerRunner((schedulerRunner) => {
        schedulerRunner.quit(() => {
          this.schedulerRunnerRedisClient?.halt(() => {
            this.schedulerRunnerRedisClient = null;
            cb();
          });
        });
      });
    };
    const stopGC = (cb: ICallback<void>) => {
      this.getGarbageCollector((gc) => {
        gc.quit(() => {
          this.gcRedisClient?.halt(() => {
            this.gcRedisClient = null;
            cb();
          });
        });
      });
    };
    const stopHeartbeat = (cb: ICallback<void>) => {
      this.getHeartbeat((heartbeat) => {
        heartbeat.quit(() => {
          this.heartbeatRedisClient?.halt(() => {
            this.heartbeatRedisClient = null;
            cb();
          });
        });
      });
    };
    const stopConsumerRedisClient = (cb: ICallback<void>) => {
      this.consumerRedisClient?.halt(() => {
        this.consumerRedisClient = null;
        cb();
      });
    };
    return [
      stopSchedulerRunner,
      stopGC,
      stopHeartbeat,
      stopConsumerRedisClient,
    ].concat(super.goingDown());
  }

  abstract consume(msg: Message, cb: ICallback<void>): void;
}
