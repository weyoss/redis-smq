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
import { IConsumerContext } from '../types/consumer-context.js';
import { QueueStateChangeHandler } from './queue-state-change-handler.js';
import { HandlerRegistry } from './handler-registry.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { IConsumerQueuesWithStatus } from '../types/index.js';
import { _generateEphemeralConsumerGroupId } from './_/_generate-ephemeral-consumer-group-id.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';

export type TMessageHandlerRunnerEvent = {
  error: (err: Error, consumerId: string) => void;
};

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific queues.
 * It also includes a supervisor mechanism to automatically restart handlers
 * that fail during runtime.
 */
export class MessageHandlerRunner extends Runnable<TMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly consumerContext: IConsumerContext;
  protected readonly supervisorTimer: Timer;
  protected readonly queueStateChangeHandler: QueueStateChangeHandler;

  /**
   * Registered handler configurations and the canonical identity function
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

  /**
   * Checks if a queue is active (not stopped, paused, or locked).
   */
  protected isQueueActive(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueActive(queue.queueParams);
  }

  /**
   * Checks if a queue is stopped.
   */
  protected isQueueStopped(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueStopped(queue.queueParams);
  }

  /**
   * Checks if a queue is paused.
   */
  protected isQueuePaused(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueuePaused(queue.queueParams);
  }

  /**
   * Checks if a queue is locked.
   */
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
   * `shutdownMessageHandler` is dynamically dispatched, so the multiplexed
   * override (which also clears `activeMessageHandler` and schedules the
   * next tick) still runs.
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

  /**
   * Schedules the next reconciliation check.
   */
  protected scheduleReconciliation = (): void => {
    if (this.isOperational()) {
      this.supervisorTimer.schedule(
        this.reconcileHandlers,
        this.handlerReconciliationInterval,
      );
    }
  };

  /**
   * The supervisor loop. Periodically checks for configurations that do not
   * have a running instance and attempts to restart them sequentially.
   */
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
          // Re-validate state at the last moment to prevent a race condition
          // where a handler is removed while reconciliation is in progress.
          if (!this.getMessageHandler(handlerParams.queue)) {
            this.logger.warn(
              `Handler for queue ${handlerParams.queue.queueParams.name} was removed during reconciliation. Skipping restart.`,
            );
            return done();
          }

          // Double-check queue state before starting
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
            // We call done() without an error to allow the series to continue with the next handler.
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
   * Creates and registers a new MessageHandler instance for the given parameters.
   */
  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
    ephemeralGroupId: string | null,
  ): MessageHandler {
    const instance = new MessageHandler(
      this.consumerContext,
      handlerParams,
      ephemeralGroupId,
      true,
    );
    this.attachHandlerListeners(instance);
    this.messageHandlerInstances.push(instance);
    return instance;
  }

  /**
   * Starts a message handler for the given parameters.
   *
   * After the handler has finished its goingUp() sequence, the config entry
   * is synced with the handler's effective queue. For PUB/SUB queues without
   * an explicit consumer group, the handler generates an ephemeral group ID
   * during _prepareConsumerGroup() and mutates its own queue to include it.
   * Without this sync, the config would still carry `groupId: null`, and every
   * subsequent lookup that compares a config-sourced queue against the running
   * instance's identifier would fail:
   *
   *   - stopMessageHandler (queue -> STOPPED/PAUSED/LOCKED transitions)
   *   - removeMessageHandler (consumer.cancel())
   *   - startMessageHandler (queue -> ACTIVE transitions)
   *   - reconcileHandlers (the supervisor's zombie scan)
   *
   * The handlerParams object is the same reference that the registry stores,
   * so mutating `handlerParams.queue` propagates to the registry.
   */
  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerParams,
    cb: ICallback,
  ): void {
    // Check queue state before starting
    if (!this.isQueueActive(handlerParams.queue)) {
      this.logger.debug(
        `Queue ${handlerParams.queue.queueParams.name} is not active, skipping start`,
      );
      return cb();
    }

    // Avoid creating a duplicate instance if an OPERATIONAL one exists.
    const existing = this.getMessageHandlerInstance(handlerParams.queue);
    if (existing && existing.isOperational()) {
      this.logger.warn(
        `A message handler instance for queue ${handlerParams.queue.queueParams.name} is already running.`,
      );
      return cb();
    }

    // Resolve the effective consumer group ID. This is idempotent: for
    // POINT_TO_POINT queues it returns undefined, for PUB/SUB queues with
    // an explicit group it re-saves that group, and for PUB/SUB queues
    // without a group it generates and saves an ephemeral one.
    //
    // The re-save matters on restart: MessageHandler.goingDown currently
    // deletes the ephemeral group on every shutdown, so a restart must
    // recreate it before _subscribeConsumer runs (otherwise publish-time
    // SISMEMBER checks would fail with CONSUMER_GROUP_NOT_FOUND). Step 3
    // will move the deletion to removeMessageHandler and this comment
    // becomes obsolete.
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

        // Determine whether the effective group is ephemeral. The
        // generator is deterministic per consumer, so a pattern match
        // is the reliable signal — checking "did the ID change?" would
        // fail on restarts, when the config already carries the
        // ephemeral ID.
        const ephemeralGroupId =
          effectiveGroupId &&
          effectiveGroupId ===
            _generateEphemeralConsumerGroupId(this.consumerContext.consumerId)
            ? effectiveGroupId
            : null;

        const handler = this.createMessageHandlerInstance(
          handlerParams,
          ephemeralGroupId,
        );
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
   * Starts all registered message handlers.
   */
  protected runMessageHandlers = (cb: ICallback): void => {
    // Filter to only active queues
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
   * Shuts down all running message handlers.
   */
  protected shutDownMessageHandlers = (cb: ICallback): void => {
    async.each(
      this.messageHandlerInstances,
      (handler, _, done) => {
        this.shutdownMessageHandler(handler, done);
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
   * Stops a message handler (keeps configuration).
   * Used when queue state changes to STOPPED/PAUSED/LOCKED.
   */
  stopMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    const handlerInstance = this.getMessageHandlerInstance(queue);

    if (!handlerInstance) {
      // No instance running, but configuration exists
      const hasConfig = this.registry.has(queue);
      this.logger.debug(
        `Stop requested for queue: ${queue.queueParams.name} (no instance)`,
      );
      return cb(null, hasConfig);
    }

    // Stop the running instance
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
   * Used when queue state changes from STOPPED/PAUSED/LOCKED to ACTIVE.
   */
  startMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    // Check if configuration exists
    const handlerConfig = this.getMessageHandler(queue);
    if (!handlerConfig) {
      this.logger.warn(
        `No handler configuration found for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    // Check if an OPERATIONAL instance is already running. A stopped
    // instance that has not yet been cleaned up must not block restart.
    const existing = this.getMessageHandlerInstance(queue);
    if (existing && existing.isOperational()) {
      this.logger.debug(
        `Handler already running for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    // If a stopped instance is lingering, remove it before creating a
    // fresh one. This should not normally happen (attachHandlerListeners
    // removes instances on shutdownRequired), but it is a cheap safety
    // net against future lifecycle races.
    if (existing) {
      this.logger.debug(
        `Removing stale non-operational handler instance for queue: ${queue.queueParams.name}`,
      );
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (i) => i.getId() !== existing.getId(),
      );
    }

    // Check queue state before starting
    if (!this.isQueueActive(queue)) {
      this.logger.debug(
        `Queue ${queue.queueParams.name} is not active, cannot start handler`,
      );
      return cb(null, false);
    }

    // Start the handler
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
   */
  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback): void {
    // Remove configuration
    const removed = this.registry.remove(queue);
    const handlerInstance = this.getMessageHandlerInstance(queue);
    if (handlerInstance) {
      this.shutdownMessageHandler(handlerInstance, cb);
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
   * Adds a message handler for a queue. If already exists, returns an error.
   * If runner is running, starts the handler immediately.
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
          // Resolve the consumer group BEFORE registering the config, so
          // the registry stores a fully-resolved queue. This is what lets
          // runMessageHandler drop its post-run config sync.
          _prepareConsumerGroup(
            queue,
            this.consumerContext.consumerId,
            (err, effectiveGroupId) => {
              if (err) return cb(err);

              if (
                effectiveGroupId &&
                handlerParams.queue.groupId !== effectiveGroupId
              ) {
                handlerParams.queue = {
                  ...handlerParams.queue,
                  groupId: effectiveGroupId,
                };
              }

              this.registry.add(handlerParams);
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

  /**
   * Returns all queues with handler configurations and consumption status.
   */
  getQueueWithStatus(): IConsumerQueuesWithStatus[] {
    const queues = this.getQueues();
    return queues.map((queue: IQueueParsedParams) => {
      const instance = this.getMessageHandlerInstance(queue);
      const status: IConsumerQueuesWithStatus['status'] =
        instance && instance.isRunning() ? 'active' : 'stopped';
      return {
        queue,
        status,
      };
    });
  }

  /**
   * Returns all queues with handler configurations.
   */
  getQueues(): IQueueParsedParams[] {
    return this.registry.list().map((e) => e.params.queue);
  }

  /**
   * Returns only active queues.
   */
  getActiveQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueActive(e.params.queue))
      .map((e) => e.params.queue);
  }

  /**
   * Returns only stopped queues.
   */
  getStoppedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueStopped(e.params.queue))
      .map((e) => e.params.queue);
  }

  /**
   * Returns only paused queues.
   */
  getPausedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueuePaused(e.params.queue))
      .map((e) => e.params.queue);
  }

  /**
   * Returns only locked queues.
   */
  getLockedQueues(): IQueueParsedParams[] {
    return this.registry
      .list()
      .filter((e) => this.isQueueLocked(e.params.queue))
      .map((e) => e.params.queue);
  }

  /**
   * Checks if a handler is stopped.
   */
  isMessageHandlerStopped(queue: IQueueParsedParams): boolean {
    return this.isQueueStopped(queue);
  }

  /**
   * Checks if a handler is running.
   */
  isMessageHandlerRunning(queue: IQueueParsedParams): boolean {
    const instance = this.getMessageHandlerInstance(queue);
    return !!instance && instance.isOperational();
  }

  /**
   * Gets the number of registered handlers.
   */
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

    // Optional validation
    const accountedFor = active + stopped + paused + locked;
    if (accountedFor !== total) {
      this.logger.warn(
        `Queue state accounting mismatch: total=${total}, accounted=${accountedFor}`,
      );
    }

    return { total, active, stopped, paused, locked };
  }
}
