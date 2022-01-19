import { ICallback, IConfig, TQueueParams } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Logger } from '../../system/common/logger';
import BLogger from 'bunyan';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { Consumer } from '../../system/consumer/consumer';

export class WebsocketOnlineStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected noop = (): void => void 0;
  protected queueManager: QueueManager;

  constructor(
    redisClient: RedisClient,
    queueManager: QueueManager,
    logger: BLogger,
  ) {
    const { keyLockWebsocketOnlineStreamWorker } = redisKeys.getGlobalKeys();
    this.logger = logger;
    this.redisClient = redisClient;
    this.queueManager = queueManager;
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
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      else if (lock) {
        this.logger.debug(`Lock acquired.`);
        async.waterfall(
          [
            (cb: ICallback<TQueueParams[]>) => {
              this.queueManager.getMessageQueues(cb);
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
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(WebsocketOnlineStreamWorker.name, config.log);
      const queueManager = new QueueManager(client, logger);
      new WebsocketOnlineStreamWorker(client, queueManager, logger);
    }
  });
});
