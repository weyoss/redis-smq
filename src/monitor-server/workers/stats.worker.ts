import {
  IConfig,
  TAggregatedStats,
  TAggregatedStatsQueue,
  TAggregatedStatsQueueConsumer,
  ICallback,
  TAggregatedStatsQueueProducer,
} from '../../../types';
import * as async from 'async';
import { redisKeys } from '../../system/common/redis-keys';
import { LockManager } from '../../system/common/lock-manager';
import { RedisClient } from '../../system/redis-client/redis-client';
import { Heartbeat } from '../../system/consumer/heartbeat';
import { Logger } from '../../system/common/logger';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { Ticker } from '../../system/common/ticker';
import { events } from '../../system/common/events';

export class StatsWorker {
  protected keyIndexRates;
  protected logger;
  protected lockManager: LockManager;
  protected redisClient: RedisClient;
  protected queueManager: QueueManager;
  protected ticker: Ticker;
  protected noop = (): void => void 0;
  protected data: TAggregatedStats = {
    rates: {
      input: 0,
      processing: 0,
      acknowledged: 0,
      unacknowledged: 0,
    },
    queues: {},
  };

  constructor(redisClient: RedisClient, config: IConfig) {
    const { keyIndexRates, keyLockWorkerStats } = redisKeys.getGlobalKeys();
    this.keyIndexRates = keyIndexRates;
    this.logger = Logger(`monitor-server:stats-aggregator-thread`, config.log);
    this.lockManager = new LockManager(
      redisClient,
      keyLockWorkerStats,
      10000,
      true,
    );
    this.redisClient = redisClient;
    this.queueManager = new QueueManager(redisClient);
    this.ticker = new Ticker(this.run, 1000);
    this.ticker.nextTick();
  }

  protected addConsumerIfNotExists = (
    ns: string,
    queueName: string,
    consumerId: string,
  ): TAggregatedStatsQueueConsumer => {
    let { consumers } = this.data.queues[ns][queueName];
    if (!consumers) {
      consumers = {};
      this.data.queues[ns][queueName].consumers = consumers;
    }
    if (!consumers[consumerId]) {
      consumers[consumerId] = {
        id: consumerId,
        namespace: ns,
        queueName: queueName,
      };
    }
    return consumers[consumerId];
  };

  protected addProducerIfNotExists = (
    ns: string,
    queueName: string,
    producerId: string,
  ): Record<string, TAggregatedStatsQueueProducer> => {
    let { producers } = this.data.queues[ns][queueName];
    if (!producers) {
      producers = {};
      this.data.queues[ns][queueName].producers = producers;
    }
    if (!producers[producerId]) {
      producers[producerId] = {
        id: producerId,
        namespace: ns,
        queueName: queueName,
        rates: {
          input: 0,
        },
      };
    }
    return producers;
  };

  protected addQueueIfNotExists = (
    ns: string,
    queueName: string,
  ): TAggregatedStatsQueue => {
    if (!this.data.queues[ns]) {
      this.data.queues[ns] = {};
    }
    if (!this.data.queues[ns][queueName]) {
      this.data.queues[ns][queueName] = {
        queueName,
        namespace: ns,
        deadLetteredMessages: 0,
        acknowledgedMessages: 0,
        pendingMessages: 0,
        pendingMessagesWithPriority: 0,
        consumers: {},
        producers: {},
      };
    }
    return this.data.queues[ns][queueName];
  };

  protected handleProducerRate = (
    {
      ns,
      queueName,
      producerId,
    }: { ns: string; queueName: string; producerId: string },
    rate: number,
  ): void => {
    this.addQueueIfNotExists(ns, queueName);
    rate = Number(rate);
    const producers = this.addProducerIfNotExists(ns, queueName, producerId);
    this.data.rates.input += rate;
    producers[producerId].rates.input = rate;
  };

  protected handleConsumerRate = (
    {
      ns,
      queueName,
      type,
      consumerId,
    }: {
      ns: string;
      queueName: string;
      type: number;
      consumerId: string;
    },
    rate: number,
  ): void => {
    this.addQueueIfNotExists(ns, queueName);
    rate = Number(rate);
    const consumer = this.addConsumerIfNotExists(ns, queueName, consumerId);
    consumer.rates = {
      acknowledged: consumer.rates?.acknowledged ?? 0,
      unacknowledged: consumer.rates?.unacknowledged ?? 0,
      processing: consumer.rates?.processing ?? 0,
    };
    const consumerTypes = redisKeys.getTypes();
    switch (type) {
      case consumerTypes.KEY_RATE_CONSUMER_PROCESSING:
        this.data.rates.processing += rate;
        consumer.rates.processing = rate;
        break;

      case consumerTypes.KEY_RATE_CONSUMER_ACKNOWLEDGED:
        this.data.rates.acknowledged += rate;
        consumer.rates.acknowledged = rate;
        break;

      case consumerTypes.KEY_RATE_CONSUMER_UNACKNOWLEDGED:
        this.data.rates.unacknowledged += rate;
        consumer.rates.unacknowledged = rate;
        break;
    }
  };

