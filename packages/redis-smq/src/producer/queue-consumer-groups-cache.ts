/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  createLogger,
  EventBusRedis,
  ICallback,
  ILogger,
  IRedisClient,
  Runnable,
  TRedisClientEvent,
} from 'redis-smq-common';
import { Configuration } from '../config/index.js';
import { _getConsumerGroups } from '../consumer-groups/_/_get-consumer-groups.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _getQueues } from '../queue-manager/_/_get-queues.js';
import {
  EQueueDeliveryModel,
  IQueueParams,
  IQueueProperties,
} from '../queue-manager/index.js';
import { Producer } from './producer.js';
import { withSharedPoolConnection } from '../common/redis-connection-pool/with-shared-pool-connection.js';

export class QueueConsumerGroupsCache extends Runnable<
  Pick<TRedisClientEvent, 'error'>
> {
  protected eventBus;
  protected producerId;
  protected logger;
  protected consumerGroupsByQueues: Record<string, string[]> = {};
  protected redisClient: IRedisClient | null = null;

  constructor(producer: Producer) {
    super();
    this.producerId = producer.getId();
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    const config = Configuration.getConfig();

    // Exclusive EventBus instance is needed for tracking consumer group and queue creation/deletion events
    // independently on user configuration
    this.eventBus = new EventBusRedis(config);
    this.eventBus.on('error', (err) => {
      if (this.isRunning())
        this.logger.error(`EventBus error: ${err.message}`, err);
    });
    this.logger.debug(
      `QueueConsumerGroupsCache instance created for producer ${this.producerId}`,
    );
  }

  getConsumerGroups(queue: IQueueParams): {
    isPubSub: boolean;
    queueConsumerGroups: string[];
  } {
    const key = `${queue.name}@${queue.ns}`;
    this.logger.debug(`Getting consumer groups for queue ${key}`);

    if (this.consumerGroupsByQueues[key]) {
      const groupCount = this.consumerGroupsByQueues[key].length;
      this.logger.debug(
        `Found queue ${key} in cache with ${groupCount} consumer groups`,
      );
      return {
        isPubSub: true,
        queueConsumerGroups: this.consumerGroupsByQueues[key],
      };
    }

    this.logger.debug(
      `Queue ${key} not found in cache, returning empty result`,
    );
    return {
      isPubSub: false,
      queueConsumerGroups: [],
    };
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('QueueConsumerGroupsCache is going up');
    return super.goingUp().concat([
      (cb: ICallback) => {
        this.eventBus.run((err) => cb(err));
      },
      this.subscribe,
      this.loadConsumerGroups,
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('QueueConsumerGroupsCache is going down');
    return [
      this.unsubscribe,
      this.cleanUpConsumerGroups,
      (cb: ICallback) => {
        this.eventBus.shutdown(cb);
      },
    ].concat(super.goingDown());
  }

  protected addConsumerGroup = (queue: IQueueParams, groupId: string) => {
    const queueKey = `${queue.name}@${queue.ns}`;
    this.logger.debug(`Adding consumer group ${groupId} to queue ${queueKey}`);

    this.consumerGroupsByQueues[queueKey] =
      this.consumerGroupsByQueues[queueKey] || [];
    const group = this.consumerGroupsByQueues[queueKey];

    if (!group.includes(groupId)) {
      this.logger.debug(
        `Consumer group ${groupId} not found in queue ${queueKey}, adding it`,
      );
      group.push(groupId);
    } else {
      this.logger.debug(
        `Consumer group ${groupId} already exists in queue ${queueKey}, skipping`,
      );
    }
  };

  protected deleteConsumerGroup = (queue: IQueueParams, groupId: string) => {
    const queueKey = `${queue.name}@${queue.ns}`;
    this.logger.debug(
      `Deleting consumer group ${groupId} from queue ${queueKey}`,
    );

    const groups = this.consumerGroupsByQueues[queueKey];
    if (groups && groups.includes(groupId)) {
      this.logger.debug(
        `Found consumer group ${groupId} in queue ${queueKey}, removing it`,
      );
      this.consumerGroupsByQueues[queueKey] = groups.filter(
        (i) => i !== groupId,
      );
      this.logger.debug(
        `Queue ${queueKey} now has ${this.consumerGroupsByQueues[queueKey].length} consumer groups`,
      );
    } else {
      this.logger.debug(
        `Consumer group ${groupId} not found in queue ${queueKey}, nothing to delete`,
      );
    }
  };

  protected addQueue = (queue: IQueueParams, properties: IQueueProperties) => {
    const queueKey = `${queue.name}@${queue.ns}`;
    this.logger.debug(
      `Adding queue ${queueKey} with delivery model ${EQueueDeliveryModel[properties.deliveryModel]}`,
    );

    if (properties.deliveryModel === EQueueDeliveryModel.PUB_SUB) {
      this.logger.debug(
        `Queue ${queueKey} is PUB_SUB, initializing empty consumer groups array`,
      );
      this.consumerGroupsByQueues[queueKey] = [];
    } else {
      this.logger.debug(
        `Queue ${queueKey} is not PUB_SUB, skipping consumer groups initialization`,
      );
    }
  };

  protected deleteQueue = (queue: IQueueParams) => {
    const queueKey = `${queue.name}@${queue.ns}`;
    this.logger.debug(`Deleting queue ${queueKey} from consumer groups cache`);

    if (this.consumerGroupsByQueues[queueKey]) {
      this.logger.debug(`Found queue ${queueKey} in cache, removing it`);
      delete this.consumerGroupsByQueues[queueKey];
    } else {
      this.logger.debug(
        `Queue ${queueKey} not found in cache, nothing to delete`,
      );
    }
  };

  protected subscribe = (cb: ICallback<void>): void => {
    this.logger.debug('Subscribing to queue events');
    this.eventBus.on('queue.queueCreated', this.addQueue);
    this.eventBus.on('queue.queueDeleted', this.deleteQueue);
    this.eventBus.on('queue.consumerGroupCreated', this.addConsumerGroup);
    this.eventBus.on('queue.consumerGroupDeleted', this.deleteConsumerGroup);
    this.logger.info('Successfully subscribed to all queue events');
    cb();
  };

  protected unsubscribe = (cb: ICallback): void => {
    this.logger.debug('Unsubscribing from queue events');
    this.eventBus.removeListener('queue.queueCreated', this.addQueue);
    this.eventBus.removeListener('queue.queueDeleted', this.deleteQueue);
    this.eventBus.removeListener(
      'queue.consumerGroupCreated',
      this.addConsumerGroup,
    );
    this.eventBus.removeListener(
      'queue.consumerGroupDeleted',
      this.deleteConsumerGroup,
    );
    this.logger.info('Successfully unsubscribed from all queue events');
    cb();
  };

  protected loadConsumerGroups = (cb: ICallback<void>): void => {
    this.logger.debug('Loading consumer groups for all queues');
    withSharedPoolConnection((redisClient, cb) => {
      async.waterfall(
        [
          (cb: ICallback<IQueueParams[]>) => {
            this.logger.debug('Getting all queues');
            _getQueues(redisClient, cb);
          },
          (queues: IQueueParams[], cb: ICallback<void>) => {
            this.logger.info(
              `Found ${queues.length} queues, processing each queue`,
            );
            async.eachOf(
              queues,
              (queue, index, done) => {
                const queueKey = `${queue.name}@${queue.ns}`;
                this.logger.debug(
                  `Processing queue ${queueKey} (${index + 1}/${queues.length})`,
                );
                async.waterfall(
                  [
                    (cb: ICallback<IQueueProperties>) => {
                      this.logger.debug(
                        `Getting properties for queue ${queueKey}`,
                      );
                      _getQueueProperties(redisClient, queue, cb);
                    },
                    (properties: IQueueProperties, cb: ICallback<void>) => {
                      this.logger.debug(
                        `Queue ${queueKey} has delivery model ${EQueueDeliveryModel[properties.deliveryModel]}`,
                      );
                      if (
                        properties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                      ) {
                        this.logger.debug(
                          `Queue ${queueKey} is PUB_SUB, getting consumer groups`,
                        );
                        _getConsumerGroups(redisClient, queue, (err, reply) => {
                          if (err) {
                            this.logger.error(
                              `Failed to get consumer groups for queue ${queueKey}`,
                              err,
                            );
                            cb(err);
                          } else {
                            const groupCount = reply?.length || 0;
                            this.logger.debug(
                              `Found ${groupCount} consumer groups for queue ${queueKey}`,
                            );
                            this.consumerGroupsByQueues[queueKey] = reply ?? [];
                            cb();
                          }
                        });
                      } else {
                        this.logger.debug(
                          `Queue ${queueKey} is not PUB_SUB, skipping consumer groups`,
                        );
                        cb();
                      }
                    },
                  ],
                  (err) => {
                    if (err) {
                      this.logger.error(
                        `Error processing queue ${queueKey}`,
                        err,
                      );
                    } else {
                      this.logger.debug(
                        `Successfully processed queue ${queueKey}`,
                      );
                    }
                    done(err);
                  },
                );
              },
              (err) => {
                if (err) {
                  this.logger.error('Failed to process all queues', err);
                } else {
                  this.logger.info(
                    'Successfully loaded consumer groups for all queues',
                  );
                }
                cb(err);
              },
            );
          },
        ],
        (err) => {
          if (err) {
            this.logger.error('Failed to load consumer groups', err);
          } else {
            this.logger.info('Consumer groups cache initialized successfully');
          }
          cb(err);
        },
      );
    }, cb);
  };

  protected cleanUpConsumerGroups = (cb: ICallback<void>): void => {
    this.logger.debug('Cleaning up consumer groups cache');
    const groupCount = Object.keys(this.consumerGroupsByQueues).length;
    this.consumerGroupsByQueues = {};
    this.logger.info(
      `Cleared ${groupCount} entries from consumer groups cache`,
    );
    cb();
  };
}
