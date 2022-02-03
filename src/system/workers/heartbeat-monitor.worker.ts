import { ICallback, IConsumerWorkerParameters } from '../../../types';
import { ConsumerHeartbeat } from '../app/consumer/consumer-heartbeat';
import { RedisClient } from '../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Worker } from '../common/worker/worker';
import { setConfiguration } from '../common/configuration';
import { waterfall } from '../lib/async';

class HeartbeatMonitorWorker extends Worker<IConsumerWorkerParameters> {
  work = (cb: ICallback<void>): void => {
    waterfall(
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

export default HeartbeatMonitorWorker;

process.on('message', (payload: string) => {
  const params: IConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new HeartbeatMonitorWorker(client, params, false).run();
  });
});
