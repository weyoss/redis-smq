import {
  IConfig,
  TAggregatedStats,
  TAggregatedStatsQueue,
  TAggregatedStatsQueueConsumer,
  TCallback,
} from '../../types';
import * as async from 'neo-async';
import { MQRedisKeys } from '../redis-keys/mq-redis-keys';
import { LockManager } from '../lock-manager';
import { RedisClient } from '../redis-client';
import { ConsumerRedisKeys } from '../redis-keys/consumer-redis-keys';
import { ProducerRedisKeys } from '../redis-keys/producer-redis-keys';
import { Instance } from '../instance';
import { HeartBeat } from '../heartbeat';
import { merge } from 'lodash';

function StatsAggregator(config: IConfig) {
  if (config.namespace) {
    MQRedisKeys.setNamespace(config.namespace);
  }
  const { keyIndexRate, keyLockStatsAggregator } = MQRedisKeys.getGlobalKeys();
  const noop = () => void 0;
  let redisClientInstance: RedisClient | null = null;
  let lockManagerInstance: LockManager | null = null;
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
        rates: {
          processing: 0,
          acknowledged: 0,
          unacknowledged: 0,
        },
      };
    }
    return consumers;
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

  function getRedisClient() {
    if (!redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return redisClientInstance;
  }

  function getLockManager() {
    if (!lockManagerInstance) {
      throw new Error(`Expected an instance of LockManager`);
    }
    return lockManagerInstance;
  }

  function getRates(cb: TCallback<void>) {
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
      const consumers = addConsumerIfNotExists(ns, queueName, consumerId);
      const consumerTypes = ConsumerRedisKeys.types;
      switch (type) {
        case consumerTypes.KEY_TYPE_CONSUMER_RATE_PROCESSING:
          data.rates.processing += rate;
          consumers[consumerId].rates.processing = rate;
          break;

        case consumerTypes.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED:
          data.rates.acknowledged += rate;
          consumers[consumerId].rates.acknowledged = rate;
          break;

        case consumerTypes.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED:
          data.rates.unacknowledged += rate;
          consumers[consumerId].rates.unacknowledged = rate;
          break;
      }
    };

    const hasExpired = (timestamp: number) => {
      const now = Date.now();
      return now - timestamp > 1000;
    };

    getRedisClient().hgetall(keyIndexRate, (err, result) => {
      if (err) cb(err);
      else {
        if (result) {
          const expiredKeys: string[] = [];
          async.each(
            result,
            (item: string, key: string | number, done: () => void) => {
              const keyStr = String(key);
              const [rate, timestamp] = item.split('|');
              if (!hasExpired(+timestamp)) {
                const pExtractedData = ProducerRedisKeys.extractData(keyStr);
                if (pExtractedData) handleProducerRate(pExtractedData, +rate);
                else {
                  const cExtractedData = ConsumerRedisKeys.extractData(keyStr);
                  if (cExtractedData && cExtractedData.consumerId) {
                    handleConsumerRate(cExtractedData, +rate);
                  }
                }
              } else expiredKeys.push(keyStr);
              done();
            },
            () => {
              if (expiredKeys.length) {
                getRedisClient().hdel(keyIndexRate, expiredKeys, noop);
              }
              cb();
            },
          );
        } else cb();
      }
    });
  }

  function getQueueSize(queues: string[], cb: TCallback<void>) {
    if (queues && queues.length) {
      const multi = getRedisClient().multi();
      const handleResult = (res: number[]) => {
        const instanceTypes = MQRedisKeys.types;
        async.each(
          res,
          (size: number, index: number | string, done: TCallback<void>) => {
            const extractedData = MQRedisKeys.extractData(queues[+index]);
            if (extractedData) {
              const { ns, queueName, type } = extractedData;
              const queue = addQueueIfNotExists(ns, queueName);
              if (type === instanceTypes.KEY_TYPE_QUEUE_DLQ) {
                queue.erroredMessages = size;
              } else {
                queue.size = size;
              }
            }
            done();
          },
          () => cb(),
        );
      };
      async.each(
        queues,
        (queue: string, _, done: TCallback<void>) => {
          multi.llen(queue);
          done();
        },
        () => {
          getRedisClient().execMulti<number>(
            multi,
            (err?, res?: number[] | null) => {
              if (err) cb(err);
              else {
                handleResult(res ?? []);
              }
            },
          );
        },
      );
    } else cb();
  }

  function getQueues(cb: TCallback<string[]>) {
    Instance.getMessageQueues(getRedisClient(), (err, queues) => {
      if (err) cb(err);
      else cb(null, queues);
    });
  }

  function getDLQQueues(cb: TCallback<string[]>) {
    Instance.getDLQQueues(getRedisClient(), (err, queues) => {
      if (err) cb(err);
      else cb(null, queues);
    });
  }

  function getConsumers(cb: TCallback<void>) {
    HeartBeat.getOnlineConsumers(getRedisClient(), (err, consumers) => {
      if (err) cb(err);
      else {
        merge(data, consumers);
        cb();
      }
    });
  }

  function sanitizeData(cb: TCallback<void>) {
    const handleConsumer = (
      consumer: TAggregatedStatsQueueConsumer,
      _: string | number,
      done: TCallback<void>,
    ) => {
      if (!consumer.rates || !consumer.resources) {
        const { id, namespace, queueName } = consumer;
        const consumers = data.queues[namespace][queueName].consumers ?? {};
        delete consumers[id];
      }
      done();
    };
    const handleQueue = (
      queue: TAggregatedStatsQueue,
      _: string | number,
      done: TCallback<void>,
    ) => {
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
      _: string | number,
      done: TCallback<void>,
    ) => {
      async.each(queues, handleQueue, done);
    };

    // this way: async.each(data.queues, handleQueues, cb), it doesn't work.
    async.each(data.queues, handleQueues, () => cb());
  }

  function publish(cb: TCallback<number>) {
    const statsString = JSON.stringify(data);
    getRedisClient().publish('stats', statsString, cb);
  }

  function nextTick() {
    setTimeout(() => {
      run();
    }, 1000);
  }

  function reset(cb: TCallback<void>) {
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
    getLockManager().acquireLock(keyLockStatsAggregator, 10000, true, (err) => {
      if (err) throw err;
      async.waterfall(
        [
          reset,
          getRates,
          getConsumers,
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

  RedisClient.getInstance(config, (c) => {
    redisClientInstance = c;
    LockManager.getInstance(config, (l) => {
      lockManagerInstance = l;
      run();
    });
  });
}

process.on('message', (c: string) => {
  const config: IConfig = JSON.parse(c);
  StatsAggregator(config);
});
