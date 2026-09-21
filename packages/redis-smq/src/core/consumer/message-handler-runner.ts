/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, Runnable, Timer } from 'redis-smq-common';
import { MessageHandlerAlreadyExistsError } from '../errors/index.js';
import { MessageHandler } from './message-handler.js';
import { _deleteEphemeralConsumerGroup } from './_/_delete-ephemeral-consumer-group.js';
import { IConsumerContext } from './types/consumer-context.js';
import { HandlerRegistry } from './handler-registry.js';
import { MultiplexingController } from './multiplexing-controller.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';
import { _generateEphemeralConsumerGroupId } from './_/_generate-ephemeral-consumer-group-id.js';
import { _validateOperation } from '../queue-operation-validator/_/_validate-operation.js';
import { withShared } from '../common/redis/connection-pool/with-shared.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';
import { messageHandlerEventPublisher } from './message-handler-event-publisher.js';
import {
  EMessageUnacknowledgementCause,
  EQueueOperation,
  EQueueOperationalState,
  IConsumerMessageHandlerParams,
  IConsumerQueuesWithStatus,
  IQueueParams,
  IQueueParsedParams,
  IQueueStateTransition,
  TConsumerMessageHandler,
} from '../../contracts/index.js';

export type TMessageHandlerRunnerEvent = {
  error: (err: Error, consumerId: string) => void;
};

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific
 * queues. It also includes a supervisor mechanism to automatically restart
 * handlers that fail during runtime.
 *
 * Ownership:
 *   - HandlerRegistry owns the set of registered handler configurations,
 *     the canonical queue-identity function, and each config's ephemeral
 *     consumer group ID (if any). It is a pure read model.
 *   - This runner owns the live MessageHandler instances, all lifecycle
 *     decisions about them, and a local mirror of each queue's operational
 *     state (populated from InternalEventBus).
 *   - In multiplexed mode, a MultiplexingController owns the round-robin
 *     scheduling policy. The runner creates handlers with options that
 *     defer their dequeue loop to the controller.
 *
 * Stop vs. remove:
 *   - `stopMessageHandler` tears down the handler instance but keeps the
 *     config and the ephemeral group. Used for queue state transitions
 *     (ACTIVE -> PAUSED/STOPPED/LOCKED) so the same handler can restart
 *     when the queue returns to ACTIVE.
 *   - `removeMessageHandler` and `shutDownMessageHandlers` tear down the
 *     instance AND delete its ephemeral group. Used for cancel() and
 *     consumer shutdown, where the config is gone permanently.
 *
 * Queue state:
 *   The runner subscribes to `queue.stateChanged` in its constructor and
 *   maintains a `queueStates` map keyed by `ns:name`. The map only holds
 *   entries for queues whose state has changed since the runner started;
 *   `getQueueState` defaults to ACTIVE for any queue without an entry.
 *   The default is correct because a handler can only be registered after
 *   `_validateOperation(CONSUME)` has confirmed the queue is ACTIVE in
 *   Redis.
 *
 * Scheduling mode:
 *   - Non-multiplexed (default): each handler owns its dequeue loop,
 *     blocking on BRPOPLPUSH with an exclusive connection.
 *   - Multiplexed (`enableMultiplexing: true`): a single
 *     MultiplexingController runs a 1s round-robin tick, calling
 *     `dequeue()` on one handler per tick. Handlers use non-blocking
 *     RPOPLPUSH on a shared connection and yield control back to the
 *     controller after each message.
 */
