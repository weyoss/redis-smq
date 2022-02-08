import { RedisClient } from '../common/redis-client/redis-client';
import {
  ICallback,
  IConsumerWorkerParameters,
  TQueueParams,
} from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Worker } from '../common/worker/worker';
import { setConfiguration } from '../common/configuration';
import { queueManager } from '../app/queue-manager/queue-manager';
import { eachOf, waterfall } from '../lib/async';
import { QueueAcknowledgedTimeSeries } from '../app/consumer/consumer-time-series/queue-acknowledged-time-series';
import { QueueDeadLetteredTimeSeries } from '../app/consumer/consumer-time-series/queue-dead-lettered-time-series';
import { QueuePublishedTimeSeries } from '../app/producer/producer-time-series/queue-published-time-series';
import { GlobalAcknowledgedTimeSeries } from '../app/consumer/consumer-time-series/global-acknowledged-time-series';
import { GlobalPublishedTimeSeries } from '../app/producer/producer-time-series/global-published-time-series';
import { GlobalDeadLetteredTimeSeries } from '../app/consumer/consumer-time-series/global-dead-lettered-time-series';
import { consumerQueues } from '../app/consumer/consumer-queues';
import { ConsumerAcknowledgedTimeSeries } from '../app/consumer/consumer-time-series/consumer-acknowledged-time-series';
import { ConsumerDeadLetteredTimeSeries } from '../app/consumer/consumer-time-series/consumer-dead-lettered-time-series';

export class TimeSeriesWorker extends Worker<IConsumerWorkerParameters> {
  protected enabled: boolean;

  constructor(
    redisClient: RedisClient,
    params: IConsumerWorkerParameters,
    managed: boolean,
  ) {
    super(redisClient, params, managed);
    this.enabled = params.config.monitor.enabled;
  }

  protected cleanUpGlobalTimeSeries = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<void>) =>
          GlobalAcknowledgedTimeSeries(this.redisClient).cleanUp(cb),
        (cb: ICallback<void>) =>
          GlobalPublishedTimeSeries(this.redisClient).cleanUp(cb),
        (cb: ICallback<void>) =>
          GlobalDeadLetteredTimeSeries(this.redisClient).cleanUp(cb),
      ],
      cb,
    );
  };

  protected cleanUpQueueTimeSeries = (
    queues: TQueueParams[],
    cb: ICallback<void>,
  ): void => {
    eachOf(
      queues,
      (queue, _, done) => {
        waterfall(
          [
            (cb: ICallback<void>) =>
              QueueAcknowledgedTimeSeries(this.redisClient, queue).cleanUp(cb),
            (cb: ICallback<void>) =>
              QueueDeadLetteredTimeSeries(this.redisClient, queue).cleanUp(cb),
            (cb: ICallback<void>) =>
              QueuePublishedTimeSeries(this.redisClient, queue).cleanUp(cb),
          ],
          done,
        );
      },
      cb,
    );
  };

  protected cleanUpConsumerTimeSeries = (
    consumerIds: string[],
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void => {
    eachOf(
      consumerIds,
      (consumerId, _, done) => {
        waterfall(
          [
            (cb: ICallback<void>) =>
              ConsumerAcknowledgedTimeSeries(
                this.redisClient,
                consumerId,
                queue,
              ).cleanUp(cb),
            (cb: ICallback<void>) =>
              ConsumerDeadLetteredTimeSeries(
                this.redisClient,
                consumerId,
                queue,
              ).cleanUp(cb),
          ],
          done,
        );
      },
      cb,
    );
  };

  work = (cb: ICallback<void>): void => {
    if (this.enabled) {
      waterfall(
        [
          (cb: ICallback<void>) => this.cleanUpGlobalTimeSeries(cb),
          (cb: ICallback<TQueueParams[]>) =>
            queueManager.getQueues(this.redisClient, (err, reply) => {
              if (err) cb(err);
              else {
                const queues = reply ?? [];
                this.cleanUpQueueTimeSeries(queues, (err) => {
                  if (err) cb(err);
                  else cb(null, queues);
                });
              }
            }),
          (queues: TQueueParams[], cb: ICallback<void>) => {
            eachOf(
              queues,
              (queue, _, done) => {
                consumerQueues.getQueueConsumerIds(
                  this.redisClient,
                  queue,
                  (err, reply) => {
                    if (err) done(err);
                    else {
                      const consumerIds = reply ?? [];
                      this.cleanUpConsumerTimeSeries(consumerIds, queue, done);
                    }
                  },
                );
              },
              cb,
            );
          },
        ],
        cb,
      );
    } else cb();
  };
}

export default TimeSeriesWorker;

process.on('message', (payload: string) => {
  const params: IConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new TimeSeriesWorker(client, params, false).run();
  });
});
