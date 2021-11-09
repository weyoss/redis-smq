import * as async from 'async';
import { ICallback, TConsumerWorkerParameters } from '../../../types';
import { Ticker } from '../common/ticker';
import { Heartbeat } from '../consumer/heartbeat';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys';

class HeartbeatMonitorWorker {
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.ticker = new Ticker(this.onTick, 1000);
  }

  protected onTick = () => {
    const handleExpiredHeartbeats = (
      heartbeats: string[],
      cb: ICallback<number>,
    ): void => {
      Heartbeat.handleExpiredHeartbeats(this.redisClient, heartbeats, cb);
    };
    const getExpiredHeartbeats = (cb: ICallback<string[]>): void => {
      Heartbeat.getHeartbeatsByStatus(this.redisClient, (err, result) => {
        if (err) cb(err);
        else {
          const { expired = [] } = result ?? {};
          cb(null, expired);
        }
      });
    };
    async.waterfall(
      [getExpiredHeartbeats, handleExpiredHeartbeats],
      (err?: Error | null) => {
        if (err) throw err;
        this.ticker.nextTick();
      },
    );
  };
}

process.on('message', (payload: string) => {
  const { config }: TConsumerWorkerParameters = JSON.parse(payload);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new Error(`Expected an instance of RedisClient`);
    else new HeartbeatMonitorWorker(client);
  });
});