  protected hasExpired = (timestamp: number): boolean => {
    const now = Date.now();
    return now - timestamp > 1000;
  };

  protected getRates = (cb: ICallback<void>): void => {
    this.redisClient.hgetall(this.keyIndexRates, (err, result) => {
      if (err) throw err;
      else {
        if (result) {
          const expiredKeys: string[] = [];
          async.eachOf(
            result,
            (item, key, done: () => void) => {
              const keyStr = String(key);
              const [rate, timestamp] = item.split('|');
              if (!this.hasExpired(+timestamp)) {
                const extractedData = redisKeys.extractData(keyStr);
                if (extractedData) {
                  if (extractedData.producerId)
                    this.handleProducerRate(extractedData, +rate);
                  if (extractedData.consumerId)
                    this.handleConsumerRate(extractedData, +rate);
                }
              } else expiredKeys.push(keyStr);
              done();
            },
            () => {
              if (expiredKeys.length) {
                this.redisClient.hdel(
                  this.keyIndexRates,
                  expiredKeys,
                  this.noop,
                );
              }
              cb();
            },
          );
        } else cb();
      }
    });
  };

  protected getQueueSize = (queues: string[], cb: ICallback<void>): void => {
    if (queues && queues.length) {
      let keys: string[] = [];
      const multi = this.redisClient.multi();
      const handleResult = (res: number[]) => {
        const instanceTypes = redisKeys.getTypes();
        async.eachOf(
          res,
          (size, index, done) => {
            const extractedData = redisKeys.extractData(keys[+index]);
            if (extractedData) {
              const { ns, queueName, type } = extractedData;
              const queue = this.addQueueIfNotExists(ns, queueName);
              if (type === instanceTypes.KEY_QUEUE_DL) {
                queue.deadLetteredMessages = size;
              } else if (type === instanceTypes.KEY_QUEUE) {
                queue.pendingMessages = size;
              } else if (type === instanceTypes.KEY_QUEUE_PRIORITY) {
                queue.pendingMessagesWithPriority = size;
              } else {
                queue.acknowledgedMessages = size;
              }
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
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          } = redisKeys.getKeys(queue);
          multi.llen(keyQueue);
          multi.zcard(keyQueuePriority);
          multi.llen(keyQueueDL);
          multi.llen(keyQueueAcknowledgedMessages);
          keys = keys.concat([
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          ]);
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

  protected getQueues = (cb: ICallback<string[]>): void => {
    this.queueManager.getMessageQueues(cb);
  };

  protected getConsumersHeartbeats = (cb: ICallback<void>): void => {
    Heartbeat.getHeartbeats(this.redisClient, (err, reply) => {
      if (err) cb(err);
      else {
        for (const consumerId in reply) {
          const { ns, queueName, resources } = reply[consumerId];
          this.addQueueIfNotExists(ns, queueName);
          const consumer = this.addConsumerIfNotExists(
            ns,
            queueName,
            consumerId,
          );
          consumer.resources = resources;
        }
        cb();
      }
    });
  };

  protected sanitizeData = (cb: ICallback<void>): void => {
    const handleConsumer = (
      consumer: TAggregatedStatsQueueConsumer,
      done: () => void,
    ) => {
      if (!consumer.rates || !consumer.resources) {
        const { id, namespace, queueName } = consumer;
        const consumers =
          this.data.queues[namespace][queueName].consumers ?? {};
        delete consumers[id];
      }
      done();
    };
    const handleQueue = (queue: TAggregatedStatsQueue, done: () => void) => {
      if (!queue.consumers) {
        queue.consumers = {};
      }
      if (!queue.producers) {
        queue.producers = {};
      }
      async.each(queue.consumers, handleConsumer, done);
    };
    const handleQueues = (
      queues: Record<string, TAggregatedStatsQueue>,
      done: () => void,
    ) => {
      async.each(queues, handleQueue, done);
    };
    async.each(this.data.queues, handleQueues, cb);
  };

  protected publish = (cb: ICallback<number>): void => {
    this.logger.debug(`Publishing stats...`);
    const statsString = JSON.stringify(this.data);
    this.redisClient.publish('stats', statsString, cb);
  };

  protected reset = (cb: ICallback<void>): void => {
    this.data = {
      rates: {
        processing: 0,
        acknowledged: 0,
        unacknowledged: 0,
        input: 0,
      },
      queues: {},
    };
    cb();
  };

  protected run = (): void => {
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err) => {
      if (err) throw err;
      this.logger.debug(`Lock acquired. Processing stats...`);
      async.waterfall(
        [
          this.reset,
          this.getRates,
          this.getConsumersHeartbeats,
          this.getQueues,
          this.getQueueSize,
          this.sanitizeData,
          this.publish,
        ],
        (err?: Error | null) => {
          if (err) throw err;
          this.ticker.nextTick();
        },
      );
    });
  };

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
    else new StatsWorker(client, config);
  });
});
