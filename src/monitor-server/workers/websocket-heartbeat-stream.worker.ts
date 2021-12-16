import { ICallback, IConfig } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Logger } from '../../system/common/logger';
import BLogger from 'bunyan';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { Heartbeat } from '../../system/common/heartbeat';

export class WebsocketHeartbeatStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected tasks: ((cb: ICallback<void>) => void)[] = [];
  protected noop = (): void => void 0;

  constructor(redisClient: RedisClient, logger: BLogger) {
    const { keyRateStreamWorkerStats } = redisKeys.getGlobalKeys();
    this.logger = logger;
    this.redisClient = redisClient;
    this.lockManager = new LockManager(
      redisClient,
      keyRateStreamWorkerStats,
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
        Heartbeat.getValidHeartbeats(this.redisClient, false, (err, reply) => {
          if (err) throw err;
          else {
            async.each(
              reply ?? [],
              (item, done) => {
                const { ns, queueName, consumerId, producerId } =
                  redisKeys.extractData(item.key) ?? {};
                if (ns && queueName && (consumerId || producerId)) {
                  const payload = String(item.payload);
                  if (consumerId) {
                    this.redisClient.publish(
                      `consumerHeartbeat:${consumerId}`,
                      payload,
                      this.noop,
                    );
                  } else if (producerId) {
                    this.redisClient.publish(
                      `producerHeartbeat:${producerId}`,
                      payload,
                      this.noop,
                    );
                  }
                }
                done();
              },
              () => this.ticker.nextTick(),
            );
          }
        });
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
