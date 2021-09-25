import * as async from 'neo-async';
import { IConfig, TCallback } from '../types';
import { LockManager } from './lock-manager';
import { Ticker } from './ticker';
import { HeartBeat } from './heartbeat';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';

function heartbeatMonitor(config: IConfig) {
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  const { keyLockHeartBeatMonitor } = redisKeys.getGlobalKeys();
  const ticker = new Ticker(tick, 1000);
  const redisClientInstance = new RedisClient(config);
  const lockManagerInstance = new LockManager(redisClientInstance);

  function getLockManager() {
    if (!lockManagerInstance) {
      throw new Error(`Expected an instance of LockManager`);
    }
    return lockManagerInstance;
  }

  function handleConsumers(offlineConsumers: string[], cb: TCallback<number>) {
    HeartBeat.handleOfflineConsumers(redisClientInstance, offlineConsumers, cb);
  }

  function getOfflineConsumers(cb: TCallback<string[]>) {
    HeartBeat.getConsumersByOnlineStatus(redisClientInstance, (err, result) => {
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
  tick();
}

process.on('message', (payload: string) => {
  const config: IConfig = JSON.parse(payload);
  heartbeatMonitor(config);
});
