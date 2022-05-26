import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { async, RedisClient, Worker } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { IRequiredConfig } from '../../types';

export class HeartbeatMonitorWorker extends Worker {
  protected redisClient: RedisClient;
  protected config: IRequiredConfig;

  constructor(
    redisClient: RedisClient,
    config: IRequiredConfig,
    managed: boolean,
  ) {
    super(managed);
    this.redisClient = redisClient;
    this.config = config;
  }

  work = (cb: ICallback<void>): void => {
    async.waterfall(
      [
        (cb: ICallback<string[]>): void =>
          ConsumerHeartbeat.getExpiredHeartbeatIds(this.redisClient, cb),
        (consumerIds: string[], cb: ICallback<void>): void => {
          ConsumerHeartbeat.handleExpiredHeartbeatIds(
            this.config,
            this.redisClient,
            consumerIds,
            cb,
          );
        },
      ],
      cb,
    );
  };
}

export default HeartbeatMonitorWorker;
