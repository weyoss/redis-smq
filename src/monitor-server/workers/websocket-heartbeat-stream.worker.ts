import {
  ICallback,
  IRequiredConfig,
  TWebsocketHeartbeatOnlineIdsStreamPayload,
} from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { ConsumerHeartbeat } from '../../system/consumer/consumer-heartbeat';
import { setConfiguration } from '../../system/common/configuration';

export class WebsocketHeartbeatStreamWorker {
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected noop = (): void => void 0;

  constructor(redisClient: RedisClient) {
    const { keyLockWebsocketHeartbeatStreamWorker } = redisKeys.getMainKeys();
    this.redisClient = redisClient;
    this.lockManager = new LockManager(
      redisClient,
      keyLockWebsocketHeartbeatStreamWorker,
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
        const onlineIds: TWebsocketHeartbeatOnlineIdsStreamPayload = {
          consumers: [],
        };
        ConsumerHeartbeat.getValidHeartbeats(
          this.redisClient,
          false,
          (err, reply) => {
            if (err) throw err;
            else {
              async.each(
                reply ?? [],
                (item, done) => {
                  const payload = String(item.payload);
                  onlineIds.consumers.push(item.consumerId);
                  this.redisClient.publish(
                    `streamConsumerHeartbeat:${item.consumerId}`,
                    payload,
                    this.noop,
                  );
                  done();
                },
                () => {
                  this.redisClient.publish(
                    `streamHeartbeatOnlineIds`,
                    JSON.stringify(onlineIds),
                    this.noop,
                  );
                  this.ticker.nextTick();
                },
              );
            }
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
    else {
      new WebsocketHeartbeatStreamWorker(client);
    }
  });
});
