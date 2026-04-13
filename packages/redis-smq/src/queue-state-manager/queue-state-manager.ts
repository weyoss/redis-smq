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
import { Configuration } from '../config-manager/configuration.js';
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
 * Manages queue operational states and transitions.
 *
 * Provides methods to get state, pause, resume, stop queues,
 * and retrieve state transition history.
 *
 * @example
 * const stateManager = new QueueStateManager();
 *
 * // Get queue state
 * const state = await stateManager.getState('orders');
 *
 * // Pause a queue
 * await stateManager.pause('orders', { reason: EStateTransitionReason.MANUAL });
 */
export class QueueStateManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Gets the current operational state of a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, state) => void. Returns IQueueStateTransition
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const state = await stateManager.getState('orders');
   * console.log(state.to);
   *
   * // Callback
   * stateManager.getState('orders', (err, state) => {
   *   if (err) throw err;
   *   console.log(state.to);
   * });
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
   * Pauses message processing for a queue.
   *
   * Queue continues to accept messages but stops processing them.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param options - Optional transition options (reason, description, metadata)
   * @param cb - (err, transition) => void. Returns IQueueStateTransition
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const transition = await stateManager.pause('orders', {
   *   reason: EStateTransitionReason.MANUAL,
   *   description: 'Maintenance'
   * });
   *
   * // Callback
   * stateManager.pause('orders', null, (err, transition) => {
   *   if (err) throw err;
   *   console.log(transition.timestamp);
   * });
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
   * Resumes message processing for a paused or stopped queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param options - Optional transition options (reason, description, metadata)
   * @param cb - (err, transition) => void. Returns IQueueStateTransition
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const transition = await stateManager.resume('orders', {
   *   reason: EStateTransitionReason.MANUAL,
   *   description: 'Maintenance complete'
   * });
   *
   * // Callback
   * stateManager.resume('orders', null, (err, transition) => {
   *   if (err) throw err;
   *   console.log(transition.timestamp);
   * });
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
   * Stops a queue completely.
   *
   * Queue will not accept new messages nor process existing ones.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param options - Optional transition options (reason, description, metadata)
   * @param cb - (err, transition) => void. Returns IQueueStateTransition
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const transition = await stateManager.stop('orders', {
   *   reason: EStateTransitionReason.EMERGENCY,
   *   description: 'Security incident'
   * });
   *
   * // Callback
   * stateManager.stop('orders', null, (err, transition) => {
   *   if (err) throw err;
   *   console.log(transition.timestamp);
   * });
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
   * Gets the complete state transition history for a queue.
   *
   * Returns array of all state transitions from oldest to newest.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, history) => void. Returns IQueueStateTransition[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const history = await stateManager.getStateHistory('orders');
   * console.log(`Total transitions: ${history.length}`);
   *
   * // Callback
   * stateManager.getStateHistory('orders', (err, history) => {
   *   if (err) throw err;
   *   history.forEach(t => console.log(t.to));
   * });
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
