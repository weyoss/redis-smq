import { ICallback, TQueueParams } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from '../../system/app/consumer/consumer-heartbeat';
import { QueuePublishedTimeSeries } from '../../system/app/producer/producer-time-series/queue-published-time-series';
import { QueueDeadLetteredTimeSeries } from '../../system/app/consumer/consumer-time-series/queue-dead-lettered-time-series';
import { QueueAcknowledgedTimeSeries } from '../../system/app/consumer/consumer-time-series/queue-acknowledged-time-series';
import { GlobalPublishedTimeSeries } from '../../system/app/producer/producer-time-series/global-published-time-series';
import { GlobalAcknowledgedTimeSeries } from '../../system/app/consumer/consumer-time-series/global-acknowledged-time-series';
import { GlobalDeadLetteredTimeSeries } from '../../system/app/consumer/consumer-time-series/global-dead-lettered-time-series';
import { ConsumerAcknowledgedTimeSeries } from '../../system/app/consumer/consumer-time-series/consumer-acknowledged-time-series';
import { ConsumerDeadLetteredTimeSeries } from '../../system/app/consumer/consumer-time-series/consumer-dead-lettered-time-series';
import { consumerQueues } from '../../system/app/consumer/consumer-queues';
import { Worker } from '../../system/common/worker/worker';
import { each, waterfall } from '../../system/lib/async';

export class WebsocketRateStreamWorker extends Worker {
  protected timestamp = 0;

  protected publishConsumerTimeSeries = (
    queue: TQueueParams,
    consumerId: string,
    cb: ICallback<void>,
  ): void => {
    waterfall(
      [
        (cb: ICallback<void>) =>
          ConsumerAcknowledgedTimeSeries(
            this.redisClient,
            consumerId,
          ).getRangeFrom(this.timestamp, (err, reply) => {
            if (err) cb(err);
            else {
              this.redisClient.publish(
                `streamConsumerAcknowledged:${consumerId}`,
                JSON.stringify(reply),
                () => cb(),
              );
            }
          }),
        (cb: ICallback<void>) =>
          ConsumerDeadLetteredTimeSeries(
            this.redisClient,
            consumerId,
          ).getRangeFrom(this.timestamp, (err, reply) => {
            if (err) cb(err);
            else {
              this.redisClient.publish(
                `streamConsumerDeadLettered:${consumerId}`,
                JSON.stringify(reply),
                () => cb(),
              );
            }
          }),
      ],
      cb,
    );
  };

  protected publishQueueTimeSeries = (
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void => {
    waterfall(
      [
        (cb: ICallback<void>) =>
          QueueAcknowledgedTimeSeries(this.redisClient, queue).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  `streamQueueAcknowledged:${queue.ns}:${queue.name}`,
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
        (cb: ICallback<void>) =>
          QueueDeadLetteredTimeSeries(this.redisClient, queue).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  `streamQueueDeadLettered:${queue.ns}:${queue.name}`,
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
        (cb: ICallback<void>) =>
          QueuePublishedTimeSeries(this.redisClient, queue).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  `streamQueuePublished:${queue.ns}:${queue.name}`,
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
      ],
      cb,
    );
  };

  protected handleGlobalTimeSeries = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<void>) =>
          GlobalAcknowledgedTimeSeries(this.redisClient).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  'streamGlobalAcknowledged',
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
        (cb: ICallback<void>) =>
          GlobalDeadLetteredTimeSeries(this.redisClient).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  'streamGlobalDeadLettered',
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
        (cb: ICallback<void>) =>
          GlobalPublishedTimeSeries(this.redisClient).getRangeFrom(
            this.timestamp,
            (err, reply) => {
              if (err) cb(err);
              else {
                this.redisClient.publish(
                  'streamGlobalPublished',
                  JSON.stringify(reply),
                  () => cb(),
                );
              }
            },
          ),
      ],
      cb,
    );
  };

  protected handleConsumersTimeSeries = (cb: ICallback<void>): void => {
    ConsumerHeartbeat.getValidHeartbeatIds(this.redisClient, (err, reply) => {
      if (err) cb(err);
      else {
        each(
          reply ?? [],
          (consumerId, _, done) => {
            consumerQueues.getConsumerQueues(
              this.redisClient,
              consumerId,
              (err, queues) => {
                if (err) done(err);
                else {
                  each(
                    queues ?? [],
                    (queueParams, _, done) => {
                      this.publishConsumerTimeSeries(
                        queueParams,
                        consumerId,
                        done,
                      );
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

  protected handleQueuesTimeSeries = (cb: ICallback<void>): void => {
    const { keyQueues } = redisKeys.getMainKeys();
    this.redisClient.smembers(keyQueues, (err, reply) => {
      if (err) cb(err);
      else {
        each(
          reply ?? [],
          (queueStr, index, done) => {
            const queue: TQueueParams = JSON.parse(queueStr);
            this.publishQueueTimeSeries(queue, done);
          },
          cb,
        );
      }
    });
  };

  work = (cb: ICallback<void>): void => {
    if (!this.timestamp)
      // in secs
      this.timestamp = Math.ceil(Date.now() / 1000);
    else this.timestamp += 1;
    waterfall(
      [
        this.handleGlobalTimeSeries,
        this.handleQueuesTimeSeries,
        this.handleConsumersTimeSeries,
      ],
      cb,
    );
  };
}

export default WebsocketRateStreamWorker;
