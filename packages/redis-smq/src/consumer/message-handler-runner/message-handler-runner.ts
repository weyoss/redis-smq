/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, Runnable, Timer } from 'redis-smq-common';
import { IQueueParsedParams } from '../../queue-manager/index.js';
import { MessageHandlerAlreadyExistsError } from '../../errors/index.js';
import { MessageHandler } from '../message-handler/message-handler.js';
import {
  IConsumerMessageHandlerParams,
  TConsumerMessageHandler,
} from '../message-handler/types/index.js';
import { EMessageUnacknowledgementCause } from '../message-handler/consume-message/types/index.js';
import { _deleteEphemeralConsumerGroup } from '../message-handler/_/_delete-ephemeral-consumer-group.js';
import { IConsumerContext } from '../types/consumer-context.js';
import { QueueStateChangeHandler } from './queue-state-change-handler.js';
import { HandlerRegistry } from './handler-registry.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';
import { _generateEphemeralConsumerGroupId } from './_/_generate-ephemeral-consumer-group-id.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { IConsumerQueuesWithStatus } from '../types/index.js';

export type TMessageHandlerRunnerEvent = {
  error: (err: Error, consumerId: string) => void;
};

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific queues.
 * It also includes a supervisor mechanism to automatically restart handlers
 * that fail during runtime.
 *
 * Ownership:
 *   - HandlerRegistry owns the set of registered handler configurations,
 *     the canonical queue-identity function, and each config's ephemeral
 *     consumer group ID (if any). It is a pure read model.
 *   - This runner owns the live MessageHandler instances (in
 *     `messageHandlerInstances`) and all lifecycle decisions about them,
 *     including deletion of ephemeral consumer groups on removal.
 *
 * Stop vs. remove:
 *   - `stopMessageHandler` tears down the handler instance but keeps the
 *     config and the ephemeral group. Used for queue state transitions
 *     (ACTIVE -> PAUSED/STOPPED/LOCKED) so the same handler can restart
 *     when the queue returns to ACTIVE.
 *   - `removeMessageHandler` and `shutDownMessageHandlers` tear down the
 *     instance AND delete its ephemeral group. Used for cancel() and
 *     consumer shutdown, where the config is gone permanently.
 */