export class MessageHandlerRunner extends Runnable<TMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly multiplexingTickIntervalMs = 1000; // todo: make it configurable: config.consumer.multiplexingTickIntervalMs
  protected readonly consumerContext: IConsumerContext;
  protected readonly supervisorTimer: Timer;

  /**
   * Registered handler configurations and the canonical identity function.
   */
  protected readonly registry: HandlerRegistry;

  /**
   * Round-robin tick loop used when the consumer is configured with
   * `enableMultiplexing: true`. Null otherwise, in which case each handler
   * runs its own dequeue loop.
   */
  protected multiplexingController: MultiplexingController | null = null;

  /**
   * Current operational state of each queue this runner has heard about.
   *
   * Keyed by `ns:name` — state is a property of the queue, shared across
   * every consumer group. A queue that has never had a state change since
   * the runner started has no entry, and `getQueueState` returns ACTIVE.
   */
  protected readonly queueStates = new Map<string, EQueueOperationalState>();

  protected logger: ILogger;
  protected messageHandlerInstances: MessageHandler[] = [];

  constructor(consumerContext: IConsumerContext) {
    super();
    this.consumerContext = consumerContext;
    this.logger = this.consumerContext.logger.createLogger(
      this.constructor.name,
    );
    this.registry = new HandlerRegistry();
    this.supervisorTimer = new Timer(this.logger);

    // In multiplexed mode, construct the round-robin controller. It needs
    // only two things from the runner: the current handler list, and a
    // predicate for whether a handler's queue is currently ACTIVE.
    if (consumerContext.consumerOptions.enableMultiplexing) {
      this.multiplexingController = new MultiplexingController(
        this.logger,
        this.multiplexingTickIntervalMs,
        () => this.messageHandlerInstances,
        (handler) => this.isQueueActive(handler.getQueue()),
      );
    }

    // Subscribe before goingUp, so state-change events that fire between
    // construction and run() are not missed. A consumer.consume() call
    // issued before run() registers a config that will be started on
    // goingUp; if the queue's state changed in the interim, this
    // subscription is what records that transition.
    InternalEventBus.getInstance().on(
      'queue.stateChanged',
      this.onQueueStateChanged,
    );

    this.logger.debug(
      `MessageHandlerRunner with ID: ${this.id} initialized${
        this.multiplexingController ? ' (multiplexing enabled)' : ''
      }.`,
    );
  }

  /**
   * Key for the queue-state map. State is a property of the queue, not of
   * any consumer group, so the map is keyed by `ns:name`.
   */
  protected getQueueStateKey(queueParams: IQueueParams): string {
    return `${queueParams.ns}:${queueParams.name}`;
  }

  /**
   * Read the current operational state of a queue. Defaults to ACTIVE for
   * any queue without a recorded transition.
   */
  protected getQueueState(queueParams: IQueueParams): EQueueOperationalState {
    return (
      this.queueStates.get(this.getQueueStateKey(queueParams)) ??
      EQueueOperationalState.ACTIVE
    );
  }

  protected isQueueActive(queue: IQueueParsedParams): boolean {
    return (
      this.getQueueState(queue.queueParams) === EQueueOperationalState.ACTIVE
    );
  }

  protected isQueueStopped(queue: IQueueParsedParams): boolean {
    return (
      this.getQueueState(queue.queueParams) === EQueueOperationalState.STOPPED
    );
  }

  protected isQueuePaused(queue: IQueueParsedParams): boolean {
    return (
      this.getQueueState(queue.queueParams) === EQueueOperationalState.PAUSED
    );
  }

  protected isQueueLocked(queue: IQueueParsedParams): boolean {
    return (
      this.getQueueState(queue.queueParams) === EQueueOperationalState.LOCKED
    );
  }

  /**
   * Handle a queue state transition from InternalEventBus.
   *
   * Records the transition, then starts or stops every registered handler
   * for that queue. The action depends on the transition target:
   *
   *   - PAUSED / STOPPED / LOCKED  -> stop every handler on the queue
   *   - ACTIVE                     -> start every handler on the queue
   *
   * Runs synchronously; the start/stop calls are fire-and-forget, with
   * their own per-handler error logging.
   */
  protected onQueueStateChanged = (
    queue: IQueueParams,
    transition: IQueueStateTransition,
  ): void => {
    const queueKey = this.getQueueStateKey(queue);
    this.logger.info(
      `Queue state changed: ${queueKey} from ${transition.from} to ${transition.to}`,
    );

    this.queueStates.set(queueKey, transition.to);

    // A queue's state is shared across its consumer groups, so every
    // registered config for this (ns, name) reacts to the same transition.
    const configs = this.registry
      .list()
      .map((e) => e.params.queue)
      .filter(
        (q) =>
          q.queueParams.ns === queue.ns && q.queueParams.name === queue.name,
      );

    if (configs.length === 0) {
      this.logger.debug(
        `No registered handlers for queue ${queueKey}; transition recorded only.`,
      );
      return;
    }

    switch (transition.to) {
      case EQueueOperationalState.STOPPED:
      case EQueueOperationalState.PAUSED:
      case EQueueOperationalState.LOCKED:
        this.stopHandlersForConfigs(configs, transition.to);
        break;

      case EQueueOperationalState.ACTIVE:
        this.startHandlersForConfigs(configs);
        break;
    }
  };

  /**
   * Stop every handler in `configs`, logging per handler.
   */
  protected stopHandlersForConfigs(
    configs: readonly IQueueParsedParams[],
    state: EQueueOperationalState,
  ): void {
    const stateName = EQueueOperationalState[state].toLowerCase();
    configs.forEach((queueParsed) => {
      this.stopMessageHandler(queueParsed, (err, wasRunning) => {
        if (err) {
          this.logger.error(
            `Failed to ${stateName} message handler for queue ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}):`,
            err,
          );
        } else if (wasRunning) {
          this.logger.debug(
            `Message handler ${stateName} for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
          );
        }
      });
    });
  }

  /**
   * Start every handler in `configs`, logging per handler.
   */
  protected startHandlersForConfigs(
    configs: readonly IQueueParsedParams[],
  ): void {
    configs.forEach((queueParsed) => {
      if (this.isMessageHandlerRunning(queueParsed)) {
        this.logger.debug(
          `Message handler already running for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
        );
        return;
      }

      if (!this.getMessageHandler(queueParsed)) {
        this.logger.debug(
          `No handler configuration found for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}), skipping`,
        );
        return;
      }

      this.startMessageHandler(queueParsed, (err, wasStarted) => {
        if (err) {
          this.logger.error(
            `Failed to start message handler for queue ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'}):`,
            err,
          );
        } else if (wasStarted) {
          this.logger.debug(
            `Message handler started for queue: ${queueParsed.queueParams.name} (group: ${queueParsed.groupId || 'default'})`,
          );
        }
      });
    });
  }

  /**
   * Attach lifecycle listeners to a freshly created handler instance.
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
   * The options passed to the handler depend on the scheduling mode:
   *   - Non-multiplexed: the handler self-starts, blocks on the queue, and
   *     loops on itself.
   *   - Multiplexed: the handler defers to the controller. It does not
   *     self-start, uses non-blocking dequeue on a shared connection, and
   *     yields to the controller after each message via `nextFn`.
   */
  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    const controller = this.multiplexingController;

    const options = controller
      ? {
          autoDequeue: false,
          blockUntilMessageReceived: false,
          nextFn: (): void => controller.scheduleNextTick(),
        }
      : {
          autoDequeue: true,
          blockUntilMessageReceived: true,
          nextFn: null,
        };

    const instance = new MessageHandler(
      this.consumerContext,
      handlerParams,
      options,
    );

    // Runner-level listeners: 'error' and 'shutdownRequired' drive the
    // handler's lifecycle.
    this.attachHandlerListeners(instance);

    // Event-bus listeners: the five message-outcome events are forwarded to
    // the public EventMultiplexer. This is what makes the events observable
    // to application code (and to tests that listen on the bus).
    messageHandlerEventPublisher(instance);

    this.messageHandlerInstances.push(instance);
    return instance;
  }

  /**
   * Starts a message handler for the given parameters.
   *
   * The queue in `handlerParams` is expected to be fully resolved — this
   * method does not call `_prepareConsumerGroup`. Resolution happens once,
   * in `addMessageHandler`, before the config is stored in the registry.
   * Every caller of this method reads from the registry, so every
   * `handlerParams` here has already been resolved.
   *
   * If a future code path introduces a caller that has not resolved its
   * queue, that caller must call `_prepareConsumerGroup` first — otherwise
   * the handler subscribes under `groupId: null` and PUB/SUB fan-out to
   * the ephemeral group fails.
   *
   * On handler startup failure, the configuration is removed via
   * `removeMessageHandler`, which also deletes the ephemeral group.
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
  }

  /**
   * Shuts down a message handler and removes it from the instance list.
   *
   * This is the low-level primitive. It does NOT delete the ephemeral
   * group — that is the caller's responsibility. Use this for stops
   * (queue state change), where the config survives. Use
   * `removeHandlerInstance` for removals (cancel, shutdown), where the
   * config is gone.
   *
   * In multiplexed mode, the controller is notified so it can drop its
   * reference to the handler if it was the active one, and pick the next
   * operational handler on the next tick.
   */
  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback,
  ): void {
    messageHandler.shutdown(() => {
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => handler.getId() !== messageHandler.getId(),
      );
      this.multiplexingController?.onHandlerStopped(messageHandler);
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
   * See issue #5.
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
      (cb: ICallback) => {
        if (!this.multiplexingController) return cb();
        this.multiplexingController.run(cb);
      },
      (cb: ICallback) => {
        if (!this.multiplexingController) return cb();
        // Kick off the first tick. Subsequent ticks are scheduled by the
        // controller itself, via the `nextFn` the handlers call after
        // each message.
        this.multiplexingController.execNextTick();
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => this.supervisorTimer.shutdown(cb),
      (cb: ICallback) => {
        if (!this.multiplexingController) return cb();
        this.multiplexingController.shutdown(cb);
      },
      (cb: ICallback) => {
        // Unsubscribe before tearing down handlers, so a state-change
        // event arriving mid-shutdown cannot start a new handler.
        InternalEventBus.getInstance().removeListener(
          'queue.stateChanged',
          this.onQueueStateChanged,
        );
        this.queueStates.clear();
        cb();
      },
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
          withShared((client, cb) => {
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

    const accountedFor = active + stopped + paused + locked;
    if (accountedFor !== total) {
      this.logger.warn(
        `Queue state accounting mismatch: total=${total}, accounted=${accountedFor}`,
      );
    }

    return { total, active, stopped, paused, locked };
  }
}
