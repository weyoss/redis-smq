import * as async from 'async';
import { Logger } from '../common/logger';
import { Ticker } from '../common/ticker/ticker';
import { events } from '../common/events';
import { Message } from '../message';
import { Heartbeat } from '../consumer/heartbeat';
import { RedisClient } from '../redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  TConsumerWorkerParameters,
} from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import BLogger from 'bunyan';
import { Broker } from '../broker';
import { MessageManager } from '../message-manager/message-manager';
import { QueueManager } from '../queue-manager/queue-manager';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';

export class GCWorker {
  protected consumerId: string;
  protected logger: BLogger;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected broker: Broker;
  protected queueManager: QueueManager;

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
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.nextTick();
  }

  protected destroyProcessingQueue(
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.deleteProcessingQueue(
      queueName,
      processingQueueName,
      (err?: Error | null) => {
        if (err) cb(err);
        else {
          this.logger.debug(
            `Processing queue (${processingQueueName}) of (${queueName}) has been deleted.`,
          );
          cb();
        }
      },
    );
  }

  protected handleOfflineConsumer(
    consumerId: string,
    queueName: string,
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
            queueName,
            processingQueue,
            msg,
            EMessageUnacknowledgedCause.RECOVERY,
            (err) => {
              if (err) cb(err);
              else {
                this.logger.debug(
                  `Message (ID ${msg.getId()}) has been collected.`,
                );
                this.destroyProcessingQueue(queueName, processingQueue, cb);
              }
            },
          );
        } else {
          this.logger.debug(`Processing queue (${processingQueue}) is empty.`);
          this.destroyProcessingQueue(queueName, processingQueue, cb);
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
          const { queueName, consumerId } = extractedData;
          if (this.consumerId !== consumerId) {
            this.logger.debug(`Is consumer (ID ${consumerId}) alive?`);
            Heartbeat.isAlive(
              { client: this.redisClient, queueName, id: consumerId },
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
                    queueName,
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
