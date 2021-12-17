import * as async from 'async';
import {
  ICallback,
  TConsumerWorkerParameters,
  THeartbeatParams,
} from '../../../types';
import { Ticker } from '../common/ticker/ticker';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

class HeartbeatMonitorWorker {
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.ticker = new Ticker(this.onTick, 1000);
  }

  protected onTick = () => {
    async.waterfall(
      [
        (cb: ICallback<(THeartbeatParams | string)[]>): void =>
          Heartbeat.getExpiredHeartbeatsKeys(this.redisClient, false, cb),
        (
          heartbeats: (THeartbeatParams | string)[],
          cb: ICallback<void>,
        ): void =>
          Heartbeat.handleExpiredHeartbeatKeys(
            this.redisClient,
            heartbeats,
            cb,
          ),
      ],
      (err) => {
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
    else if (!client) throw new EmptyCallbackReplyError();
    else new HeartbeatMonitorWorker(client);
  });
});
