import {
  ICallback,
  TQueueParams,
  TWebsocketMainStreamPayload,
  TWebsocketMainStreamPayloadQueue,
  IRequiredConfig,
} from '../../../types';
import * as async from 'async';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { Ticker } from '../../system/common/ticker/ticker';
import { events } from '../../system/common/events';
import { MessageManager } from '../../system/message-manager/message-manager';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Consumer } from '../../system/consumer/consumer';
import { queueManager } from '../../system/queue-manager/queue-manager';
import { setConfiguration } from '../../system/common/configuration';

export class WebsocketMainStreamWorker {
  protected lockManager: LockManager;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected noop = (): void => void 0;
  protected data: TWebsocketMainStreamPayload = {
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    pendingMessagesWithPriorityCount: 0,
    acknowledgedMessagesCount: 0,
    consumersCount: 0,
    queuesCount: 0,
    queues: {},
  };

  constructor(redisClient: RedisClient) {
    const { keyLockWebsocketMainStreamWorker } = redisKeys.getMainKeys();
    this.lockManager = new LockManager(
      redisClient,
      keyLockWebsocketMainStreamWorker,
      10000,
      false,
    );
    this.redisClient = redisClient;
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
        name: queueName,
        ns: ns,
        deadLetteredMessagesCount: 0,
        acknowledgedMessagesCount: 0,
        pendingMessagesCount: 0,
        pendingMessagesWithPriorityCount: 0,
        consumersCount: 0,
      };
    }
    return this.data.queues[ns][queueName];
  };

  protected getQueueSize = (
    queues: TQueueParams[],
    cb: ICallback<void>,
  ): void => {
    if (queues && queues.length) {
      const keyTypes = redisKeys.getKeyTypes();
      const keys: { type: number; name: string; ns: string }[] = [];
      const multi = this.redisClient.multi();
      const handleResult = (res: number[]) => {
        async.eachOf(
          res,
          (size, index, done) => {
            const { ns, name, type } = keys[+index];
            const queue = this.addQueue(ns, name);
            if (type === keyTypes.KEY_QUEUE_DL) {
              queue.deadLetteredMessagesCount = size;
              this.data.deadLetteredMessagesCount += size;
            } else if (type === keyTypes.KEY_QUEUE_PENDING) {
              queue.pendingMessagesCount = size;
              this.data.pendingMessagesCount += size;
            } else if (
              type === keyTypes.KEY_QUEUE_PENDING_PRIORITY_MESSAGE_IDS
            ) {
              queue.pendingMessagesWithPriorityCount = size;
              this.data.pendingMessagesWithPriorityCount += size;
            } else {
              queue.acknowledgedMessagesCount = size;
              this.data.acknowledgedMessagesCount += size;
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
            keyQueuePending,
            keyQueuePendingPriorityMessageIds,
            keyQueueDL,
            keyQueueAcknowledged,
          } = redisKeys.getQueueKeys(queue.name, queue.ns);
          multi.llen(keyQueuePending);
          multi.zcard(keyQueuePendingPriorityMessageIds);
          multi.llen(keyQueueDL);
          multi.llen(keyQueueAcknowledged);
          keys.push(
            {
              type: keyTypes.KEY_QUEUE_PENDING,
              name: queue.name,
              ns: queue.ns,
            },
            {
              type: keyTypes.KEY_QUEUE_PENDING_PRIORITY_MESSAGE_IDS,
              name: queue.name,
              ns: queue.ns,
            },
            {
              type: keyTypes.KEY_QUEUE_DL,
              name: queue.name,
              ns: queue.ns,
            },
            {
              type: keyTypes.KEY_QUEUE_ACKNOWLEDGED,
              name: queue.name,
              ns: queue.ns,
            },
          );
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

  protected getQueues = (cb: ICallback<TQueueParams[]>): void => {
    queueManager.getMessageQueues(this.redisClient, cb);
  };

  protected countScheduledMessages = (cb: ICallback<void>): void => {
    MessageManager.getScheduledMessagesCount(this.redisClient, (err, count) => {
      if (err) cb(err);
      else {
        this.data.scheduledMessagesCount = count ?? 0;
        cb();
      }
    });
  };

  protected countQueueConsumers = (
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void => {
    Consumer.countOnlineConsumers(this.redisClient, queue, (err, reply) => {
      if (err) cb(err);
      else {
        const { ns, name } = queue;
        const count = Number(reply);
        this.data.consumersCount += count;
        this.data.queues[ns][name].consumersCount = count;
        cb();
      }
    });
  };

  protected updateOnlineInstances = (cb: ICallback<void>): void => {
    async.eachOf<Record<string, TWebsocketMainStreamPayloadQueue>>(
      this.data.queues,
      (item, key, done) => {
        async.eachOf(
          item,
          (item, key, done) => {
            this.countQueueConsumers(item, done);
          },
          done,
        );
      },
      cb,
    );
  };

  protected publish = (): void => {
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
      consumersCount: 0,
      queuesCount: 0,
      queues: {},
    };
  };

  protected run = (): void => {
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      if (lock) {
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
  const config: IRequiredConfig = JSON.parse(c);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new WebsocketMainStreamWorker(client);
  });
});
