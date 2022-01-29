import { ICallback, TQueueParams, TWorkerParameters } from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import * as async from 'async';
import { Consumer } from '../../system/consumer/consumer';
import { queueManager } from '../../system/queue-manager/queue-manager';
import { setConfiguration } from '../../system/common/configuration';
import { Worker } from '../../system/common/worker';

export class WebsocketOnlineStreamWorker extends Worker {
  protected noop = (): void => void 0;

  work = (cb: ICallback<void>): void => {
    async.waterfall(
      [
        (cb: ICallback<TQueueParams[]>) => {
          queueManager.getMessageQueues(this.redisClient, cb);
        },
        (queues: TQueueParams[], done: ICallback<void>) => {
          async.each<TQueueParams, Error>(
            queues,
            (item, done) => {
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
                      this.noop,
                    );
                    done();
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
    else new WebsocketOnlineStreamWorker(client, params).run();
  });
});
