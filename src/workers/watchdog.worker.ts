import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { async, RedisClient, Worker } from 'redis-smq-common';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';
import { IRequiredConfig } from '../../types';
import { TCleanUpStatus } from '../lib/consumer/consumer-message-handler/processing-queue';
import { consumerQueues } from '../lib/consumer/consumer-queues';
import { MessageHandler } from '../lib/consumer/consumer-message-handler/message-handler';
import { ERetryStatus } from '../lib/consumer/consumer-message-handler/retry-message';

export class WatchdogWorker extends Worker {
  protected redisClient: RedisClient;
  protected config: IRequiredConfig;
  protected logger: ICompatibleLogger;

  constructor(
    redisClient: RedisClient,
    config: IRequiredConfig,
    managed: boolean,
    logger: ICompatibleLogger,
  ) {
    super(managed);
    this.redisClient = redisClient;
    this.config = config;
    this.logger = logger;
  }

  work = (cb: ICallback<void>): void => {
    ConsumerHeartbeat.getExpiredHeartbeatIds(
      this.redisClient,
      0,
      100,
      (err, reply) => {
        if (err) cb(err);
        else {
          const ids = reply ?? [];
          if (ids.length) {
            const statuses: TCleanUpStatus[] = [];
            const multi = this.redisClient.multi();
            async.each(
              ids,
              (consumerId, key, callback) => {
                ConsumerHeartbeat.handleExpiredHeartbeatId(consumerId, multi);
                consumerQueues.getConsumerQueues(
                  this.redisClient,
                  consumerId,
                  (err, reply) => {
                    if (err) callback(err);
                    else {
                      const queues = reply ?? [];
                      async.each(
                        queues,
                        (queue, _, done) => {
                          MessageHandler.cleanUp(
                            this.config,
                            this.redisClient,
                            consumerId,
                            queue,
                            multi,
                            (err, reply) => {
                              if (err) done(err);
                              else {
                                statuses.push(reply ?? false);
                                done();
                              }
                            },
                          );
                        },
                        callback,
                      );
                    }
                  },
                );
              },
              (err) => {
                if (err) cb(err);
                else {
                  multi.exec((err) => {
                    if (err) cb(err);
                    else {
                      statuses.forEach((cleanUpStatus) => {
                        if (cleanUpStatus) {
                          this.logger.debug(
                            `Message ID ${cleanUpStatus.message.getId()} has been ${
                              cleanUpStatus.status ===
                              ERetryStatus.MESSAGE_DEAD_LETTERED
                                ? 'dead-lettered'
                                : 'unacknowledged'
                            }.`,
                          );
                        }
                      });
                      cb();
                    }
                  });
                }
              },
            );
          } else cb();
        }
      },
    );
  };
}

export default WatchdogWorker;
