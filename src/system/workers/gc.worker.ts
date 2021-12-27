import * as async from 'async';
import { Logger } from '../common/logger';
import { Ticker } from '../common/ticker/ticker';
import { events } from '../common/events';
import { Message } from '../message';
import { RedisClient } from '../redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  TConsumerWorkerParameters,
  TQueueParams,
} from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import BLogger from 'bunyan';
import { Broker } from '../broker';
import { MessageManager } from '../message-manager/message-manager';
import { QueueManager } from '../queue-manager/queue-manager';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';
import { Consumer } from '../consumer/consumer';
import {
  GlobalDeadLetteredTimeSeries,
  QueueDeadLetteredTimeSeries,
} from '../consumer/consumer-time-series';
import { TimeSeries } from '../common/time-series/time-series';

export class GCWorker {
  protected consumerId: string;
  protected logger: BLogger;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected broker: Broker;
  protected queueManager: QueueManager;
  protected globalDeadLetteredTimeSeries: ReturnType<
    typeof GlobalDeadLetteredTimeSeries
  >;

  constructor(
    client: RedisClient,
    broker: Broker,
    queueManager: QueueManager,
    logger: BLogger,
    consumerId: string,
  ) {
    this.logger = logger;
    this.redisClient = client;
    this.queueManager = queueManager;
    this.broker = broker;
    this.consumerId = consumerId;
    this.globalDeadLetteredTimeSeries = GlobalDeadLetteredTimeSeries(client);
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.nextTick();
  }

  protected destroyProcessingQueue(
    queue: TQueueParams,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.deleteProcessingQueue(
      queue,
      processingQueueName,
      (err?: Error | null) => {
        if (err) cb(err);
        else {
          this.logger.debug(
            `Processing queue (${processingQueueName}) of (${queue.name}, ${queue.ns}) has been deleted.`,
          );
          cb();
        }
      },
    );
  }

  protected handleOfflineConsumer(
    consumerId: string,
    queue: TQueueParams,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Inspecting processing queue (${processingQueue}) of consumer (ID ${consumerId})...`,
    );
    this.redisClient.lrange(
      processingQueue,
      0,
      0,
      (err?: Error | null, range?: string[] | null) => {
        if (err) cb(err);
        else if (range && range.length) {
          const msg = Message.createFromMessage(range[0]);
          this.logger.debug(
            `Fetched message (ID ${msg.getId()}) from processing queue (${processingQueue}) of consumer (ID ${consumerId}).`,
          );
          this.broker.retry(
            processingQueue,
            msg,
            EMessageUnacknowledgedCause.RECOVERY,
            (err, deadLetteredCause) => {
              if (err) cb(err);
              else {
                if (deadLetteredCause) {
                  this.logger.debug(
                    `Message (ID ${msg.getId()}) has been dead-lettered.`,
                  );
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
                  this.logger.debug(
                    `Message (ID ${msg.getId()}) has been recovered.`,
                  );
                  this.destroyProcessingQueue(queue, processingQueue, cb);
                }
              }
            },
          );
        } else {
          this.logger.debug(`Processing queue (${processingQueue}) is empty.`);
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
        this.logger.debug(
          `Inspecting processing queue (${processingQueue})... `,
        );
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
            this.logger.debug(`Is consumer (ID ${consumerId}) alive?`);
            Consumer.isAlive(
              this.redisClient,
              queue,
              consumerId,
              (err, online) => {
                if (err) cb(err);
                else if (online) {
                  this.logger.debug(`Consumer (ID ${consumerId}) is alive.`);
                  cb();
                } else {
                  this.logger.debug(
                    `Consumer (ID ${consumerId}) seems to be offline.`,
                  );
                  this.handleOfflineConsumer(
                    consumerId,
                    queue,
                    processingQueue,
                    cb,
                  );
                }
              },
            );
          } else {
            this.logger.debug(
              `Owner of processing queue (${processingQueue}) is consumer (ID ${consumerId}), which is my parent. Skipping... `,
            );
            cb();
          }
        }
      },
      cb,
    );
  }

  protected onTick(): void {
    this.logger.debug('Inspecting processing queues...');
    this.queueManager.getProcessingQueues(
      (e?: Error | null, result?: string[] | null) => {
        if (e) throw e;
        if (result && result.length) {
          this.logger.debug(`Got ${result.length} processing queue(s).`);
          this.handleProcessingQueues(result, (err) => {
            if (err) throw err;
            this.ticker.nextTick();
          });
        } else {
          this.logger.debug('No processing queues found. Next tick...');
          this.ticker.nextTick();
        }
      },
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}

process.on('message', (c: string) => {
  const { config, consumerId }: TConsumerWorkerParameters = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(GCWorker.name, {
        ...config.log,
        options: {
          ...config.log?.options,
          consumerId,
        },
      });
      const messageManager = new MessageManager(client, logger);
      const broker = new Broker(config, messageManager, logger);
      const queueManager = new QueueManager(client, logger);
      new GCWorker(client, broker, queueManager, logger, consumerId);
    }
  });
});
