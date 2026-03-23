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
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
} from 'redis-smq-common';
import {
  EQueueOperationalState,
  IQueueParams,
} from '../queue-manager/index.js';
import { Configuration } from '../config/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParamsAndValidate } from '../queue-manager/_/_parse-queue-params-and-validate.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import {
  EStateTransitionReason,
  IQueueStateTransition,
  TQueueStateTransitionUserOptions,
} from './types/index.js';
import { _getQueueState } from './_/_get-queue-state.js';
import { _transitQueueTo } from './_/_transit-queue-to.js';

/**
 * Manages queue operational states and transitions
 *
 * The QueueStateManager provides a comprehensive interface for controlling and monitoring
 * the operational state of message queues. It ensures atomic state transitions,
 * maintains a complete audit trail of all state changes, and enforces transition rules
 * to maintain system consistency.
 *
 * Key features:
 * - Atomic state transitions with validation
 * - Complete state history tracking
 * - Event emission for state changes (via EventMultiplexer)
 * - Support for paused, active, and stopped states
 * - Internal locking mechanism for system operations (not exposed to end users)
 *
 * @example
 * ```typescript
 * const stateManager = new QueueStateManager();
 *
 * // Using callback
 * stateManager.getState('orders@production', (err, state) => {
 *   if (err) console.error('Failed to get state:', err);
 *   else console.log('Queue state:', EQueueOperationalState[state.to]);
 * });
 *
 * // Using promise
 * const state = await stateManager.getState('orders@production');
 * console.log('Queue state:', EQueueOperationalState[state.to]);
 * ```
 */
