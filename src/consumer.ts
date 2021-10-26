import {
  EMessageUnacknowledgedCause,
  ICallback,
  TUnaryFunction,
} from '../types';
import { Instance } from './system/instance';
import { Message } from './message';
import { ConsumerStatsProvider } from './system/stats-provider/consumer-stats-provider';
import { events } from './system/events';
import { Heartbeat } from './system/heartbeat';
import { GarbageCollector } from './system/gc';
import { SchedulerRunner } from './system/scheduler-runner';
import { RedisClient } from './system/redis-client/redis-client';

export abstract class Consumer extends Instance {
  // exclusive redis clients
  private consumerRedisClient: RedisClient | null = null;
  private heartbeatRedisClient: RedisClient | null = null;
  private gcRedisClient: RedisClient | null = null;

  private schedulerRunner: SchedulerRunner | null = null;
  private garbageCollector: GarbageCollector | null = null;
  private heartbeat: Heartbeat | null = null;
  private statsProvider: ConsumerStatsProvider | null = null;

  private getConsumerRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.consumerRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.consumerRedisClient);
  }

  private getGarbageCollector(cb: TUnaryFunction<GarbageCollector>): void {
    if (!this.garbageCollector)
      this.emit(
        events.ERROR,
        new Error('Expected an instance of GarbageCollector'),
      );
    else cb(this.garbageCollector);
  }

  private getHeartbeat(cb: TUnaryFunction<Heartbeat>): void {
    if (!this.heartbeat)
      this.emit(events.ERROR, new Error('Expected an instance of Heartbeat'));
    else cb(this.heartbeat);
  }

  private getSchedulerRunner(cb: TUnaryFunction<SchedulerRunner>): void {
    if (!this.schedulerRunner)
      this.emit(
        events.ERROR,
        new Error('Expected an instance of SchedulerRunner'),
      );
    else cb(this.schedulerRunner);
  }

  private handleConsume(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    this.logger.info(`Processing message [${msg.getId()}]...`);
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
            this.getBroker((broker) => {
              broker.acknowledgeMessage(this, msg, (err) => {
                if (err) this.emit(events.ERROR, err);
                else {
                  this.logger.info(
                    `Message [${msg.getId()}] successfully processed`,
                  );
                  this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                }
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

  private unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    this.getConsumerRedisClient((client) => {
      this.getBroker((broker) => {
        broker.unacknowledgeMessage(client, this, msg, cause, err);
      });
    });
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.UP, () => this.emit(events.MESSAGE_NEXT));
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.getConsumerRedisClient((client) => {
          this.logger.info('Waiting for new messages...');
          this.getBroker((broker) => {
            broker.dequeueMessage(client, this, (err, msgStr) => {
              if (err) this.emit(events.ERROR, err);
              else if (!msgStr)
                this.emit(
                  events.ERROR,
                  new Error('Expected a non empty string'),
                );
              else this.handleReceivedMessage(msgStr);
            });
          });
        });
      }
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
            this,
            message,
            EMessageUnacknowledgedCause.TIMEOUT,
          );
        });
      });
    });
  }

  protected handleReceivedMessage(json: string): void {
    const message = Message.createFromMessage(json);
    this.emit(events.MESSAGE_DEQUEUED, message);
    if (message.hasExpired()) {
      this.getConsumerRedisClient((client) => {
        this.getBroker((broker) =>
          broker.unacknowledgeMessage(
            client,
            this,
            message,
            EMessageUnacknowledgedCause.TTL_EXPIRED,
          ),
        );
      });
    } else {
      this.logger.info(`Consuming message [${message.getId()}] ...`);
      if (this.statsProvider) this.statsProvider.incrementProcessingSlot();
      this.handleConsume(message);
    }
  }

  protected goingUp(): TUnaryFunction<ICallback<void>>[] {
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
        this.heartbeat = new Heartbeat(this, client);
        cb();
      });
    };
    const startGC = (cb: ICallback<void>) => {
      RedisClient.getNewInstance(this.config, (client) => {
        this.gcRedisClient = client;
        this.garbageCollector = new GarbageCollector(this, client);
        cb();
      });
    };
    const startSchedulerRunner = (cb: ICallback<void>) => {
      this.getScheduler((scheduler) => {
        this.schedulerRunner = new SchedulerRunner(
          this.queueName,
          this.config,
          scheduler,
        );
        this.schedulerRunner.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
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

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    //return super.goingDown();
    const stopSchedulerRunner = (cb: ICallback<void>) => {
      this.getSchedulerRunner((schedulerRunner) => {
        schedulerRunner.quit(() => {
          this.schedulerRunner = null;
          cb();
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

  getStatsProvider(): ConsumerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ConsumerStatsProvider(this);
    }
    return this.statsProvider;
  }

  abstract consume(msg: Message, cb: ICallback<void>): void;
}