export class MessageHandlerRunner extends Runnable<TMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly consumerContext: IConsumerContext;
  protected readonly supervisorTimer: Timer;
  protected readonly queueStateChangeHandler: QueueStateChangeHandler;

  /**
   * Registered handler configurations and the canonical identity function.
   * Replaces the previous `messageHandlers` array and `getQueueIdentifier` /
   * `isSameQueue` methods.
   */
  protected readonly registry: HandlerRegistry;

  protected logger: ILogger;
  protected messageHandlerInstances: MessageHandler[] = [];

  constructor(consumerContext: IConsumerContext) {
    super();
    this.consumerContext = consumerContext;
    this.logger = this.consumerContext.logger.createLogger(
      this.constructor.name,
    );
    this.registry = new HandlerRegistry();
    this.queueStateChangeHandler = new QueueStateChangeHandler(
      this,
      this.logger,
    );
    this.supervisorTimer = new Timer(this.logger);
    this.logger.debug(`MessageHandlerRunner with ID: ${this.id} initialized.`);
  }

  protected isQueueActive(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueActive(queue.queueParams);
  }

  protected isQueueStopped(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueStopped(queue.queueParams);
  }

  protected isQueuePaused(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueuePaused(queue.queueParams);
  }

  protected isQueueLocked(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueLocked(queue.queueParams);
  }

  /**
   * Attach lifecycle listeners to a freshly created handler instance.
   *
   * Both the base runner and the multiplexed runner create handlers; the
   * wiring is identical, so it lives here. Subclasses call this from their
   * own createMessageHandlerInstance().
   *
   * Two events are wired:
   *
   * - 'error': the handler hit a runtime error. Log, then shut it down.
   *   The supervisor will recreate it on the next reconciliation tick
   *   if the queue is still active.
   *
   * - 'shutdownRequired': the handler cannot continue (queue is STOPPED,
   *   LOCKED, or otherwise non-runnable). Remove the instance from
   *   `messageHandlerInstances` so that when the queue returns to ACTIVE,
   *   a fresh handler can be created.
   *
   * Both paths use `shutdownMessageHandler`, not `removeHandlerInstance`:
   * the config stays, so the ephemeral group must survive the restart.
   */
  protected attachHandlerListeners(instance: MessageHandler): void {
    instance.on('error', (err) => {
      this.logger.error(
        `MessageHandler [${instance.getId()}] has experienced a runtime error: ${err.message}. Shutting down instance. The supervisor will attempt to restart it.`,
      );
      this.shutdownMessageHandler(instance, (shutdownErr) => {
        if (shutdownErr) {
          this.logger.error(
            `Failed to shutdown handler ${instance.getId()}: ${shutdownErr.message}`,
          );
        }
      });
    });

    instance.on('shutdownRequired', (cause) => {
      this.logger.debug(
        `MessageHandler [${instance.getId()}] requested shutdown: ${EMessageUnacknowledgementCause[cause]}`,
      );
      this.shutdownMessageHandler(instance, (shutdownErr) => {
        if (shutdownErr) {
          this.logger.error(
            `Failed to shutdown handler ${instance.getId()}: ${shutdownErr.message}`,
          );
        }
      });
    });
  }

  protected scheduleReconciliation = (): void => {
    if (this.isOperational()) {
      this.supervisorTimer.schedule(
        this.reconcileHandlers,
        this.handlerReconciliationInterval,
      );
    }
  };

  protected reconcileHandlers = (): void => {
    if (!this.isOperational()) return;

    // Only count OPERATIONAL instances as "running". A stopped instance
    // that lingers in messageHandlerInstances must not mask a zombie.
    const runningQueues = new Set(
      this.messageHandlerInstances
        .filter((i) => i.isOperational())
        .map((i) => this.registry.getKey(i.getQueue())),
    );

    const zombieHandlers = this.registry
      .list()
      .map((e) => e.params)
      .filter(
        (i) =>
          !runningQueues.has(this.registry.getKey(i.queue)) &&
          this.isQueueActive(i.queue),
      );

    if (zombieHandlers.length > 0) {
      this.logger.warn(
        `Found ${zombieHandlers.length} zombie handler(s). Attempting to restart sequentially...`,
      );
      const tasks = zombieHandlers.map((handlerParams) => {
        return (done: ICallback<void>) => {
          if (!this.getMessageHandler(handlerParams.queue)) {
            this.logger.warn(
              `Handler for queue ${handlerParams.queue.queueParams.name} was removed during reconciliation. Skipping restart.`,
            );
            return done();
          }

          if (!this.isQueueActive(handlerParams.queue)) {
            this.logger.debug(
              `Queue ${handlerParams.queue.queueParams.name} is not active, skipping restart`,
            );
            return done();
          }

          this.logger.debug(
            `Reconciling handler for queue: ${handlerParams.queue.queueParams.name}`,
          );
          this.runMessageHandler(handlerParams, (err) => {
            if (err) {
              this.logger.error(
                `Failed to restart zombie handler for queue ${handlerParams.queue.queueParams.name}.`,
              );
            }
            done();
          });
        };
      });
      async.series(tasks, () => {
        this.logger.debug('Finished reconciliation series for this tick.');
        this.scheduleReconciliation();
      });
    } else {
      this.scheduleReconciliation();
    }
  };

  /**
   * Finds a running message handler instance for the given queue.
   *
   * Note: this returns the instance regardless of whether it is currently
   * operational. Callers that need an operational instance must check
   * `instance.isOperational()` themselves.
   *
   * Uses `registry.matches`, so a lookup with `groupId: null` matches any
   * group on the same (ns, name) — the semantics `consumer.cancel('queue')`
   * relies on. See issue #4.
   */
  protected getMessageHandlerInstance(
    queue: IQueueParsedParams,
  ): MessageHandler | undefined {
    return this.messageHandlerInstances.find((i) =>
      this.registry.matches(i.getQueue(), queue),
    );
  }

  /**
   * Finds the handler configuration for the given queue.
   */
  getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerParams | undefined {
    return this.registry.get(queue)?.params;
  }

  /**
   * Creates and registers a new MessageHandler instance for the given
   * parameters.
   *
   * The handler's constructor no longer takes an ephemeral group ID —
   * the deletion of the group is now the runner's job, driven from the
   * registry entry (see removeHandlerInstance).
   */
  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    const instance = new MessageHandler(
      this.consumerContext,
      handlerParams,
      true,
    );
    this.attachHandlerListeners(instance);
    this.messageHandlerInstances.push(instance);
    return instance;
  }

  /**
   * Starts a message handler for the given parameters.
   *
   * The `_prepareConsumerGroup` call resolves the effective group ID
   * (idempotently) and adopts it into `handlerParams.queue` if it differs.
   * The ephemeral marker, however, is computed once in `addMessageHandler`
   * and stored on the registry entry — this method does not recompute it.
   *
   * Resolution here is redundant with the call in `addMessageHandler` on
   * the initial add, but it is idempotent and preserves the invariant that
   * `runMessageHandler` can be entered from any path (reconciler, state
   * change, initial `goingUp`) without assuming the group was resolved
   * earlier.
   */
  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerParams,
    cb: ICallback,
  ): void {
    if (!this.isQueueActive(handlerParams.queue)) {
      this.logger.debug(
        `Queue ${handlerParams.queue.queueParams.name} is not active, skipping start`,
      );
      return cb();
    }

    const existing = this.getMessageHandlerInstance(handlerParams.queue);
    if (existing && existing.isOperational()) {
      this.logger.warn(
        `A message handler instance for queue ${handlerParams.queue.queueParams.name} is already running.`,
      );
      return cb();
    }

    _prepareConsumerGroup(
      handlerParams.queue,
      this.consumerContext.consumerId,
      (err, effectiveGroupId) => {
        if (err) {
          this.logger.error(
            `Failed to prepare consumer group for queue ${handlerParams.queue.queueParams.name}: ${err.message}`,
          );
          return cb(err);
        }

        // Adopt the resolved group ID into the config entry. This is the
        // single place the config's queue is mutated; the registry stores
        // the same object, so the mutation is visible to every lookup.
        if (
          effectiveGroupId &&
          handlerParams.queue.groupId !== effectiveGroupId
        ) {
          handlerParams.queue = {
            ...handlerParams.queue,
            groupId: effectiveGroupId,
          };
        }

        const handler = this.createMessageHandlerInstance(handlerParams);
        handler.run((runErr) => {
          if (runErr) {
            this.logger.error(
              `Failed to run message handler for queue ${handlerParams.queue.queueParams.name}. Removing configuration.`,
              runErr,
            );
            this.removeMessageHandler(handlerParams.queue, () => cb(runErr));
          } else {
            cb();
          }
        });
      },
      this.logger,
    );
  }

  /**
   * Shuts down a message handler and removes it from the instance list.
   *
   * This is the low-level primitive. It does NOT delete the ephemeral
   * group — that is the caller's responsibility. Use this for stops
   * (queue state change), where the config survives. Use
   * `removeHandlerInstance` for removals (cancel, shutdown), where the
   * config is gone.
   */
  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback,
  ): void {
    messageHandler.shutdown(() => {
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => handler.getId() !== messageHandler.getId(),
      );
      cb();
    });
  }

  /**
   * Fully remove a running handler instance.
   *
   * Shuts the handler down (which runs `_unsubscribeConsumer` inside its
   * `goingDown`) and, if the handler's registry entry carried an ephemeral
   * consumer group ID, deletes that group.
   *
   * Ordering matters. The delete script refuses to act while the group
   * still has members (`SCARD keyQueueConsumerGroupConsumers > 0`). The
   * `SREM` that removes this consumer from the group's member set is
   * issued by `_unsubscribeConsumer`, which runs inside the handler's
   * `goingDown`. Only after shutdown completes can the delete succeed.
   * Running the delete before the unsubscribe — as the pre-Step-3 handler
   * did — always failed with `CONSUMER_GROUP_HAS_ACTIVE_CONSUMERS` and
   * leaked the group (see issue #5).
   *
   * The `ephemeralGroupId` is passed as an argument rather than looked up
   * from the registry, because callers may have already removed the entry
   * from the registry before invoking this method (see removeMessageHandler).
   * Capturing it as a value preserves it across the removal.
   */
  protected removeHandlerInstance(
    messageHandler: MessageHandler,
    ephemeralGroupId: string | null,
    cb: ICallback,
  ): void {
    this.shutdownMessageHandler(messageHandler, (err) => {
      if (err) return cb(err);

      if (!ephemeralGroupId) return cb();

      _deleteEphemeralConsumerGroup(
        messageHandler.getQueue().queueParams,
        this.consumerContext.consumerId,
        ephemeralGroupId,
        (delErr) => {
          if (delErr) {
            this.logger.warn(
              `Failed to delete ephemeral consumer group '${ephemeralGroupId}': ${delErr.message}`,
            );
          }
          cb();
        },
      );
    });
  }

  protected runMessageHandlers = (cb: ICallback): void => {
    const handlersToStart = this.registry
      .list()
      .map((e) => e.params)
      .filter((handler) => this.isQueueActive(handler.queue));

    async.each(
      handlersToStart,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  /**
   * Shuts down all running message handlers and deletes their ephemeral
   * groups.
   *
   * This runs during consumer shutdown, when the whole consumer is going
   * away. Every handler is being removed permanently, so this path uses
   * `removeHandlerInstance` rather than `shutdownMessageHandler`.
   *
   * Registry entries are still present at this point, so the ephemeral
   * group ID is read from the entry for each instance.
   */
  protected shutDownMessageHandlers = (cb: ICallback): void => {
    async.each(
      this.messageHandlerInstances,
      (handler, _, done) => {
        const entry = this.registry.get(handler.getQueue());
        const ephemeralGroupId = entry?.ephemeralGroupId ?? null;
        this.removeHandlerInstance(handler, ephemeralGroupId, done);
      },
      () => {
        this.messageHandlerInstances = [];
        cb();
      },
    );
  };

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => this.supervisorTimer.run(cb),
      this.runMessageHandlers,
      (cb: ICallback) => {
        this.reconcileHandlers();
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => this.supervisorTimer.shutdown(cb),
      this.queueStateChangeHandler.shutdown,
      this.shutDownMessageHandlers,
    ].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.logger.error(`MessageHandlerRunner error: ${err.message}`, err);
    this.emit('error', err, this.consumerContext.consumerId);
    super.handleError(err);
  }

  /**
   * Stops a message handler (keeps configuration and ephemeral group).
   *
   * Used when a queue transitions to PAUSED/STOPPED/LOCKED. The config
   * stays in the registry and the ephemeral group stays in Redis so that
   * `startMessageHandler` can resume with the same identity.
   */
  stopMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    const handlerInstance = this.getMessageHandlerInstance(queue);

    if (!handlerInstance) {
      const hasConfig = this.registry.has(queue);
      this.logger.debug(
        `Stop requested for queue: ${queue.queueParams.name} (no instance)`,
      );
      return cb(null, hasConfig);
    }

    this.shutdownMessageHandler(handlerInstance, (err) => {
      if (err) {
        this.logger.error(
          `Failed to stop handler for queue ${queue.queueParams.name}:`,
          err,
        );
        cb(err);
      } else {
        this.logger.debug(
          `Stopped message handler for queue: ${queue.queueParams.name} (configuration kept)`,
        );
        cb(null, true);
      }
    });
  }

  /**
   * Starts a message handler.
   *
   * Used when a queue transitions from STOPPED/PAUSED/LOCKED back to
   * ACTIVE. The config (and ephemeral group) survived the earlier stop,
   * so this only needs to construct and run a fresh instance.
   */
  startMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    const handlerConfig = this.getMessageHandler(queue);
    if (!handlerConfig) {
      this.logger.warn(
        `No handler configuration found for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    const existing = this.getMessageHandlerInstance(queue);
    if (existing && existing.isOperational()) {
      this.logger.debug(
        `Handler already running for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    if (existing) {
      this.logger.debug(
        `Removing stale non-operational handler instance for queue: ${queue.queueParams.name}`,
      );
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (i) => i.getId() !== existing.getId(),
      );
    }

    if (!this.isQueueActive(queue)) {
      this.logger.debug(
        `Queue ${queue.queueParams.name} is not active, cannot start handler`,
      );
      return cb(null, false);
    }

    this.runMessageHandler(handlerConfig, (err) => {
      if (err) {
        this.logger.error(
          `Failed to start handler for queue ${queue.queueParams.name}:`,
          err,
        );
        cb(err);
      } else {
        this.logger.debug(
          `Started message handler for queue: ${queue.queueParams.name}`,
        );
        cb(null, true);
      }
    });
  }

  /**
   * Removes a message handler completely.
   *
   * Used by `consumer.cancel()`. The config is gone permanently, so the
   * ephemeral group is deleted. The group ID is captured from the registry
   * BEFORE the entry is removed, because `removeHandlerInstance` receives
   * it as an argument and cannot look it up once removal has happened.
   */
  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback): void {
    // Capture the entry (including its ephemeral group ID) before removal.
    const entry = this.registry.get(queue);
    const ephemeralGroupId = entry?.ephemeralGroupId ?? null;

    const removed = this.registry.remove(queue);
    const handlerInstance = this.getMessageHandlerInstance(queue);

    if (handlerInstance) {
      this.removeHandlerInstance(handlerInstance, ephemeralGroupId, cb);
    } else {
      if (removed) {
        this.logger.debug(
          `Removed handler configuration for queue: ${queue.queueParams.name}`,
        );
      }
      cb();
    }
  }

  /**
   * Adds a message handler for a queue. If already exists, returns an
   * error. If the runner is running and the queue is active, starts the
   * handler immediately.
   *
   * Resolution of the consumer group happens here, BEFORE registry.add,
   * so the entry stored in the registry is fully resolved. The ephemeral
   * marker is computed once here and stored on the entry — it is not
   * recomputed on subsequent restarts.
   */
  addMessageHandler(
    queue: IQueueParsedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    if (this.registry.has(queue)) {
      this.logger.warn(
        `Message handler for queue ${queue.queueParams.name} already exists`,
      );
      return cb(new MessageHandlerAlreadyExistsError());
    }

    const handlerParams: IConsumerMessageHandlerParams = {
      queue,
      messageHandler,
    };

    async.series(
      [
        (cb) =>
          withSharedPoolConnection((client, cb) => {
            _validateOperation(
              client,
              queue.queueParams,
              EQueueOperation.CONSUME,
              cb,
            );
          }, cb),
        (cb) => {
          _prepareConsumerGroup(
            queue,
            this.consumerContext.consumerId,
            (err, effectiveGroupId) => {
              if (err) return cb(err);

              // Adopt the resolved group ID into the config entry.
              if (
                effectiveGroupId &&
                handlerParams.queue.groupId !== effectiveGroupId
              ) {
                handlerParams.queue = {
                  ...handlerParams.queue,
                  groupId: effectiveGroupId,
                };
              }

              // Compute the ephemeral marker once, at registration time.
              // The pattern match is reliable across restarts: the
              // generator is deterministic per consumer, so a stored
              // config that already carries an ephemeral ID still matches.
              const ephemeralGroupId =
                effectiveGroupId &&
                effectiveGroupId ===
                  _generateEphemeralConsumerGroupId(
                    this.consumerContext.consumerId,
                  )
                  ? effectiveGroupId
                  : null;

              this.registry.add(handlerParams, ephemeralGroupId);
              this.logger.debug(
                `Message handler registered for queue: ${handlerParams.queue.queueParams.name}. Total handlers: ${this.registry.size}`,
              );

              if (
                this.isOperational() &&
                this.isQueueActive(handlerParams.queue)
              ) {
                this.runMessageHandler(handlerParams, cb);
              } else {
                cb();
              }
            },
            this.logger,
          );
        },
      ],
      (err) => cb(err),
    );
  }

  getQueueWithStatus(): IConsumerQueuesWithStatus[] {
    const queues = this.getQueues();
    return queues.map((queue: IQueueParsedParams) => {
      const instance = this.getMessageHandlerInstance(queue);
      const status: IConsumerQueuesWithStatus['status'] =
        instance && instance.isRunning() ? 'active' : 'stopped';
      return { queue, status };
    });
  }

  getQueues(): IQueueParsedParams[] {
    return this.registry.list().map((e) => e.params.queue);
  }

  getActiveQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueActive(e.params.queue))
      .map((e) => e.params.queue);
  }

  getStoppedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueStopped(e.params.queue))
      .map((e) => e.params.queue);
  }

  getPausedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueuePaused(e.params.queue))
      .map((e) => e.params.queue);
  }

  getLockedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueLocked(e.params.queue))
      .map((e) => e.params.queue);
  }

  isMessageHandlerStopped(queue: IQueueParsedParams): boolean {
    return this.isQueueStopped(queue);
  }

  isMessageHandlerRunning(queue: IQueueParsedParams): boolean {
    const instance = this.getMessageHandlerInstance(queue);
    return !!instance && instance.isOperational();
  }

  getHandlerCount(): {
    total: number;
    active: number;
    stopped: number;
    paused: number;
    locked: number;
  } {
    const total = this.registry.size;
    const active = this.getActiveQueues().length;
    const stopped = this.getStoppedQueues().length;
    const paused = this.getPausedQueues().length;
    const locked = this.getLockedQueues().length;

    const accountedFor = active + stopped + paused + locked;
    if (accountedFor !== total) {
      this.logger.warn(
        `Queue state accounting mismatch: total=${total}, accounted=${accountedFor}`,
      );
    }

    return { total, active, stopped, paused, locked };
  }
}
