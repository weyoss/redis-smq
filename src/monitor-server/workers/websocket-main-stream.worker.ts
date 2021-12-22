import {
  IConfig,
  ICallback,
  TMessageQueue,
  TWebsocketMainStreamPayload,
  TWebsocketMainStreamPayloadQueue,
} from '../../../types';
import * as async from 'async';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { RedisClient } from '../../system/redis-client/redis-client';
import { Logger } from '../../system/common/logger';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import { events } from '../../system/common/events';
import BLogger from 'bunyan';
import { MessageManager } from '../../system/message-manager/message-manager';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Consumer } from '../../system/consumer/consumer';
import { Producer } from '../../system/producer/producer';

export class WebsocketMainStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected redisClient: RedisClient;
  protected queueManager: QueueManager;
  protected messageManager: MessageManager;
  protected ticker: Ticker;
  protected noop = (): void => void 0;
  protected data: TWebsocketMainStreamPayload = {
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    pendingMessagesWithPriorityCount: 0,
    acknowledgedMessagesCount: 0,
    producersCount: 0,
    consumersCount: 0,
    queuesCount: 0,
    queues: {},
  };

  constructor(
    queueManager: QueueManager,
    messageManager: MessageManager,
    redisClient: RedisClient,
    logger: BLogger,
  ) {
    const { keyLockWebsocketMainStreamWorker } = redisKeys.getGlobalKeys();
    this.logger = logger;
    this.lockManager = new LockManager(
      redisClient,
      keyLockWebsocketMainStreamWorker,
      10000,
      false,
    );
    this.redisClient = redisClient;
    this.queueManager = queueManager;
    this.messageManager = messageManager;
    this.ticker = new Ticker(this.run, 1000);
    this.ticker.nextTick();
  }

  protected addQueue = (
    ns: string,
    queueName: string,
  ): TWebsocketMainStreamPayloadQueue => {
    if (!this.data.queues[ns]) {
      this.data.queues[ns] = {};
    }
    if (!this.data.queues[ns][queueName]) {
      this.data.queuesCount += 1;
      this.data.queues[ns][queueName] = {
        queueName,
        namespace: ns,
        deadLetteredMessagesCount: 0,
        acknowledgedMessagesCount: 0,
        pendingMessagesCount: 0,
        pendingMessagesWithPriorityCount: 0,
        consumersCount: 0,
        producersCount: 0,
      };
    }
    return this.data.queues[ns][queueName];
  };

  protected getQueueSize = (
    queues: TMessageQueue[],
    cb: ICallback<void>,
  ): void => {
    if (queues && queues.length) {
      let keys: string[] = [];
      const multi = this.redisClient.multi();
      const handleResult = (res: number[]) => {
        const instanceTypes = redisKeys.getTypes();
        async.eachOf(
          res,
          (size, index, done) => {
            const extractedData = redisKeys.extractData(keys[+index]);
            if (extractedData) {
              const { ns, queueName, type } = extractedData;
              const queue = this.addQueue(ns, queueName);
              if (type === instanceTypes.KEY_QUEUE_DL) {
                queue.deadLetteredMessagesCount = size;
                this.data.deadLetteredMessagesCount += size;
              } else if (type === instanceTypes.KEY_QUEUE) {
                queue.pendingMessagesCount = size;
                this.data.pendingMessagesCount += size;
              } else if (type === instanceTypes.KEY_QUEUE_PRIORITY) {
                queue.pendingMessagesWithPriorityCount = size;
                this.data.pendingMessagesWithPriorityCount += size;
              } else {
                queue.acknowledgedMessagesCount = size;
                this.data.acknowledgedMessagesCount += size;
              }
            }
            done();
          },
          cb,
        );
      };
      async.each(
        queues,
        (queue, done) => {
          const {
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          } = redisKeys.getKeys(queue.name, queue.ns);
          multi.llen(keyQueue);
          multi.zcard(keyQueuePriority);
          multi.llen(keyQueueDL);
          multi.llen(keyQueueAcknowledgedMessages);
          keys = keys.concat([
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          ]);
          done();
        },
        () => {
          this.redisClient.execMulti<number>(multi, (err, res) => {
            if (err) cb(err);
            else handleResult(res ?? []);
          });
        },
      );
    } else cb();
  };

  protected getQueues = (cb: ICallback<TMessageQueue[]>): void => {
    this.queueManager.getMessageQueues(cb);
  };

  protected countScheduledMessages = (cb: ICallback<void>): void => {
    this.messageManager.getScheduledMessagesCount((err, count) => {
      if (err) cb(err);
      else {
        this.data.scheduledMessagesCount = count ?? 0;
        cb();
      }
    });
  };

  protected countQueueConsumers = (
    ns: string,
    queueName: string,
    cb: ICallback<void>,
  ): void => {
    Consumer.countOnlineConsumers(
      this.redisClient,
      queueName,
      ns,
      (err, reply) => {
        if (err) cb(err);
        else {
          const count = Number(reply);
          this.data.consumersCount += count;
          this.data.queues[ns][queueName].consumersCount = count;
          cb();
        }
      },
    );
  };

  protected countQueueProducers = (
    ns: string,
    queueName: string,
    cb: ICallback<void>,
  ): void => {
    Producer.countOnlineProducers(
      this.redisClient,
      queueName,
      ns,
      (err, reply) => {
        if (err) cb(err);
        else {
          const count = Number(reply);
          this.data.producersCount += count;
          this.data.queues[ns][queueName].producersCount = count;
          cb();
        }
      },
    );
  };

  protected updateOnlineInstances = (cb: ICallback<void>): void => {
    async.eachOf(
      this.data.queues,
      (item, key, done) => {
        async.eachOf(
          item,
          (item, key, done) => {
            const { namespace, queueName } = item;
            async.waterfall(
              [
                (done: ICallback<void>) =>
                  this.countQueueConsumers(namespace, queueName, done),
                (done: ICallback<void>) =>
                  this.countQueueProducers(namespace, queueName, done),
              ],
              done,
            );
          },
          done,
        );
      },
      cb,
    );
  };

  protected publish = (): void => {
    this.logger.debug(`Publishing...`);
    this.redisClient.publish(
      'streamMain',
      JSON.stringify(this.data),
      this.noop,
    );
  };

  protected reset = (): void => {
    this.data = {
      scheduledMessagesCount: 0,
      deadLetteredMessagesCount: 0,
      pendingMessagesCount: 0,
      pendingMessagesWithPriorityCount: 0,
      acknowledgedMessagesCount: 0,
      producersCount: 0,
      consumersCount: 0,
      queuesCount: 0,
      queues: {},
    };
  };

  protected run = (): void => {
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      if (lock) {
        this.logger.debug(`Lock acquired.`);
        this.reset();
        async.waterfall(
          [
            this.countScheduledMessages,
            this.getQueues,
            this.getQueueSize,
            this.updateOnlineInstances,
          ],
          (err?: Error | null) => {
            if (err) throw err;
            this.publish();
            this.ticker.nextTick();
          },
        );
      } else this.ticker.nextTick();
    });
  };

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}

process.on('message', (c: string) => {
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(WebsocketMainStreamWorker.name, config.log);
      const queueManager = new QueueManager(client, logger);
      const messageManager = new MessageManager(client, logger);
      new WebsocketMainStreamWorker(
        queueManager,
        messageManager,
        client,
        logger,
      );
    }
  });
});
