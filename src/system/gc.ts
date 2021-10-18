import * as async from 'async';
import { LockManager } from './lock-manager';
import { Logger } from './logger';
import { Ticker } from './ticker';
import { events } from './events';
import { Message } from '../message';
import { Heartbeat } from './heartbeat';
import { RedisClient } from './redis-client';
import { EMessageUnacknowledgedCause, ICallback, IConfig } from '../../types';
import { redisKeys } from './redis-keys';
import BLogger from 'bunyan';
import { Consumer } from '../consumer';
import { QueueManager } from './queue-manager';
import { EventEmitter } from 'events';

const GC_INSPECTION_INTERVAL = 1000; // in ms

export class GarbageCollector extends EventEmitter {
  protected consumer: Consumer;
  protected consumerId: string;
  protected queueName: string;
  protected keyLockGC: string;
  protected logger: BLogger;
  protected config: IConfig;
  protected lockManagerInstance: LockManager;
  protected redisClientInstance: RedisClient;
  protected ticker: Ticker;
  protected queueManager: QueueManager;

  constructor(consumer: Consumer, client: RedisClient) {
    super();
    this.consumer = consumer;
    this.queueName = consumer.getQueueName();
    this.consumerId = consumer.getId();
    this.config = consumer.getConfig();
    const { keyLockGC } = consumer.getRedisKeys();
    this.keyLockGC = keyLockGC;
    this.logger = Logger(
      `gc (${this.queueName}/${this.consumerId})`,
      this.config.log,
    );
    this.redisClientInstance = client;
    this.lockManagerInstance = new LockManager(client);
    this.queueManager = new QueueManager(client);

    this.ticker = new Ticker(() => {
      this.onTick();
    }, GC_INSPECTION_INTERVAL);
    this.ticker.nextTick();
  }

  protected debug(message: string): void {
    this.logger.debug({ gc: true }, message);
  }

  protected destroyQueue(
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.deleteProcessingQueue(
      this.queueName,
      processingQueueName,
      (err?: Error | null) => {
        if (err) cb(err);
        else {
          this.debug(`Processing queue [${processingQueueName}] deleted.`);
          cb();
        }
      },
    );
  }

  protected handleOfflineConsumer(
    consumerId: string,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    this.debug(
      `Inspecting consumer [${consumerId}] processing queue [${processingQueue}] ...`,
    );
    this.redisClientInstance.lrange(
      processingQueue,
      0,
      0,
      (err?: Error | null, range?: string[] | null) => {
        if (err) cb(err);
        else if (range && range.length) {
          const msg = Message.createFromMessage(range[0]);
          this.consumer.emit(events.MESSAGE_RECOVERING, msg);
          this.debug(
            `Fetched message ID [${msg.getId()}] from consumer [${consumerId}] processing queue [${processingQueue}].`,
          );
          this.consumer.getBroker((broker) => {
            broker.retry(
              this.redisClientInstance,
              msg,
              processingQueue,
              this.consumer,
              EMessageUnacknowledgedCause.RECOVERY,
              (err) => {
                if (err) cb(err);
                else {
                  this.debug(`Message ID ${msg.getId()} collected.`);
                  this.destroyQueue(processingQueue, cb);
                }
              },
            );
          });
        } else this.destroyQueue(processingQueue, cb);
      },
    );
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
        Heartbeat.isAlive(
          { client: this.redisClientInstance, queueName, id: consumerId },
          (err, online) => {
            if (err) cb(err);
            else if (online) {
              this.debug(`Consumer [${consumerId}] is online.`);
              cb();
            } else {
              this.debug(`Consumer ID [${consumerId}] seems to be offline.`);
              this.handleOfflineConsumer(consumerId, queue, cb);
            }
          },
        );
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

  protected onTick(): void {
    this.lockManagerInstance.acquireLock(
      this.keyLockGC,
      10000,
      false,
      (error, acquired) => {
        if (error) this.consumer.emit(events.ERROR, error);
        else {
          if (acquired) {
            this.consumer.emit(events.GC_LOCK_ACQUIRED, this.consumerId);
            this.debug('Inspecting processing queues...');
            this.queueManager.getProcessingQueues(
              this.queueName,
              (e?: Error | null, result?: string[] | null) => {
                if (e) this.consumer.emit(events.ERROR, e);
                else if (result) {
                  this.debug(`Fetched [${result.length}] processing queues`);
                  this.handleProcessingQueues(result, (err) => {
                    if (err) this.consumer.emit(events.ERROR, err);
                    else this.ticker.nextTick();
                  });
                } else {
                  this.debug(
                    'No processing queues found. Waiting for next tick...',
                  );
                  this.ticker.nextTick();
                }
              },
            );
          } else this.ticker.nextTick();
        }
      },
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, () => {
      this.lockManagerInstance.quit(cb);
    });
    this.ticker.quit();
  }
}
