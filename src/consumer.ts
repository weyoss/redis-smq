import {
  EMessageUnacknowledgedCause,
  ICallback,
  TUnaryFunction,
} from '../types';
import { Instance } from './system/instance';
import { Message } from './message';
import { ConsumerRatesProvider } from './system/rates-provider/consumer-rates-provider';
import { events } from './system/events';
import { Heartbeat } from './system/heartbeat';
import { RedisClient } from './system/redis-client/redis-client';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';

export abstract class Consumer extends Instance {
  // exclusive redis clients
  private consumerRedisClient: RedisClient | null = null;
  private heartbeatRedisClient: RedisClient | null = null;

  private heartbeat: Heartbeat | null = null;
  private ratesProvider: ConsumerRatesProvider | null = null;

  protected gcWorkerThread: ChildProcess | null = null;
  protected scheduleWorkerThread: ChildProcess | null = null;
  protected requeueWorkerThread: ChildProcess | null = null;
  protected delayWorkerThread: ChildProcess | null = null;

  private getConsumerRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.consumerRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.consumerRedisClient);
  }

  private getHeartbeat(cb: TUnaryFunction<Heartbeat>): void {
    if (!this.heartbeat)
      this.emit(events.ERROR, new Error('Expected an instance of Heartbeat'));
    else cb(this.heartbeat);
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
          this.unacknowledgeMessage(msg, EMessageUnacknowledgedCause.TIMEOUT);
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
              const { keyQueueProcessing } = this.redisKeys;
              broker.acknowledgeMessage(
                this.queueName,
                keyQueueProcessing,
                msg,
                (err) => {
                  if (err) this.emit(events.ERROR, err);
                  else {
                    this.logger.info(
                      `Message [${msg.getId()}] successfully processed`,
                    );
                    this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                  }
                },
              );
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
        const { keyQueueProcessing } = this.redisKeys;
        broker.unacknowledgeMessage(
          client,
          this.queueName,
          keyQueueProcessing,
          msg,
          cause,
          err,
          (err) => {
            if (err) this.emit(events.ERROR, err);
            else this.emit(events.MESSAGE_UNACKNOWLEDGED, msg, cause);
          },
        );
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
      if (this.ratesProvider) this.ratesProvider.incrementAcknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_UNACKNOWLEDGED, () => {
      if (this.ratesProvider) this.ratesProvider.incrementUnacknowledgedSlot();
      this.emit(events.MESSAGE_NEXT);
    });
    process.once('exit', () => {
      if (this.gcWorkerThread) this.gcWorkerThread.kill();
      if (this.requeueWorkerThread) this.requeueWorkerThread.kill();
      if (this.delayWorkerThread) this.delayWorkerThread.kill();
      if (this.scheduleWorkerThread) this.scheduleWorkerThread.kill();
    });
  }

  protected startThread(path: string): ChildProcess {
    const thread = fork(path);
    thread.on('error', (err) => {
      this.emit(events.ERROR, err);
    });
    thread.on('exit', (code, signal) => {
      this.emit(
        events.ERROR,
        new Error(
          `Thread [${path}] exited with code ${code} and signal ${signal}`,
        ),
      );
    });
    thread.send(JSON.stringify(this.config));
    return thread;
  }

  protected handleReceivedMessage(json: string): void {
    const message = Message.createFromMessage(json);
    this.emit(events.MESSAGE_DEQUEUED, message);
    if (message.hasExpired()) {
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else {
      this.logger.info(`Consuming message [${message.getId()}] ...`);
      if (this.ratesProvider) this.ratesProvider.incrementProcessingSlot();
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
    const startGCWorker = (cb: ICallback<void>) => {
      this.gcWorkerThread = this.startThread(
        resolve(`${__dirname}/system/workers/gc.worker.js`),
      );
      cb();
    };
    const startRequeueWorker = (cb: ICallback<void>) => {
      this.requeueWorkerThread = this.startThread(
        resolve(`${__dirname}/system/workers/requeue.worker.js`),
      );
      cb();
    };
    const startDelayWorker = (cb: ICallback<void>) => {
      this.delayWorkerThread = this.startThread(
        resolve(`${__dirname}/system/workers/delay.worker.js`),
      );
      cb();
    };
    const startScheduleWorker = (cb: ICallback<void>) => {
      this.scheduleWorkerThread = this.startThread(
        resolve(`${__dirname}/system/workers/schedule.worker.js`),
      );
      cb();
    };
    return super
      .goingUp()
      .concat([
        setupConsumerRedisClient,
        startHeartbeat,
        startGCWorker,
        startDelayWorker,
        startRequeueWorker,
        startScheduleWorker,
      ]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    //return super.goingDown();
    const stopScheduleWorker = (cb: ICallback<void>) => {
      if (this.scheduleWorkerThread) {
        this.scheduleWorkerThread.once('exit', () => {
          this.scheduleWorkerThread = null;
          cb();
        });
        this.scheduleWorkerThread.kill('SIGHUP');
      } else cb();
    };
    const stopGCWorker = (cb: ICallback<void>) => {
      if (this.gcWorkerThread) {
        this.gcWorkerThread.once('exit', () => {
          this.gcWorkerThread = null;
          cb();
        });
        this.gcWorkerThread.kill('SIGHUP');
      } else cb();
    };
    const stopRequeueWorker = (cb: ICallback<void>) => {
      if (this.requeueWorkerThread) {
        this.requeueWorkerThread.once('exit', () => {
          this.requeueWorkerThread = null;
          cb();
        });
        this.requeueWorkerThread.kill('SIGHUP');
      } else cb();
    };
    const stopDelayWorker = (cb: ICallback<void>) => {
      if (this.delayWorkerThread) {
        this.delayWorkerThread.once('exit', () => {
          this.delayWorkerThread = null;
          cb();
        });
        this.delayWorkerThread.kill('SIGHUP');
      } else cb();
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
      stopScheduleWorker,
      stopGCWorker,
      stopDelayWorker,
      stopRequeueWorker,
      stopHeartbeat,
      stopConsumerRedisClient,
    ].concat(super.goingDown());
  }

  getStatsProvider(): ConsumerRatesProvider {
    if (!this.ratesProvider) {
      this.ratesProvider = new ConsumerRatesProvider(this);
    }
    return this.ratesProvider;
  }

  abstract consume(msg: Message, cb: ICallback<void>): void;
}
