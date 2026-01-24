/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  ILogger,
  Runnable,
  TRedisClientEvent,
} from 'redis-smq-common';
import { _getConsumerGroups } from '../consumer-groups/_/_get-consumer-groups.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _getQueues } from '../queue-manager/_/_get-queues.js';
import {
  EQueueDeliveryModel,
  IQueueParams,
  IQueueProperties,
} from '../queue-manager/index.js';
import { Producer } from './producer.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';

/**
 * Manages an in-memory cache of consumer groups for PUB/SUB queues.
 *
 * This class is responsible for:
 * - Loading all PUB/SUB queues and their consumer groups on startup.
 * - Keeping the cache synchronized in real-time by listening to queue and
 *   consumer group events (creation, deletion).
 * - Providing a fast, local lookup for the Producer to resolve the target
 *   consumer groups for a given message, avoiding expensive Redis queries
 *   during the message production path.
 * - Operating resiliently, ensuring that a failure to process one queue
 *   during the initial load does not prevent the entire system from starting.
 */
export class PubSubTargetResolver extends Runnable<
  Pick<TRedisClientEvent, 'error'>
> {
  protected internalEventBus;
  protected producerId;
  protected logger;
  /**
   * In-memory cache.
   * Key: A string identifier for the queue (e.g., "my-queue@my-ns").
   * Value: An array of consumer group IDs.
   *
   * A queue is only present in this cache if its delivery model is PUB_SUB.
   */
  protected pubSubTargets: Record<string, string[]> = {};

  constructor(producer: Producer, logger: ILogger) {
    super();
    this.producerId = producer.getId();
    this.logger = logger.createLogger(this.constructor.name);
    this.internalEventBus = InternalEventBus.getInstance();
    this.logger.debug(
      `PubSubTargetResolver instance created for producer ${this.producerId}`,
    );
  }

  /**
   * Generates a unique string key for a queue.
   * @param queue - The queue parameters.
   * @returns A string in the format "name@ns".
   */
  private getQueueKey(queue: IQueueParams): string {
    return `${queue.name}@${queue.ns}`;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('PubSubTargetResolver is going up...');
    return super
      .goingUp()
      .concat([this.subscribeToEvents, this.loadAndCacheInitialTargets]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('PubSubTargetResolver is going down...');
    return [this.unsubscribeFromEvents, this.clearCache].concat(
      super.goingDown(),
    );
  }

  /**
   * Event handler for 'queue.consumerGroupCreated'.
   * Adds a consumer group to a PUB/SUB queue's entry in the cache.
   */
  protected onConsumerGroupCreated = (queue: IQueueParams, groupId: string) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'consumerGroupCreated' event for group [${groupId}] on queue [${queueKey}]`,
    );

    // The queue might not be a PUB/SUB queue, in which case it won't be in the cache.
    if (this.pubSubTargets[queueKey]) {
      const targets = this.pubSubTargets[queueKey];
      if (!targets.includes(groupId)) {
        targets.push(groupId);
        this.logger.debug(
          `Added group [${groupId}] to cache for queue [${queueKey}].`,
        );
      }
    }
  };

  /**
   * Event handler for 'queue.consumerGroupDeleted'.
   * Removes a consumer group from a PUB/SUB queue's entry in the cache.
   */
  protected onConsumerGroupDeleted = (queue: IQueueParams, groupId: string) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'consumerGroupDeleted' event for group [${groupId}] on queue [${queueKey}]`,
    );

    if (this.pubSubTargets[queueKey]) {
      const targets = this.pubSubTargets[queueKey];
      const index = targets.indexOf(groupId);
      if (index > -1) {
        targets.splice(index, 1);
        this.logger.debug(
          `Removed group [${groupId}] from cache for queue [${queueKey}].`,
        );
      }
    }
  };

  /**
   * Event handler for 'queue.queueCreated'.
   * If the new queue is a PUB/SUB queue, it adds an entry for it in the cache.
   */
  protected onQueueCreated = (
    queue: IQueueParams,
    properties: IQueueProperties,
  ) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'queueCreated' event for queue [${queueKey}] with delivery model [${EQueueDeliveryModel[properties.deliveryModel]}]`,
    );

    if (properties.deliveryModel === EQueueDeliveryModel.PUB_SUB) {
      this.pubSubTargets[queueKey] = this.pubSubTargets[queueKey] ?? [];
      this.logger.debug(`Added PUB/SUB queue [${queueKey}] to cache.`);
    }
  };

  /**
   * Event handler for 'queue.queueDeleted'.
   * Removes the queue's entry from the cache.
   */
  protected onQueueDeleted = (queue: IQueueParams) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(`Handling 'queueDeleted' event for queue [${queueKey}]`);
    if (this.pubSubTargets[queueKey]) {
      delete this.pubSubTargets[queueKey];
      this.logger.debug(`Removed queue [${queueKey}] from cache.`);
    }
  };

  /**
   * Subscribes to real-time events to keep the cache synchronized.
   */
  protected subscribeToEvents = (cb: ICallback<void>): void => {
    this.logger.debug('Subscribing to queue and consumer group events...');
    this.internalEventBus.on('queue.queueCreated', this.onQueueCreated);
    this.internalEventBus.on('queue.queueDeleted', this.onQueueDeleted);
    this.internalEventBus.on(
      'queue.consumerGroupCreated',
      this.onConsumerGroupCreated,
    );
    this.internalEventBus.on(
      'queue.consumerGroupDeleted',
      this.onConsumerGroupDeleted,
    );
    this.logger.info('Successfully subscribed to events.');
    cb();
  };

  /**
   * Unsubscribes from all events during shutdown.
   */
  protected unsubscribeFromEvents = (cb: ICallback): void => {
    this.logger.debug('Unsubscribing from events...');
    this.internalEventBus.removeListener(
      'queue.queueCreated',
      this.onQueueCreated,
    );
    this.internalEventBus.removeListener(
      'queue.queueDeleted',
      this.onQueueDeleted,
    );
    this.internalEventBus.removeListener(
      'queue.consumerGroupCreated',
      this.onConsumerGroupCreated,
    );
    this.internalEventBus.removeListener(
      'queue.consumerGroupDeleted',
      this.onConsumerGroupDeleted,
    );
    this.logger.info('Successfully unsubscribed from all events.');
    cb();
  };

  /**
   * Performs the initial population of the cache on startup.
   *
   * It fetches all queues, identifies those with a PUB/SUB delivery model,
   * and loads their consumer groups into the cache. This process is designed
   * to be resilient; if fetching details for one queue fails, it logs the
   * error and continues with the others, preventing a single faulty queue
   * from halting the entire producer startup.
   */
  protected loadAndCacheInitialTargets = (cb: ICallback<void>): void => {
    this.logger.debug('Loading and caching initial PUB/SUB targets...');
    withSharedPoolConnection((redisClient, cb) => {
      async.waterfall(
        [
          (cb: ICallback<IQueueParams[]>) => {
            _getQueues(redisClient, cb);
          },
          (queues: IQueueParams[], cb: ICallback<void>) => {
            this.logger.info(`Found [${queues.length}] queues to process.`);
            async.eachOf(
              queues,
              (queue, index, done) => {
                const queueKey = this.getQueueKey(queue);
                this.logger.debug(
                  `Processing queue [${queueKey}] (${index + 1}/${queues.length})`,
                );
                async.waterfall(
                  [
                    (cb: ICallback<IQueueProperties>) => {
                      _getQueueProperties(redisClient, queue, cb);
                    },
                    (properties: IQueueProperties, cb: ICallback<void>) => {
                      if (
                        properties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                      ) {
                        _getConsumerGroups(redisClient, queue, (err, reply) => {
                          if (err) return cb(err);
                          const targets = reply ?? [];
                          this.pubSubTargets[queueKey] = targets;
                          this.logger.debug(
                            `Cached [${targets.length}] targets for PUB/SUB queue [${queueKey}].`,
                          );
                          cb();
                        });
                      } else {
                        cb();
                      }
                    },
                  ],
                  (err) => {
                    if (err) {
                      // Log the error but do not propagate it up. A failure in loading
                      // one queue should not prevent the producer from starting.
                      this.logger.error(
                        `Error processing queue [${queueKey}]. Skipping.`,
                        err,
                      );
                    }
                    done();
                  },
                );
              },
              () => {
                this.logger.info(
                  'Finished initial loading of PUB/SUB targets.',
                );
                cb();
              },
            );
          },
        ],
        (err) => {
          if (err) {
            this.logger.error(
              'Failed to complete initial target loading.',
              err,
            );
          } else {
            this.logger.info('Initial target cache is ready.');
          }
          cb(err);
        },
      );
    }, cb);
  };

  /**
   * Clears the cache during shutdown.
   */
  protected clearCache = (cb: ICallback<void>): void => {
    this.logger.debug('Clearing PUB/SUB target cache...');
    const count = Object.keys(this.pubSubTargets).length;
    this.pubSubTargets = {};
    this.logger.info(`Cleared [${count}] entries from cache.`);
    cb();
  };

  /**
   * Resolves the consumer groups for a given queue.
   *
   * This method checks the local cache to determine if a queue is configured
   * for PUB/SUB delivery and, if so, returns its consumer groups.
   *
   * @param queue - The queue to resolve.
   * @returns An object indicating if the queue is PUB/SUB and a list of its
   *          consumer group IDs (targets).
   */
  resolveTargets(queue: IQueueParams): {
    isPubSub: boolean;
    targets: string[];
  } {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(`Resolving targets for queue [${queueKey}]`);

    if (this.pubSubTargets[queueKey]) {
      const targets = this.pubSubTargets[queueKey];
      this.logger.debug(
        `Found queue [${queueKey}] in cache with [${targets.length}] targets.`,
      );
      return {
        isPubSub: true,
        targets,
      };
    }

    this.logger.debug(`Queue [${queueKey}] not found in cache.`);
    return {
      isPubSub: false,
      targets: [],
    };
  }
}
