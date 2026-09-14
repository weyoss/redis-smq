/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, Runnable, Timer } from 'redis-smq-common';
import {
  EQueueOperationalState,
  IQueueParams,
  IQueueParsedParams,
} from '../../queue-manager/index.js';
import { MessageHandlerAlreadyExistsError } from '../../errors/index.js';
import { MessageHandler } from '../message-handler/message-handler.js';
import {
  IConsumerMessageHandlerParams,
  TConsumerMessageHandler,
} from '../message-handler/types/index.js';
import { EMessageUnacknowledgementCause } from '../message-handler/consume-message/types/index.js';
import { _deleteEphemeralConsumerGroup } from '../message-handler/_/_delete-ephemeral-consumer-group.js';
import { IConsumerContext } from '../types/consumer-context.js';
import { HandlerRegistry } from './handler-registry.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';
import { _generateEphemeralConsumerGroupId } from './_/_generate-ephemeral-consumer-group-id.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { IConsumerQueuesWithStatus } from '../types/index.js';
import { InternalEventBus } from '../../event-bus/internal-event-bus.js';
import { IQueueStateTransition } from '../../queue-state-manager/index.js';

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
 */
export class MessageHandlerRunner extends Runnable<TMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly consumerContext: IConsumerContext;
  protected readonly supervisorTimer: Timer;

  /**
   * Registered handler configurations and the canonical identity function.
   */
  protected readonly registry: HandlerRegistry;

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

    // Subscribe before goingUp, so state-change events that fire between
    // construction and run() are not missed. A consumer.consume() call
    // issued before run() registers a config that will be started on
    // goingUp; if the queue's state changed in the interim, this
    // subscription is what records that transition.
    InternalEventBus.getInstance().on(
      'queue.stateChanged',
      this.onQueueStateChanged,
    );

    this.logger.debug(`MessageHandlerRunner with ID: ${this.id} initialized.`);
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

  protected getMessageHandlerInstance(
    queue: IQueueParsedParams,
  ): MessageHandler | undefined {
    return this.messageHandlerInstances.find((i) =>
      this.registry.matches(i.getQueue(), queue),
    );
  }

  getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerParams | undefined {
    return this.registry.get(queue)?.params;
  }

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

  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback): void {
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

              if (
                effectiveGroupId &&
                handlerParams.queue.groupId !== effectiveGroupId
              ) {
                handlerParams.queue = {
                  ...handlerParams.queue,
                  groupId: effectiveGroupId,
                };
              }

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
