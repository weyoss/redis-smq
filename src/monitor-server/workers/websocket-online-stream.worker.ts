import { ICallback, TQueueParams, TWorkerParameters } from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Consumer } from '../../system/app/consumer/consumer';
import { queueManager } from '../../system/app/queue-manager/queue-manager';
import { setConfiguration } from '../../system/common/configuration';
import { Worker } from '../../system/common/worker/worker';
import { each, waterfall } from '../../system/lib/async';

export class WebsocketOnlineStreamWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<TQueueParams[]>) => {
          queueManager.getMessageQueues(this.redisClient, cb);
        },
        (queues: TQueueParams[], done: ICallback<void>) => {
          each(
            queues,
            (item, _, done) => {
              Consumer.getOnlineConsumers(
                this.redisClient,
                item,
                false,
                (err, reply) => {
                  if (err) done(err);
                  else {
                    this.redisClient.publish(
                      `streamOnlineQueueConsumers:${item.ns}:${item.name}`,
                      JSON.stringify(reply ?? {}),
                      () => done(),
                    );
                  }
                },
              );
            },
            done,
          );
        },
      ],
      cb,
    );
  };
}

export default WebsocketOnlineStreamWorker;

process.on('message', (payload: string) => {
  const params: TWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new WebsocketOnlineStreamWorker(client, params, false).run();
  });
});
