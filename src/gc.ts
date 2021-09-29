import * as async from 'async';
import { LockManager } from './lock-manager';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import { Ticker } from './ticker';
import { events } from './events';
import { Message } from './message';
import { Heartbeat } from './heartbeat';
import { GCMessageCollector } from './gc-message-collector';
import { RedisClient } from './redis-client';
import {
  ICallback,
  IConfig,
  IConsumerConstructorOptions,
  TUnitaryFunction,
} from '../types';
import { redisKeys } from './redis-keys';
import BLogger from 'bunyan';
import { Consumer } from './consumer';
import { queueHelpers } from './queue-helpers';

const GC_INSPECTION_INTERVAL = 1000; // in ms

export class GarbageCollector {
  protected consumer: Consumer;
  protected consumerId: string;
  protected queueName: string;
  protected keyLockGC: string;
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected config: IConfig;
  protected consumerOptions: Required<IConsumerConstructorOptions>;
  protected lockManagerInstance: LockManager | null = null;
  protected redisClientInstance: RedisClient | null = null;
  protected ticker: Ticker | null = null;
  protected gcMessageCollector: GCMessageCollector | null = null;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    this.queueName = consumer.getQueueName();
    this.consumerId = consumer.getId();
    this.config = consumer.getConfig();
    this.consumerOptions = consumer.getOptions();
    const { keyLockGC } = consumer.getInstanceRedisKeys();
    this.keyLockGC = keyLockGC;
    this.logger = Logger(
      `gc (${this.queueName}/${this.consumerId})`,
      this.config.log,
    );
    this.powerManager = new PowerManager();
  }

  getRedisInstance(cb: TUnitaryFunction<RedisClient>): void {
    if (!this.redisClientInstance)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of RedisClient`),
      );
    else cb(this.redisClientInstance);
  }

  protected getLockManagerInstance(cb: TUnitaryFunction<LockManager>): void {
    if (!this.lockManagerInstance)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of LockManager`),
      );
    else cb(this.lockManagerInstance);
  }

  protected getTicker(cb: TUnitaryFunction<Ticker>): void {
    if (!this.ticker)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of Ticker`),
      );
    else cb(this.ticker);
  }

  protected debug(message: string): void {
    this.logger.debug({ gc: true }, message);
  }

  protected destroyQueue(
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.getRedisInstance((client) => {
      queueHelpers.deleteProcessingQueue(
        client,
        this.queueName,
        processingQueueName,
        (err?: Error | null) => {
          if (err) cb(err);
          else {
            this.debug(`Processing queue [${processingQueueName}] deleted.`);
            this.consumer.emit(events.GC_QUEUE_DESTROYED, processingQueueName);
            cb();
          }
        },
      );
    });
  }

  protected handleOfflineConsumer(
    consumerId: string,
    queue: string,
    cb: ICallback<void>,
  ): void {
    this.debug(
      `Inspecting consumer [${consumerId}] processing queue [${queue}] ...`,
    );
    this.getRedisInstance((client) => {
      client.lrange(
        queue,
        0,
        0,
        (err?: Error | null, range?: string[] | null) => {
          if (err) cb(err);
          else if (range && range.length) {
            const msg = Message.createFromMessage(range[0]);
            this.debug(
              `Fetched message ID [${msg.getId()}] from consumer [${consumerId}] processing queue [${queue}].`,
            );
            this.getMessageCollector((messageCollector) => {
              messageCollector.collectMessage(msg, queue, (err) => {
                if (err) cb(err);
                else {
                  this.consumer.emit(events.GC_MESSAGE_COLLECTED, msg, queue);
                  this.debug(`Message ID ${msg.getId()} collected.`);
                  this.destroyQueue(queue, cb);
                }
              });
            });
          } else {
            this.destroyQueue(queue, cb);
          }
        },
      );
    });
  }

  protected handleProcessingQueue(queue: string, cb: ICallback<void>): void {
    this.debug(`Inspecting processing queue [${queue}]... `);
    const extractedData = redisKeys.extractData(queue);
    if (!extractedData || !extractedData.consumerId) {
      cb(new Error(`Invalid extracted consumer data`));
    } else {
      const { queueName, consumerId } = extractedData;
      if (consumerId !== this.consumerId) {
        this.debug(`Is consumer ID [${consumerId}] alive?`);
        this.getRedisInstance((client) => {
          Heartbeat.isOnline(
            { client: client, queueName, id: consumerId },
            (err, online) => {
              if (err) cb(err);
              else if (online) {
                this.debug(`Consumer [${consumerId}] is online.`);
                cb();
              } else {
                this.debug(`Consumer ID [${consumerId}] seems to be offline.`);
                this.consumer.emit(
                  events.GC_CONSUMER_OFFLINE,
                  consumerId,
                  queue,
                );
                this.handleOfflineConsumer(consumerId, queue, cb);
              }
            },
          );
        });
      } else {
        this.debug(`Consumer [${consumerId}]: The consumer is online.`);
        cb();
      }
    }
  }

  protected handleProcessingQueues(
    queues: string[],
    cb: ICallback<void>,
  ): void {
    async.each<string, Error>(
      queues,
      (queue: string, cb) => {
        this.handleProcessingQueue(queue, cb);
      },
      cb,
    );
  }

  protected onTick() {
    if (this.powerManager.isRunning()) {
      this.getLockManagerInstance((lockManager) => {
        lockManager.acquireLock(
          this.keyLockGC,
          10000,
          false,
          (error, acquired) => {
            if (error) this.consumer.emit(events.ERROR, error);
            else {
              this.getTicker((ticker) => {
                if (acquired) {
                  this.consumer.emit(events.GC_LOCK_ACQUIRED, this.consumerId);
                  this.debug('Inspecting processing queues...');
                  this.getRedisInstance((client) => {
                    queueHelpers.getProcessingQueues(
                      client,
                      this.queueName,
                      (e?: Error | null, result?: string[] | null) => {
                        if (e) this.consumer.emit(events.ERROR, e);
                        else if (result) {
                          this.debug(
                            `Fetched [${result.length}] processing queues`,
                          );
                          this.handleProcessingQueues(result, (err) => {
                            if (err) this.consumer.emit(events.ERROR, err);
                            else ticker.nextTick();
                          });
                        } else {
                          this.debug(
                            'No processing queues found. Waiting for next tick...',
                          );
                          ticker.nextTick();
                        }
                      },
                    );
                  });
                } else ticker.nextTick();
              });
            }
          },
        );
      });
    }
    if (this.powerManager.isGoingDown()) {
      this.consumer.emit(events.GC_READY_TO_SHUTDOWN);
    }
  }

  protected setupTicker() {
    this.ticker = new Ticker(() => {
      this.onTick();
    }, GC_INSPECTION_INTERVAL);
    this.ticker.on(events.ERROR, (err: Error) =>
      this.consumer.emit(events.ERROR, err),
    );
  }

  start(): void {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (client) => {
      this.redisClientInstance = client;
      this.lockManagerInstance = new LockManager(client);
      this.gcMessageCollector = new GCMessageCollector(this.consumer, client);
      this.setupTicker();
      this.powerManager.commit();
      this.consumer.emit(events.GC_UP);
      this.onTick();
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    this.consumer.once(events.GC_READY_TO_SHUTDOWN, () => {
      this.getTicker((ticker) => {
        ticker.shutdown();
        this.getLockManagerInstance((lockManager) => {
          lockManager.quit(() => {
            this.getRedisInstance((client) => {
              client.end(true);
              this.lockManagerInstance = null;
              this.redisClientInstance = null;
              this.gcMessageCollector = null;
              this.ticker = null;
              this.powerManager.commit();
              this.consumer.emit(events.GC_DOWN);
            });
          });
        });
      });
    });
  }

  getMessageCollector(cb: TUnitaryFunction<GCMessageCollector>): void {
    if (!this.gcMessageCollector)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of GCMessageCollector`),
      );
    else cb(this.gcMessageCollector);
  }
}
