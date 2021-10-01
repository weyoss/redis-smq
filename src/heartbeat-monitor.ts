import * as async from 'async';
import { IConfig, ICallback } from '../types';
import { LockManager } from './lock-manager';
import { Ticker } from './ticker';
import { Heartbeat } from './heartbeat';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';
import { events } from './events';

function heartbeatMonitor(config: IConfig) {
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  const { keyLockHeartBeatMonitor } = redisKeys.getGlobalKeys();
  let redisClientInstance: RedisClient | null = null;
  let lockManagerInstance: LockManager | null = null;

  const ticker = new Ticker(tick, 1000);
  ticker.on(events.ERROR, (err: Error) => {
    throw err;
  });

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

  function handleExpiredHeartbeats(
    heartbeats: string[],
    cb: ICallback<number>,
  ) {
    Heartbeat.handleExpiredHeartbeat(getRedisClient(), heartbeats, cb);
  }

  function getExpiredHeartbeats(cb: ICallback<string[]>) {
    Heartbeat.getHeartbeatsByStatus(getRedisClient(), (err, result) => {
      if (err) cb(err);
      else {
        const { expired = [] } = result ?? {};
        cb(null, expired);
      }
    });
  }

  function tick() {
    getLockManager().acquireLock(keyLockHeartBeatMonitor, 10000, true, () => {
      async.waterfall(
        [getExpiredHeartbeats, handleExpiredHeartbeats],
        (err?: Error | null) => {
          if (err) throw err;
          ticker.nextTick();
        },
      );
    });
  }

  RedisClient.getInstance(config, (client) => {
    redisClientInstance = client;
    lockManagerInstance = new LockManager(redisClientInstance);
    tick();
  });
}

process.on('message', (payload: string) => {
  const config: IConfig = JSON.parse(payload);
  heartbeatMonitor(config);
});