export class QueueStateManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Retrieves the current operational state of a queue
   *
   * This method returns the complete state transition information for the queue,
   * including the current state, when it was last changed, and the reason for
   * the last transition.
   *
   * @param queue - Queue identifier (either string in format "name@namespace" or IQueueParams object)
   * @param cb - Optional callback function that receives either an error or the current state information
   * @returns {Promise<IQueueStateTransition> | void} - Returns a Promise if no callback is provided
   *
   * @throws {CallbackEmptyReplyError} If queue exists but no state information is found
   *
   * @example
   * ```typescript
   * // Callback pattern
   * stateManager.getState('orders@production', (err, state) => {
   *   if (err) {
   *     console.error('Failed to get state:', err);
   *   } else {
   *     console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
   *     console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
   *     console.log(`Reason: ${state.reason}`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const state = await stateManager.getState({ name: 'orders', ns: 'production' });
   *   console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
   *   console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
   * } catch (err) {
   *   console.error('Failed to get state:', err);
   * }
   * ```
   */
  getState(queue: string | IQueueParams): Promise<IQueueStateTransition>;
  getState(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition>,
  ): void;
  getState(
    queue: string | IQueueParams,
    cb?: ICallback<IQueueStateTransition>,
  ): Promise<IQueueStateTransition> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting operational state for queue: ${queueDesc}`);

      withSharedPoolConnection((client, done) => {
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) return done(err);
          if (!queueParams) return done(new CallbackEmptyReplyError());

          _getQueueState(client, queueParams, (err, stateTransition) => {
            if (err) {
              this.logger.error(
                `Error getting state for ${queueDesc}: ${err.message}`,
                err,
              );
              return done(err);
            }
            if (!stateTransition) return done(new CallbackEmptyReplyError());

            this.logger.debug(
              `Queue ${queueDesc} state: ${EQueueOperationalState[stateTransition.to]}`,
            );
            done(null, stateTransition);
          });
        });
      }, callback);
    });
  }

  /**
   * Temporarily pauses message processing for a queue
   *
   * When paused, the queue continues to accept new messages but stops processing them.
   * This is useful for maintenance activities, deployment windows, or temporarily
   * halting processing due to downstream issues.
   *
   * Valid transitions to PAUSED:
   * - From ACTIVE (normal operation → paused)
   * - From STOPPED (if resuming then immediately pausing is not recommended - use resume instead)
   *
   * @param queue - Queue identifier (string or IQueueParams)
   * @param options - Configuration options for the pause operation
   * @param cb - Optional callback receiving the completed state transition record
   * @returns {Promise<IQueueStateTransition> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern - simple pause
   * stateManager.pause('orders@production', null, (err, transition) => {
   *   if (err) {
   *     console.error('Failed to pause:', err);
   *   } else {
   *     console.log('Queue paused at:', new Date(transition.timestamp));
   *   }
   * });
   *
   * // Promise pattern - pause with detailed reason
   * try {
   *   const transition = await stateManager.pause(
   *     { name: 'email-worker', ns: 'production' },
   *     {
   *       reason: EStateTransitionReason.PERFORMANCE,
   *       description: 'Email service latency spike detected',
   *       metadata: { latency: '2500ms' }
   *     }
   *   );
   *   console.log('Queue paused at:', new Date(transition.timestamp));
   * } catch (err) {
   *   console.error('Failed to pause:', err);
   * }
   * ```
   */
  pause(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  pause(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
  pause(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb?: ICallback<IQueueStateTransition>,
  ): Promise<IQueueStateTransition> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Pausing queue: ${queueDesc}`);

      _transitQueueTo(
        queue,
        EQueueOperationalState.PAUSED,
        {
          ...options,
          reason: options?.reason || EStateTransitionReason.MANUAL,
          description: options?.description || 'Manual pause',
        },
        this.logger,
        callback,
      );
    });
  }

  /**
   * Resumes message processing for a previously paused or stopped queue
   *
   * This method transitions a queue back to the ACTIVE state, allowing it to
   * resume normal message processing. It can be called on queues in either
   * PAUSED or STOPPED states.
   *
   * Valid transitions to ACTIVE:
   * - From PAUSED (resume normal operation)
   * - From STOPPED (restart a stopped queue)
   *
   * Note: Cannot resume a queue that is LOCKED (internal state) - locks are
   * managed automatically by system components.
   *
   * @param queue - Queue identifier (string or IQueueParams)
   * @param options - Configuration options for the resume operation
   * @param cb - Optional callback receiving the completed state transition record
   * @returns {Promise<IQueueStateTransition> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern - simple resume
   * stateManager.resume('orders', null, (err, transition) => {
   *   if (err) {
   *     console.error('Failed to resume:', err);
   *   } else {
   *     console.log('Queue resumed at:', new Date(transition.timestamp));
   *   }
   * });
   *
   * // Promise pattern - resume with detailed reason
   * try {
   *   const transition = await stateManager.resume(
   *     { name: 'email-worker', ns: 'production' },
   *     {
   *       reason: EStateTransitionReason.MANUAL,
   *       description: 'Database maintenance completed',
   *       metadata: { downtime: '45s' }
   *     }
   *   );
   *   console.log('Queue resumed at:', new Date(transition.timestamp));
   * } catch (err) {
   *   console.error('Failed to resume:', err);
   * }
   * ```
   */
  resume(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  resume(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
  resume(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb?: ICallback<IQueueStateTransition>,
  ): Promise<IQueueStateTransition> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Resuming queue: ${queueDesc}`);

      _transitQueueTo(
        queue,
        EQueueOperationalState.ACTIVE,
        {
          ...options,
          reason: options?.reason || EStateTransitionReason.MANUAL,
          description: options?.description || 'Manual resume',
        },
        this.logger,
        callback,
      );
    });
  }

  /**
   * Completely stops a queue from processing messages
   *
   * When stopped, the queue will not accept new messages nor process existing ones.
   * This is a more severe state than PAUSED and is typically used for:
   * - Emergency situations (critical errors, security incidents)
   * - Queue deletion preparation
   * - Complete system shutdown
   *
   * Valid transitions to STOPPED:
   * - From ACTIVE (emergency stop)
   * - From PAUSED (stop from paused state)
   *
   * @param queue - Queue identifier (string or IQueueParams)
   * @param options - Configuration options for the stop operation
   * @param cb - Optional callback receiving the completed state transition record
   * @returns {Promise<IQueueStateTransition> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern - emergency stop
   * stateManager.stop('payment-processor', null, (err, transition) => {
   *   if (err) {
   *     console.error('Failed to stop:', err);
   *   } else {
   *     console.log('Queue stopped at:', new Date(transition.timestamp));
   *   }
   * });
   *
   * // Promise pattern - scheduled maintenance stop
   * try {
   *   const transition = await stateManager.stop(
   *     { name: 'analytics', ns: 'production' },
   *     {
   *       reason: EStateTransitionReason.SCHEDULED,
   *       description: 'Weekly maintenance window'
   *     }
   *   );
   *   console.log('Queue stopped at:', new Date(transition.timestamp));
   * } catch (err) {
   *   console.error('Failed to stop:', err);
   * }
   * ```
   */
  stop(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  stop(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
  stop(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb?: ICallback<IQueueStateTransition>,
  ): Promise<IQueueStateTransition> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Stopping queue: ${queueDesc}`);

      _transitQueueTo(
        queue,
        EQueueOperationalState.STOPPED,
        {
          ...options,
          reason: options?.reason || EStateTransitionReason.MANUAL,
          description: options?.description || 'Manual stop',
        },
        this.logger,
        callback,
      );
    });
  }

  /**
   * Retrieves the complete state transition history for a queue
   *
   * This method returns an array of all state transitions that have occurred
   * for the specified queue, from oldest to newest. The history is maintained
   * as an audit trail and can be used for:
   * - Compliance and auditing
   * - Debugging operational issues
   * - Analyzing queue behavior over time
   * - Generating reports on queue availability
   *
   * The history is limited to recent transitions.
   *
   * @param queue - Queue identifier (string or IQueueParams)
   * @param cb - Optional callback receiving either an error or an array of state transitions
   * @returns {Promise<IQueueStateTransition[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws {CallbackEmptyReplyError} If queue exists but no history is found
   *
   * @example
   * ```typescript
   * // Callback pattern - get history
   * stateManager.getStateHistory('orders@production', (err, history) => {
   *   if (err) {
   *     console.error('Failed to get history:', err);
   *   } else {
   *     console.log(`Queue has ${history.length} state transitions`);
   *     history.forEach((transition, idx) => {
   *       const from = transition.from ? EQueueOperationalState[transition.from] : 'INITIAL';
   *       const to = EQueueOperationalState[transition.to];
   *       console.log(`${idx}: ${from} → ${to} at ${new Date(transition.timestamp).toISOString()}`);
   *     });
   *   }
   * });
   *
   * // Promise pattern - analyze emergency stops
   * try {
   *   const history = await stateManager.getStateHistory('email-worker@production');
   *   const emergencyStops = history.filter(
   *     t => t.reason === EStateTransitionReason.EMERGENCY
   *   );
   *   console.log(`Emergency stops: ${emergencyStops.length}`);
   *   console.log(`Total transitions: ${history.length}`);
   * } catch (err) {
   *   console.error('Failed to get history:', err);
   * }
   * ```
   */
  getStateHistory(
    queue: string | IQueueParams,
  ): Promise<IQueueStateTransition[]>;
  getStateHistory(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition[]>,
  ): void;
  getStateHistory(
    queue: string | IQueueParams,
    cb?: ICallback<IQueueStateTransition[]>,
  ): Promise<IQueueStateTransition[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting state history for queue: ${queueDesc}`);

      withSharedPoolConnection((client, done) => {
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) return done(err);
          if (!queueParams) return done(new CallbackEmptyReplyError());

          const { keyQueueStateHistory } = redisKeys.getQueueKeys(
            queueParams.ns,
            queueParams.name,
            null,
          );

          client.lrange(keyQueueStateHistory, 0, -1, (err, reply) => {
            if (err) return done(err);

            const history: IQueueStateTransition[] = (reply || []).map((item) =>
              JSON.parse(item),
            );

            this.logger.debug(
              `Retrieved ${history.length} state transitions for ${queueDesc}`,
            );
            done(null, history);
          });
        });
      }, callback);
    });
  }
}
