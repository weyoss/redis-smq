import * as async from 'async';
import { ICallback, TConsumerWorkerParameters } from '../../../types';
import { Ticker } from '../common/ticker/ticker';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

class HeartbeatMonitorWorker {
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.ticker = new Ticker(this.onTick, 1000);
    this.ticker.nextTick();
  }

  protected onTick = () => {
    async.waterfall(
      [
        (cb: ICallback<string[]>): void =>
          ConsumerHeartbeat.getExpiredHeartbeatIds(this.redisClient, cb),
        (consumerIds: string[], cb: ICallback<void>): void => {
          ConsumerHeartbeat.handleExpiredHeartbeatIds(
            this.redisClient,
            consumerIds,
            cb,
          );
        },
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
