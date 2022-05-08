import {
  ICallback,
  TQueueParams,
  TWebsocketMainStreamPayload,
  TWebsocketMainStreamPayloadQueue,
} from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { Consumer } from '../../system/app/consumer/consumer';
import { Worker } from '../../system/common/worker/worker';
import { each, waterfall } from '../../system/lib/async';
import { ScheduledMessages } from '../../system/app/message-manager/scheduled-messages';
import { Queue } from '../../system/app/queue-manager/queue';

export class WebsocketMainStreamWorker extends Worker {
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
        each(
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
      each(
        queues,
        (queue, _, done) => {
          const {
            keyQueuePending,
            keyQueuePendingPriorityMessageIds,
            keyQueueDL,
            keyQueueAcknowledged,
          } = redisKeys.getQueueKeys(queue);
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
    Queue.listQueues(this.redisClient, cb);
  };

  protected countScheduledMessages = (cb: ICallback<void>): void => {
    ScheduledMessages.count(this.redisClient, (err, count) => {
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
    each(
      this.data.queues,
      (item, key, done) => {
        each(
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

  protected publish = (cb: ICallback<void>): void => {
    this.redisClient.publish('streamMain', JSON.stringify(this.data), () =>
      cb(),
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

  work = (cb: ICallback<void>): void => {
    this.reset();
    waterfall(
      [
        this.countScheduledMessages,
        this.getQueues,
        this.getQueueSize,
        this.updateOnlineInstances,
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.publish(cb);
        }
      },
    );
  };
}

export default WebsocketMainStreamWorker;
