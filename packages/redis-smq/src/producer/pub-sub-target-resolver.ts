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
 * An event that arrived while the initial load was in flight. Events are
 * recorded in arrival order and replayed against the cache once the load
 * settles, so that no group creation or deletion that happened during the
 * load is lost.
 */
export type TBufferedEvent =
  | { type: 'queueCreated'; queue: IQueueParams; properties: IQueueProperties }
  | { type: 'queueDeleted'; queue: IQueueParams }
  | { type: 'groupCreated'; queue: IQueueParams; groupId: string }
  | { type: 'groupDeleted'; queue: IQueueParams; groupId: string };

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
 *
 * Concurrency note — events during the initial load:
 *
 * The resolver subscribes to queue/group events before the load begins,
 * so it can observe changes that happen while it is reading the queues.
 * However, during the load, `pubSubTargets` is being populated and any
 * event applied against a partially-populated cache may be lost (if the
 * entry does not yet exist) or overwritten (if the load's own read for
 * the same queue completes afterwards with a stale response).
 *
 * To handle this, `initialLoadInProgress` is set before the first Redis
 * read and cleared after the last one. Every queue/group event that
 * arrives during that interval is recorded in `bufferedEvents`, and the
 * buffer is replayed against the cache (in arrival order) once the load
 * settles. Once the flag is cleared, events are applied directly.
 */
export class PubSubTargetResolver extends Runnable<
  Pick<TRedisClientEvent, 'error'>
