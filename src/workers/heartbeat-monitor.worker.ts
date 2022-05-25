import { IConsumerWorkerParameters } from '../../types';
import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { async, Worker } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class HeartbeatMonitorWorker extends Worker<IConsumerWorkerParameters> {
  work = (cb: ICallback<void>): void => {
    async.waterfall(
      [
        (cb: ICallback<string[]>): void =>
          ConsumerHeartbeat.getExpiredHeartbeatIds(this.redisClient, cb),
        (consumerIds: string[], cb: ICallback<void>): void => {
          const config = this.params.config;
          ConsumerHeartbeat.handleExpiredHeartbeatIds(
            config,
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
