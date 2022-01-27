import { ICallback, IRequiredConfig, TQueueParams } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { Consumer } from '../../system/consumer/consumer';
import { queueManager } from '../../system/queue-manager/queue-manager';
import { setConfiguration } from '../../system/common/configuration';

export class WebsocketOnlineStreamWorker {
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected noop = (): void => void 0;

  constructor(redisClient: RedisClient) {
    const { keyLockWebsocketOnlineStreamWorker } = redisKeys.getMainKeys();
    this.redisClient = redisClient;
    this.lockManager = new LockManager(
      redisClient,
      keyLockWebsocketOnlineStreamWorker,
      10000,
      false,
    );
    this.ticker = new Ticker(this.run, 1000);
    this.ticker.nextTick();
  }

  protected run = (): void => {
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      else if (lock) {
        async.waterfall(
          [
            (cb: ICallback<TQueueParams[]>) => {
              queueManager.getMessageQueues(this.redisClient, cb);
            },
            (queues: TQueueParams[], cb: ICallback<void>) => {
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
                cb,
              );
            },
          ],
          (err) => {
            if (err) throw err;
            this.ticker.nextTick();
          },
        );
      } else this.ticker.nextTick();
    });
  };

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}

process.on('message', (c: string) => {
  const config: IRequiredConfig = JSON.parse(c);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new WebsocketOnlineStreamWorker(client);
  });
});
