import * as async from 'async';
import { Message } from '../message/message';
import { RedisClient } from '../common/redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  TConsumerWorkerParameters,
  TQueueParams,
} from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';
import { Consumer } from '../consumer/consumer';
import { QueueDeadLetteredTimeSeries } from '../consumer/consumer-time-series/queue-dead-lettered-time-series';
import { GlobalDeadLetteredTimeSeries } from '../consumer/consumer-time-series/global-dead-lettered-time-series';
import { TimeSeries } from '../common/time-series/time-series';
import { broker } from '../common/broker';
import { queueManager } from '../queue-manager/queue-manager';
import { ConsumerWorker } from '../consumer/consumer-worker';
import { setConfiguration } from '../common/configuration';

export class GCWorker extends ConsumerWorker {
  protected consumerId: string;
  protected globalDeadLetteredTimeSeries: ReturnType<
    typeof GlobalDeadLetteredTimeSeries
  >;

  constructor(client: RedisClient, consumerId: string) {
    super(client);
    this.consumerId = consumerId;
    this.globalDeadLetteredTimeSeries = GlobalDeadLetteredTimeSeries(client);
  }

  protected destroyProcessingQueue(
    queue: TQueueParams,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    queueManager.deleteProcessingQueue(
      this.redisClient,
      queue,
      processingQueue,
      cb,
    );
  }

  protected handleOfflineConsumer(
    consumerId: string,
    queue: TQueueParams,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    this.redisClient.lrange(
      processingQueue,
      0,
      0,
      (err?: Error | null, range?: string[] | null) => {
        if (err) cb(err);
        else if (range && range.length) {
          const msg = Message.createFromMessage(range[0]);
          broker.retry(
            this.redisClient,
            processingQueue,
            msg,
            EMessageUnacknowledgedCause.RECOVERY,
            (err, deadLetteredCause) => {
              if (err) cb(err);
              else {
                if (deadLetteredCause) {
                  const queueDeadLetteredTimeSeries =
                    QueueDeadLetteredTimeSeries(this.redisClient, queue);
                  const timestamp = TimeSeries.getCurrentTimestamp();
                  const multi = this.redisClient.multi();
                  this.globalDeadLetteredTimeSeries.add(timestamp, 1, multi);
                  queueDeadLetteredTimeSeries.add(timestamp, 1, multi);
                  this.redisClient.execMulti(multi, (err) => {
                    if (err) cb(err);
                    else
                      this.destroyProcessingQueue(queue, processingQueue, cb);
                  });
                } else {
                  this.destroyProcessingQueue(queue, processingQueue, cb);
                }
              }
            },
          );
        } else {
          this.destroyProcessingQueue(queue, processingQueue, cb);
        }
      },
    );
  }

  protected handleProcessingQueues(
    processingQueues: string[],
    cb: ICallback<void>,
  ): void {
    async.each<string, Error>(
      processingQueues,
      (processingQueue: string, cb) => {
        const extractedData = redisKeys.extractData(processingQueue);
        if (!extractedData || !extractedData.consumerId) {
          cb(new PanicError(`Expected a consumer ID`));
        } else {
          const { ns, queueName, consumerId } = extractedData;
          const queue: TQueueParams = {
            ns,
            name: queueName,
          };
          if (this.consumerId !== consumerId) {
            Consumer.isAlive(
              this.redisClient,
              queue,
              consumerId,
              (err, online) => {
                if (err) cb(err);
                else if (online) cb();
                else {
                  this.handleOfflineConsumer(
                    consumerId,
                    queue,
                    processingQueue,
                    cb,
                  );
                }
              },
            );
          } else cb();
        }
      },
      cb,
    );
  }

  work = (cb: ICallback<void>): void => {
    queueManager.getProcessingQueues(
      this.redisClient,
      (e?: Error | null, result?: string[] | null) => {
        if (e) cb(e);
        else if (result && result.length) {
          this.handleProcessingQueues(result, cb);
        } else cb();
      },
    );
  };
}

process.on('message', (c: string) => {
  const { config, consumerId }: TConsumerWorkerParameters = JSON.parse(c);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new GCWorker(client, consumerId).run();
  });
});
