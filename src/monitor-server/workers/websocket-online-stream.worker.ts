import { ICallback, TQueueParams } from '../../../types';
import { Consumer } from '../../system/app/consumer/consumer';
import { Worker } from '../../system/common/worker/worker';
import { each, waterfall } from '../../system/lib/async';
import { Queue } from '../../system/app/queue-manager/queue';

export class WebsocketOnlineStreamWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<TQueueParams[]>) => {
          Queue.list(this.redisClient, cb);
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
