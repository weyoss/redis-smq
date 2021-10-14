import * as async from 'async';
import { IConfig, ICallback } from '../types';
import { LockManager } from './lock-manager';
import { Ticker } from './ticker';
import { Heartbeat } from './heartbeat';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';

function heartbeatMonitor(redisClient: RedisClient) {
  const { keyLockHeartBeatMonitor } = redisKeys.getGlobalKeys();
  const lockManagerInstance = new LockManager(redisClient);
  const ticker = new Ticker(tick, 1000);

  function handleExpiredHeartbeats(
    heartbeats: string[],
    cb: ICallback<number>,
  ) {
    Heartbeat.handleExpiredHeartbeat(redisClient, heartbeats, cb);
  }

  function getExpiredHeartbeats(cb: ICallback<string[]>) {
    Heartbeat.getHeartbeatsByStatus(redisClient, (err, result) => {
      if (err) cb(err);
      else {
        const { expired = [] } = result ?? {};
        cb(null, expired);
      }
    });
  }

  function tick() {
    lockManagerInstance.acquireLock(
      keyLockHeartBeatMonitor,
      10000,
      true,
      () => {
        async.waterfall(
          [getExpiredHeartbeats, handleExpiredHeartbeats],
          (err?: Error | null) => {
            if (err) throw err;
            ticker.nextTick();
          },
        );
      },
    );
  }

  ticker.nextTick();
}

process.on('message', (payload: string) => {
  const config: IConfig = JSON.parse(payload);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (client) => {
    heartbeatMonitor(client);
  });
});
