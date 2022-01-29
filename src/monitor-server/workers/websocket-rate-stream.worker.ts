import { ICallback, TQueueParams, TWorkerParameters } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import * as async from 'async';
import { ConsumerHeartbeat } from '../../system/consumer/consumer-heartbeat';
import { TimeSeries } from '../../system/common/time-series/time-series';
import { QueuePublishedTimeSeries } from '../../system/producer/producer-time-series/queue-published-time-series';
import { QueueDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/queue-dead-lettered-time-series';
import { QueueAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/queue-acknowledged-time-series';
import { GlobalPublishedTimeSeries } from '../../system/producer/producer-time-series/global-published-time-series';
import { GlobalAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/global-acknowledged-time-series';
import { GlobalDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/global-dead-lettered-time-series';
import { ConsumerAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/consumer-acknowledged-time-series';
import { ConsumerDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/consumer-dead-lettered-time-series';
import { consumerQueues } from '../../system/consumer/consumer-queues';
import { setConfiguration } from '../../system/common/configuration';
import { Worker } from '../../system/common/worker';

export class WebsocketRateStreamWorker extends Worker {
  protected queueData: {
    [ns: string]: {
      [queueName: string]: {
        consumers: string[];
      };
    };
  } = {};
  protected tasks: ((cb: ICallback<void>) => void)[] = [];
  protected noop = (): void => void 0;

  protected reset = (): void => {
    this.queueData = {};
    this.tasks = [];
  };

  protected addConsumerTasks = (
    ts: number,
    queue: TQueueParams,
    consumerId: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      ConsumerAcknowledgedTimeSeries(
        this.redisClient,
        consumerId,
        queue,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamConsumerAcknowledged:${consumerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      ConsumerDeadLetteredTimeSeries(
        this.redisClient,
        consumerId,
        queue,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamConsumerDeadLettered:${consumerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
  };

  protected addQueueTasks = (ts: number, queue: TQueueParams): void => {
    this.tasks.push((cb: ICallback<void>) =>
      QueueAcknowledgedTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueueAcknowledged:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueueDeadLetteredTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueueDeadLettered:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueuePublishedTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueuePublished:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addGlobalTasks = (ts: number): void => {
    this.tasks.push((cb: ICallback<void>) =>
      GlobalAcknowledgedTimeSeries(this.redisClient).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalAcknowledged',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalDeadLetteredTimeSeries(this.redisClient).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalDeadLettered',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalPublishedTimeSeries(this.redisClient).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalPublished',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addQueue = (queue: TQueueParams): { consumers: string[] } => {
    const { ns, name } = queue;
    if (!this.queueData[ns]) {
      this.queueData[ns] = {};
    }
    if (!this.queueData[ns][name]) {
      this.queueData[ns][name] = {
        consumers: [],
      };
    }
    return this.queueData[ns][name];
  };

  protected handleQueueConsumers = (
    ts: number,
    queue: TQueueParams,
    consumers: string[],
    cb: () => void,
  ): void => {
    async.each(
      consumers,
      (consumerId, done) => {
        this.addConsumerTasks(ts, queue, consumerId);
        done();
      },
      cb,
    );
  };

  protected handleQueue = (
    ts: number,
    queue: TQueueParams,
    queueProperties: { consumers: string[] },
    cb: () => void,
  ): void => {
    const { consumers } = queueProperties;
    this.addQueueTasks(ts, queue);
    this.handleQueueConsumers(ts, queue, consumers, cb);
  };

  protected prepare = (cb: ICallback<void>): void => {
    const ts = TimeSeries.getCurrentTimestamp() - 10;
    this.addGlobalTasks(ts);
    async.eachOf(
      this.queueData,
      (queues, ns, done) => {
        async.eachOf(
          queues,
          (queue, queueName, done) => {
            this.handleQueue(
              ts,
              { ns: String(ns), name: String(queueName) },
              queue,
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
    async.waterfall(this.tasks, this.noop);
  };

  protected consumersCount = (cb: ICallback<void>): void => {
    ConsumerHeartbeat.getValidHeartbeatIds(this.redisClient, (err, reply) => {
      if (err) cb(err);
      else {
        async.each<string, Error>(
          reply ?? [],
          (consumerId, done) => {
            consumerQueues.getConsumerQueues(
              this.redisClient,
              consumerId,
              (err, queues) => {
                if (err) done(err);
                else {
                  async.each(
                    queues ?? [],
                    (queueParams, done) => {
                      const queue = this.addQueue(queueParams);
                      queue.consumers.push(consumerId);
                      done();
                    },
                    done,
                  );
                }
              },
            );
          },
          cb,
        );
      }
    });
  };

  protected getQueues = (cb: ICallback<void>): void => {
    const { keyQueues } = redisKeys.getMainKeys();
    this.redisClient.smembers(keyQueues, (err, reply) => {
      if (err) cb(err);
      else {
        async.each(
          reply ?? [],
          (queueStr, done) => {
            const queue: TQueueParams = JSON.parse(queueStr);
            this.addQueue(queue);
            done();
          },
          cb,
        );
      }
    });
  };

  work = (cb: ICallback<void>): void => {
    this.reset();
    async.waterfall(
      [this.getQueues, this.consumersCount, this.prepare],
      (err?: Error | null) => {
        if (err) cb(err);
        else {
          this.publish();
          cb();
        }
      },
    );
  };
}

export default WebsocketRateStreamWorker;

process.on('message', (payload: string) => {
  const params: TWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      new WebsocketRateStreamWorker(client, params).run();
    }
  });
});
