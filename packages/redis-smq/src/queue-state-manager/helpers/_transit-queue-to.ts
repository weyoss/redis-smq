/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueOperationalState,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  EQueueStateTransitionReason,
  IQueueStateTransition,
  TQueueStateFullOptions,
} from '../types/index.js';
import { CallbackEmptyReplyError, ICallback, ILogger } from 'redis-smq-common';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParamsAndValidate } from '../../queue-manager/_/_parse-queue-params-and-validate.js';
import { _getQueueState } from './_get-queue-state.js';
import { _isAllowedTransition } from './_is-allowed-transition.js';
import { QueueStateTransitionError } from '../../errors/index.js';
import { _setQueueState } from './_set-queue-state.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function _transitQueueTo(
  queue: string | IQueueParams,
  newState: EQueueOperationalState,
  options: TQueueStateFullOptions | null,
  logger: ILogger,
  cb: ICallback<IQueueStateTransition>,
): void {
  const queueDesc =
    typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
  logger.debug(
    `Setting operational state for queue ${queueDesc} to: ${EQueueOperationalState[newState]}`,
  );

  withSharedPoolConnection((client, done) => {
    _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
      if (err) return done(err);
      if (!queueParams) return done(new CallbackEmptyReplyError());

      _getQueueState(client, queueParams, (err, currentState) => {
        if (err) return done(err);
        if (!currentState) return done(new CallbackEmptyReplyError());

        // Validate transition
        if (!_isAllowedTransition(currentState.to, newState)) {
          const error = new QueueStateTransitionError({
            message: `Cannot transition from ${EQueueOperationalState[currentState.to]} to ${EQueueOperationalState[newState]}`,
            metadata: {
              from: currentState.to,
              to: newState,
            },
          });
          logger.error(error.message, error);
          return done(error);
        }

        // Determine reason if not provided
        const reason = options?.reason || EQueueStateTransitionReason.MANUAL;

        // Perform state transition
        _setQueueState(
          client,
          queueParams,
          currentState.to,
          newState,
          reason,
          options,
          (err, transition) => {
            if (err) {
              logger.error(
                `Error setting state for ${queueDesc}: ${err.message}`,
                err,
              );
              return done(err);
            }
            if (!transition) return done(new CallbackEmptyReplyError());

            logger.info(
              `Queue ${queueDesc} state changed from ${EQueueOperationalState[currentState.to]} to ${EQueueOperationalState[newState]} (reason: ${reason})`,
            );

            // Emit state change event
            EventMultiplexer.publish(
              'queue.stateChanged',
              queueParams,
              transition,
            );

            done(null, transition);
          },
        );
      });
    });
  }, cb);
}
