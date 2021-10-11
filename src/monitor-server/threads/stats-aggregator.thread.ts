import {
  IConfig,
  TAggregatedStats,
  TAggregatedStatsQueue,
  TAggregatedStatsQueueConsumer,
  ICallback,
} from '../../../types';
import * as async from 'async';
import { redisKeys } from '../../redis-keys';
import { LockManager } from '../../lock-manager';
import { RedisClient } from '../../redis-client';
import { Heartbeat } from '../../heartbeat';
import { Broker } from '../../broker';
import { Logger } from '../../logger';
import { PowerManager } from '../../power-manager';
import { EventEmitter } from 'events';

export function StatsAggregatorThread(config: IConfig) {
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  const { keyIndexRates, keyLockStatsAggregator } = redisKeys.getGlobalKeys();
  const noop = () => void 0;
  const logger = Logger(`monitor-server:stats-aggregator-thread`, config.log);
  const powerManager = new PowerManager();
  const eventEmitter = new EventEmitter();

  let lockManagerInstance: LockManager | null = null;
  let redisClientInstance: RedisClient | null = null;
  let data: TAggregatedStats = {
    rates: {
      input: 0,
      processing: 0,
      acknowledged: 0,
      unacknowledged: 0,
    },
    queues: {},
  };

  const addConsumerIfNotExists = (
    ns: string,
    queueName: string,
    consumerId: string,
  ) => {
    let { consumers } = data.queues[ns][queueName];
    if (!consumers) {
      consumers = {};
      data.queues[ns][queueName].consumers = consumers;
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

  const addProducerIfNotExists = (
    ns: string,
    queueName: string,
    producerId: string,
  ) => {
    let { producers } = data.queues[ns][queueName];
    if (!producers) {
      producers = {};
      data.queues[ns][queueName].producers = producers;
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

  const addQueueIfNotExists = (ns: string, queueName: string) => {
    if (!data.queues[ns]) {
      data.queues[ns] = {};
    }
    if (!data.queues[ns][queueName]) {
      data.queues[ns][queueName] = {
        queueName,
        namespace: ns,
        erroredMessages: 0,
        size: 0,
        consumers: {},
        producers: {},
      };
    }
    return data.queues[ns][queueName];
  };

  const getRedisClient = () => {
    if (!redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return redisClientInstance;
  };

  const getLockManager = () => {
    if (!lockManagerInstance) {
      throw new Error(`Expected an instance of LockManager`);
    }
    return lockManagerInstance;
  };

  const handleProducerRate = (
    {
      ns,
      queueName,
      producerId,
    }: { ns: string; queueName: string; producerId: string },
    rate: number,
  ) => {
    addQueueIfNotExists(ns, queueName);
    rate = Number(rate);
    const producers = addProducerIfNotExists(ns, queueName, producerId);
    data.rates.input += rate;
    producers[producerId].rates.input = rate;
  };

  const handleConsumerRate = (
    {
      ns,
      queueName,
      type,
      consumerId,
    }: {
      ns: string;
      queueName: string;
      type: string;
      consumerId: string;
    },
    rate: number,
  ) => {
    addQueueIfNotExists(ns, queueName);
    rate = Number(rate);
    const consumer = addConsumerIfNotExists(ns, queueName, consumerId);
    consumer.rates = {
      acknowledged: consumer.rates?.acknowledged ?? 0,
      unacknowledged: consumer.rates?.unacknowledged ?? 0,
      processing: consumer.rates?.processing ?? 0,
    };
    const consumerTypes = redisKeys.getTypes();
    switch (type) {
      case consumerTypes.KEY_RATE_CONSUMER_PROCESSING:
        data.rates.processing += rate;
        consumer.rates.processing = rate;
        break;

      case consumerTypes.KEY_RATE_CONSUMER_ACKNOWLEDGED:
        data.rates.acknowledged += rate;
        consumer.rates.acknowledged = rate;
        break;

      case consumerTypes.KEY_RATE_CONSUMER_UNACKNOWLEDGED:
        data.rates.unacknowledged += rate;
        consumer.rates.unacknowledged = rate;
        break;
    }
  };

  const hasExpired = (timestamp: number) => {
    const now = Date.now();
    return now - timestamp > 1000;
  };

  function getRates(cb: ICallback<void>) {
    getRedisClient().hgetall(keyIndexRates, (err, result) => {
      if (err) throw err;
      else {
        if (result) {
          const expiredKeys: string[] = [];
          async.eachOf(
            result,
            (item, key, done: () => void) => {
              const keyStr = String(key);
              const [rate, timestamp] = item.split('|');
              if (!hasExpired(+timestamp)) {
                const extractedData = redisKeys.extractData(keyStr);
                if (extractedData) {
                  if (extractedData.producerId)
                    handleProducerRate(extractedData, +rate);
                  if (extractedData.consumerId)
                    handleConsumerRate(extractedData, +rate);
                }
              } else expiredKeys.push(keyStr);
              done();
            },
            () => {
              if (expiredKeys.length) {
                getRedisClient().hdel(keyIndexRates, expiredKeys, noop);
              }
              cb();
            },
          );
        } else cb();
      }
    });
  }

  function getQueueSize(queues: string[], cb: ICallback<void>) {
    if (queues && queues.length) {
      const multi = getRedisClient().multi();
      const handleResult = (res: number[]) => {
        const instanceTypes = redisKeys.getTypes();
        async.eachOf(
          res,
          (size, index, done) => {
            const extractedData = redisKeys.extractData(queues[+index]);
            if (extractedData) {
              const { ns, queueName, type } = extractedData;
              const queue = addQueueIfNotExists(ns, queueName);
              if (type === instanceTypes.KEY_QUEUE_DL) {
                queue.erroredMessages = size;
              } else {
                queue.size = size;
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
          multi.llen(queue);
          done();
        },
        () => {
          getRedisClient().execMulti<number>(multi, (err, res) => {
            if (err) cb(err);
            else handleResult(res ?? []);
          });
        },
      );
    } else cb();
  }

  function getQueues(cb: ICallback<string[]>) {
    Broker.getMessageQueues(getRedisClient(), cb);
  }

  function getDLQQueues(cb: ICallback<string[]>) {
    Broker.getDLQQueues(getRedisClient(), cb);
  }

  function getConsumersHeartbeats(cb: ICallback<void>) {
    Heartbeat.getHeartbeats(getRedisClient(), (err, reply) => {
      if (err) cb(err);
      else {
        for (const consumerId in reply) {
          const { ns, queueName, resources } = reply[consumerId];
          addQueueIfNotExists(ns, queueName);
          const consumer = addConsumerIfNotExists(ns, queueName, consumerId);
          consumer.resources = resources;
        }
        cb();
      }
    });
  }

  function sanitizeData(cb: ICallback<void>) {
    const handleConsumer = (
      consumer: TAggregatedStatsQueueConsumer,
      done: () => void,
    ) => {
      if (!consumer.rates || !consumer.resources) {
        const { id, namespace, queueName } = consumer;
        const consumers = data.queues[namespace][queueName].consumers ?? {};
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
    async.each(data.queues, handleQueues, cb);
  }

  function publish(cb: ICallback<number>) {
    logger.debug(`Publishing stats...`);
    const statsString = JSON.stringify(data);
    getRedisClient().publish('stats', statsString, cb);
  }

  function nextTick() {
    if (powerManager.isRunning()) {
      setTimeout(() => {
        run();
      }, 1000);
    }
    if (powerManager.isGoingDown()) eventEmitter.emit('shutdown_ready');
  }

  function reset(cb: ICallback<void>) {
    data = {
      rates: {
        processing: 0,
        acknowledged: 0,
        unacknowledged: 0,
        input: 0,
      },
      queues: {},
    };
    cb();
  }

  function run() {
    logger.debug(`Acquiring lock...`);
    getLockManager().acquireLock(keyLockStatsAggregator, 10000, true, (err) => {
      if (err) throw err;
      logger.debug(`Lock acquired. Processing stats...`);
      async.waterfall(
        [
          reset,
          getRates,
          getConsumersHeartbeats,
          getQueues,
          getQueueSize,
          getDLQQueues,
          getQueueSize,
          sanitizeData,
          publish,
        ],
        (err?: Error | null) => {
          if (err) throw err;
          nextTick();
        },
      );
    });
  }

  return {
    start(cb?: ICallback<void>) {
      powerManager.goingUp();
      RedisClient.getInstance(config, (client) => {
        redisClientInstance = client;
        lockManagerInstance = new LockManager(client);
        powerManager.commit();
        run();
        cb && cb();
      });
    },
    shutdown(cb?: ICallback<void>) {
      powerManager.goingDown();
      eventEmitter.once('shutdown_ready', () => {
        const lockManager = getLockManager();
        lockManager.quit(() => {
          lockManagerInstance = null;
          redisClientInstance?.end(true);
          redisClientInstance = null;
          powerManager.commit();
          cb && cb();
        });
      });
    },
  };
}

process.on('message', (c: string) => {
  const config: IConfig = JSON.parse(c);
  StatsAggregatorThread(config).start();
});
