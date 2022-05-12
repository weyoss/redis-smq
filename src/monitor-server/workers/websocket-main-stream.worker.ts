import {
  ICallback,
  TQueueParams,
  TQueueSettings,
  TWebsocketMainStreamPayload,
  TWebsocketMainStreamPayloadQueue,
} from '../../../types';
import { Consumer } from '../../system/app/consumer/consumer';
import { Worker } from '../../system/common/worker/worker';
import { each, waterfall } from '../../system/lib/async';
import { ScheduledMessages } from '../../system/app/message-manager/scheduled-messages';
import { Queue } from '../../system/app/queue-manager/queue';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { PendingPriorityMessages } from '../../system/app/message-manager/pending-priority-messages';
import { PendingLifoMessages } from '../../system/app/message-manager/pending-lifo-messages';
import { DeadLetteredMessages } from '../../system/app/message-manager/dead-lettered-messages';
import { AcknowledgedMessages } from '../../system/app/message-manager/acknowledged-messages';

export class WebsocketMainStreamWorker extends Worker {
  protected data: TWebsocketMainStreamPayload = {
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    acknowledgedMessagesCount: 0,
    consumersCount: 0,
    queuesCount: 0,
    queues: {},
  };

  protected addQueue = (
    queue: TQueueParams,
    settings: TQueueSettings,
  ): TWebsocketMainStreamPayloadQueue => {
    const { ns, name } = queue;
    const { priorityQueuing, rateLimit } = settings;
    if (!this.data.queues[ns]) {
      this.data.queues[ns] = {};
    }
    if (!this.data.queues[ns][name]) {
      this.data.queuesCount += 1;
      this.data.queues[ns][name] = {
        name,
        ns,
        priorityQueuing,
        rateLimit: rateLimit ?? null,
        deadLetteredMessagesCount: 0,
        acknowledgedMessagesCount: 0,
        pendingMessagesCount: 0,
        consumersCount: 0,
      };
    }
    return this.data.queues[ns][name];
  };

  protected getQueueSize = (
    queues: TQueueParams[],
    cb: ICallback<void>,
  ): void => {
    each(
      queues,
      (queueParams, _, done) => {
        waterfall(
          [
            (cb: ICallback<TWebsocketMainStreamPayloadQueue>) => {
              Queue.getSettings(
                this.redisClient,
                queueParams,
                (err, settings) => {
                  if (err) done(err);
                  else if (!settings) cb(new EmptyCallbackReplyError());
                  else {
                    const queue = this.addQueue(queueParams, settings);
                    cb(null, queue);
                  }
                },
              );
            },
            (
              queue: TWebsocketMainStreamPayloadQueue,
              cb: ICallback<TWebsocketMainStreamPayloadQueue>,
            ) => {
              if (queue.priorityQueuing) {
                PendingPriorityMessages.count(
                  this.redisClient,
                  queueParams,
                  (err, count) => {
                    if (err) cb(err);
                    else {
                      queue.pendingMessagesCount = Number(count);
                      this.data.pendingMessagesCount +=
                        queue.pendingMessagesCount;
                    }
                  },
                );
              } else {
                PendingLifoMessages.count(
                  this.redisClient,
                  queueParams,
                  (err, count) => {
                    if (err) cb(err);
                    else {
                      queue.pendingMessagesCount = Number(count);
                      this.data.pendingMessagesCount +=
                        queue.pendingMessagesCount;
                      cb(null, queue);
                    }
                  },
                );
              }
            },
            (
              queue: TWebsocketMainStreamPayloadQueue,
              cb: ICallback<TWebsocketMainStreamPayloadQueue>,
            ) => {
              DeadLetteredMessages.count(
                this.redisClient,
                queueParams,
                (err, count) => {
                  if (err) cb(err);
                  else {
                    queue.deadLetteredMessagesCount = Number(count);
                    this.data.deadLetteredMessagesCount +=
                      queue.deadLetteredMessagesCount;
                    cb(null, queue);
                  }
                },
              );
            },
            (queue: TWebsocketMainStreamPayloadQueue, cb: ICallback<void>) => {
              AcknowledgedMessages.count(
                this.redisClient,
                queueParams,
                (err, count) => {
                  if (err) cb(err);
                  else {
                    queue.acknowledgedMessagesCount = Number(count);
                    this.data.acknowledgedMessagesCount +=
                      queue.acknowledgedMessagesCount;
                    cb();
                  }
                },
              );
            },
          ],
          done,
        );
      },
      cb,
    );
  };

  protected getQueues = (cb: ICallback<TQueueParams[]>): void => {
    Queue.list(this.redisClient, cb);
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
