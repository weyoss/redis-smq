import * as async from 'async';
import { Logger } from '../common/logger';
import { Ticker } from '../common/ticker';
import { events } from '../common/events';
import { Message } from '../message';
import { Heartbeat } from '../consumer/heartbeat';
import { RedisClient } from '../redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
} from '../../../types';
import { redisKeys } from '../common/redis-keys';
import BLogger from 'bunyan';
import { Broker } from '../broker';
import { MessageManager } from '../message-manager/message-manager';
import { QueueManager } from '../queue-manager/queue-manager';

export class GCWorker {
  protected config: IConfig;
  protected logger: BLogger;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected broker: Broker;
  protected queueManager: QueueManager;

  constructor(
    config: IConfig,
    client: RedisClient,
    broker: Broker,
    queueManager: QueueManager,
  ) {
    this.config = config;
    this.logger = Logger(`gc`, this.config.log);
    this.redisClient = client;
    this.queueManager = queueManager;
    this.broker = broker;
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
            `Processing queue [${processingQueueName}] deleted.`,
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
      `Inspecting consumer [${consumerId}] processing queue [${processingQueue}] ...`,
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
            `Fetched message ID [${msg.getId()}] from consumer [${consumerId}] processing queue [${processingQueue}].`,
          );
          this.broker.retry(
            queueName,
            processingQueue,
            msg,
            EMessageUnacknowledgedCause.RECOVERY,
            (err) => {
              if (err) cb(err);
              else {
                this.logger.debug(`Message ID ${msg.getId()} collected.`);
                this.destroyProcessingQueue(queueName, processingQueue, cb);
              }
            },
          );
        } else this.destroyProcessingQueue(queueName, processingQueue, cb);
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
          `Inspecting processing queue [${processingQueue}]... `,
        );
        const extractedData = redisKeys.extractData(processingQueue);
        if (!extractedData || !extractedData.consumerId) {
          cb(new Error(`Expected a consumer ID`));
        } else {
          const { queueName, consumerId } = extractedData;
          this.logger.debug(`Is consumer ID [${consumerId}] alive?`);
          Heartbeat.isAlive(
            { client: this.redisClient, queueName, id: consumerId },
            (err, online) => {
              if (err) cb(err);
              else if (online) {
                this.logger.debug(`Consumer [${consumerId}] is online.`);
                cb();
              } else {
                this.logger.debug(
                  `Consumer ID [${consumerId}] seems to be offline.`,
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
          this.logger.debug(`Fetched [${result.length}] processing queues`);
          this.handleProcessingQueues(result, (err) => {
            if (err) throw err;
            this.ticker.nextTick();
          });
        } else {
          this.logger.debug(
            'No processing queues found. Waiting for next tick...',
          );
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
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new Error(`Expected an instance of RedisClient`);
    else {
      const messageManager = new MessageManager(client);
      const broker = new Broker(config, messageManager);
      const queueManager = new QueueManager(client);
      new GCWorker(config, client, broker, queueManager);
    }
  });
});