> {
  protected internalEventBus;
  protected producerId;
  protected logger;

  /**
   * In-memory cache.
   * Key: `name@ns` for a queue.
   * Value: the IDs of every consumer group currently attached to it.
   *
   * A queue is only present here if its delivery model is PUB_SUB.
   */
  protected pubSubTargets: Record<string, string[]> = {};

  /**
   * True from the moment loadAndCacheInitialTargets() begins its first
   * Redis read until the last read for the last queue has settled and the
   * buffered events have been replayed.
   *
   * While this flag is true, every queue/group event is recorded in
   * `bufferedEvents` instead of being applied directly.
   */
  protected initialLoadInProgress = false;

  /**
   * Events received while `initialLoadInProgress` was true, in arrival
   * order. Drained once the load completes.
   */
  protected bufferedEvents: TBufferedEvent[] = [];

  constructor(producer: Producer, logger: ILogger) {
    super();
    this.producerId = producer.getId();
    this.logger = logger.createLogger(this.constructor.name);
    this.internalEventBus = InternalEventBus.getInstance();
    this.logger.debug(
      `PubSubTargetResolver instance created for producer ${this.producerId}`,
    );
  }

  private getQueueKey(queue: IQueueParams): string {
    return `${queue.name}@${queue.ns}`;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super
      .goingUp()
      .concat([this.subscribeToEvents, this.loadAndCacheInitialTargets]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [this.unsubscribeFromEvents, this.clearCache].concat(
      super.goingDown(),
    );
  }

  // ─── Cache mutation primitives ───────────────────────────────────────────
  //
  // These are the single source of truth for how the cache reflects each
  // event. Both the direct (post-load) path and the buffered-replay path
  // call them, so there is exactly one implementation of each rule.

  private applyQueueCreated(
    queue: IQueueParams,
    properties: IQueueProperties,
  ): void {
    if (properties.deliveryModel !== EQueueDeliveryModel.PUB_SUB) {
      // A non-PUB/SUB queue is not tracked in the cache.
      return;
    }
    const queueKey = this.getQueueKey(queue);
    this.pubSubTargets[queueKey] = this.pubSubTargets[queueKey] ?? [];
    this.logger.debug(`Added PUB/SUB queue [${queueKey}] to cache.`);
  }

  private applyQueueDeleted(queue: IQueueParams): void {
    const queueKey = this.getQueueKey(queue);
    if (this.pubSubTargets[queueKey]) {
      delete this.pubSubTargets[queueKey];
      this.logger.debug(`Removed queue [${queueKey}] from cache.`);
    }
  }

  private applyGroupCreated(queue: IQueueParams, groupId: string): void {
    const queueKey = this.getQueueKey(queue);
    const targets = this.pubSubTargets[queueKey];
    if (targets && !targets.includes(groupId)) {
      targets.push(groupId);
      this.logger.debug(
        `Added group [${groupId}] to cache for queue [${queueKey}].`,
      );
    }
  }

  private applyGroupDeleted(queue: IQueueParams, groupId: string): void {
    const queueKey = this.getQueueKey(queue);
    const targets = this.pubSubTargets[queueKey];
    if (targets) {
      const index = targets.indexOf(groupId);
      if (index > -1) {
        targets.splice(index, 1);
        this.logger.debug(
          `Removed group [${groupId}] from cache for queue [${queueKey}].`,
        );
      }
    }
  }

  // ─── Event handlers ──────────────────────────────────────────────────────
  //
  // Each handler applies its event to the cache, unless the initial load
  // is in progress, in which case the event is buffered and replayed once
  // the load settles.

  protected onConsumerGroupCreated = (queue: IQueueParams, groupId: string) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'consumerGroupCreated' event for group [${groupId}] on queue [${queueKey}]`,
    );

    if (this.initialLoadInProgress) {
      // Queue entry may not exist yet, or may be about to be overwritten by
      // the load's own read for the same queue. Buffer the event; it will
      // be replayed against the final cache state.
      this.bufferedEvents.push({
        type: 'groupCreated',
        queue,
        groupId,
      });
      return;
    }

    // The queue is guaranteed PUB/SUB here: _saveConsumerGroup rejects any
    // other delivery model before publishing this event. The cache entry
    // exists unless the queue was never observed by the load and no
    // queue-created event has arrived since — in which case there is
    // nothing to attach this group to, and dropping is the only sane
    // behavior.
    this.applyGroupCreated(queue, groupId);
  };

  protected onConsumerGroupDeleted = (queue: IQueueParams, groupId: string) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'consumerGroupDeleted' event for group [${groupId}] on queue [${queueKey}]`,
    );

    if (this.initialLoadInProgress) {
      this.bufferedEvents.push({
        type: 'groupDeleted',
        queue,
        groupId,
      });
      return;
    }

    this.applyGroupDeleted(queue, groupId);
  };

  protected onQueueCreated = (
    queue: IQueueParams,
    properties: IQueueProperties,
  ) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(
      `Handling 'queueCreated' event for queue [${queueKey}] with delivery model [${EQueueDeliveryModel[properties.deliveryModel]}]`,
    );

    if (this.initialLoadInProgress) {
      this.bufferedEvents.push({
        type: 'queueCreated',
        queue,
        properties,
      });
      return;
    }

    this.applyQueueCreated(queue, properties);
  };

  protected onQueueDeleted = (queue: IQueueParams) => {
    const queueKey = this.getQueueKey(queue);
    this.logger.debug(`Handling 'queueDeleted' event for queue [${queueKey}]`);

    if (this.initialLoadInProgress) {
      this.bufferedEvents.push({
        type: 'queueDeleted',
        queue,
      });
      return;
    }

    this.applyQueueDeleted(queue);
  };

  // ─── Subscription management ─────────────────────────────────────────────

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
    this.logger.debug('Successfully subscribed to events.');
    cb();
  };

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
    this.logger.debug('Successfully unsubscribed from all events.');
    cb();
  };

  // ─── Initial load ────────────────────────────────────────────────────────

  protected loadAndCacheInitialTargets = (cb: ICallback<void>): void => {
    this.logger.debug('Loading and caching initial PUB/SUB targets...');

    // Set the buffering flag BEFORE any async work begins. Between this
    // line and the drain below, no event can be lost: every queue/group
    // event that fires while the flag is true is appended to
    // `bufferedEvents` and replayed once the load settles.
    this.initialLoadInProgress = true;

    withSharedPoolConnection((redisClient, connCb) => {
      async.waterfall(
        [
          (next: ICallback<IQueueParams[]>) => {
            _getQueues(redisClient, next);
          },
          (queues: IQueueParams[], next: ICallback<void>) => {
            this.logger.debug(`Found [${queues.length}] queues to process.`);
            async.eachOf(
              queues,
              (queue, index, done) => {
                const queueKey = this.getQueueKey(queue);
                this.logger.debug(
                  `Processing queue [${queueKey}] (${index + 1}/${queues.length})`,
                );
                async.waterfall(
                  [
                    (nextQ: ICallback<IQueueProperties>) => {
                      _getQueueProperties(redisClient, queue, nextQ);
                    },
                    (properties: IQueueProperties, nextQ: ICallback<void>) => {
                      if (
                        properties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                      ) {
                        _getConsumerGroups(redisClient, queue, (err, reply) => {
                          if (err) return nextQ(err);
                          const targets = reply ?? [];
                          this.pubSubTargets[queueKey] = targets;
                          this.logger.debug(
                            `Cached [${targets.length}] targets for PUB/SUB queue [${queueKey}].`,
                          );
                          nextQ();
                        });
                      } else {
                        nextQ();
                      }
                    },
                  ],
                  (err) => {
                    if (err) {
                      // Log and continue: a failure to load one queue must
                      // not prevent the producer from starting.
                      this.logger.error(
                        `Error processing queue [${queueKey}]. Skipping.`,
                        err,
                      );
                    }
                    done();
                  },
                );
              },
              () => next(),
            );
          },
        ],
        (err) => {
          // Load complete (success or failure). Clear the flag first so
          // any event fired after this line is applied directly rather
          // than being appended to a buffer that will not be drained.
          this.initialLoadInProgress = false;

          // Drain the buffer. This runs synchronously, so no event can
          // fire between clearing the flag above and finishing the drain.
          this.replayBufferedEvents();

          if (err) {
            this.logger.error(
              'Failed to complete initial target loading.',
              err,
            );
          } else {
            this.logger.debug('Initial target cache is ready.');
          }
          connCb(err);
        },
      );
    }, cb);
  };

  /**
   * Replay every event buffered during the initial load against the cache,
   * in arrival order. Called once by loadAndCacheInitialTargets() after the
   * flag is cleared, and exposed as protected for tests.
   *
   * Must run synchronously after `initialLoadInProgress` is set to false:
   * no event can fire between the two, so nothing can slip past the flag.
   */
  protected replayBufferedEvents(): void {
    const buffered = this.bufferedEvents;
    this.bufferedEvents = [];
    for (const event of buffered) {
      switch (event.type) {
        case 'queueCreated':
          this.applyQueueCreated(event.queue, event.properties);
          break;
        case 'queueDeleted':
          this.applyQueueDeleted(event.queue);
          break;
        case 'groupCreated':
          this.applyGroupCreated(event.queue, event.groupId);
          break;
        case 'groupDeleted':
          this.applyGroupDeleted(event.queue, event.groupId);
          break;
      }
    }
  }

  protected clearCache = (cb: ICallback<void>): void => {
    this.logger.debug('Clearing PUB/SUB target cache...');
    const count = Object.keys(this.pubSubTargets).length;
    this.pubSubTargets = {};
    this.initialLoadInProgress = false;
    this.bufferedEvents = [];
    this.logger.debug(`Cleared [${count}] entries from cache.`);
    cb();
  };

  // ─── Public API ──────────────────────────────────────────────────────────

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
