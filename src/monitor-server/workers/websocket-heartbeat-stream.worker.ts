import {
  ICallback,
  IConfig,
  TWebsocketHeartbeatOnlineIdsStreamPayload,
} from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Logger } from '../../system/common/logger';
import BLogger from 'bunyan';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { ConsumerHeartbeat } from '../../system/consumer/consumer-heartbeat';

export class WebsocketHeartbeatStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected noop = (): void => void 0;

  constructor(redisClient: RedisClient, logger: BLogger) {
    const { keyLockWebsocketHeartbeatStreamWorker } = redisKeys.getGlobalKeys();
    this.logger = logger;
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
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      else if (lock) {
        this.logger.debug(`Lock acquired.`);
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
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(WebsocketHeartbeatStreamWorker.name, config.log);
      new WebsocketHeartbeatStreamWorker(client, logger);
    }
  });
});
