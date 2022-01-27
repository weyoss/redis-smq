import * as async from 'async';
import { ICallback, TConsumerWorkerParameters } from '../../../types';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { RedisClient } from '../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { ConsumerWorker } from '../consumer/consumer-worker';
import { setConfiguration } from '../common/configuration';

class HeartbeatMonitorWorker extends ConsumerWorker {
  work = (cb: ICallback<void>): void => {
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
      cb,
    );
  };
}

process.on('message', (payload: string) => {
  const { config }: TConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new HeartbeatMonitorWorker(client);
  });
});
