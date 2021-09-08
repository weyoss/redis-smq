import * as async from 'neo-async';
import { IConfig, TCallback } from '../types';
import { LockManager } from './lock-manager';
import { Ticker } from './ticker';
import { HeartBeat } from './heartbeat';
import { ConsumerRedisKeys } from './redis-keys/consumer-redis-keys';
import { RedisClient } from './redis-client';

function heartbeatMonitor(config: IConfig) {
  if (config.namespace) {
    ConsumerRedisKeys.setNamespace(config.namespace);
  }
  const { keyLockHeartBeatMonitor } = ConsumerRedisKeys.getGlobalKeys();
  const ticker = new Ticker(tick, 1000);

  let redisClientInstance: RedisClient | null = null;
  let lockManagerInstance: LockManager | null = null;

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

  function handleConsumers(offlineConsumers: string[], cb: TCallback<number>) {
    HeartBeat.handleOfflineConsumers(getRedisClient(), offlineConsumers, cb);
  }

  function getOfflineConsumers(cb: TCallback<string[]>) {
    HeartBeat.getConsumersByOnlineStatus(getRedisClient(), (err, result) => {
      if (err) cb(err);
      else {
        const { offlineConsumers = [] } = result ?? {};
        cb(null, offlineConsumers);
      }
    });
  }

  function tick() {
    getLockManager().acquireLock(keyLockHeartBeatMonitor, 10000, true, () => {
      async.waterfall(
        [getOfflineConsumers, handleConsumers],
        (err?: Error | null) => {
          if (err) throw err;
          ticker.nextTick();
        },
      );
    });
  }

  RedisClient.getInstance(config, (c) => {
    redisClientInstance = c;
    LockManager.getInstance(config, (l) => {
      lockManagerInstance = l;
      tick();
    });
  });
}

process.on('message', (payload: string) => {
  const config: IConfig = JSON.parse(payload);
  heartbeatMonitor(config);
});