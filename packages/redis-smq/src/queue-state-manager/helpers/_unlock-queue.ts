/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback, ILogger } from 'redis-smq-common';
import {
  EQueueOperationalState,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  EQueueStateLockOwner,
  EQueueStateTransitionReason,
  IQueueStateTransition,
  TQueueStateCommonOptions,
} from '../types/index.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParamsAndValidate } from '../../queue-manager/_/_parse-queue-params-and-validate.js';
import { _getQueueState } from './_get-queue-state.js';
import {
  QueueLockOwnerMismatchError,
  QueueStateTransitionError,
} from '../../errors/index.js';
import { _transitQueueTo } from './_transit-queue-to.js';

export function _unlockQueue(
  queue: string | IQueueParams,
  lockOwner: EQueueStateLockOwner,
  lockId: string,
  options: TQueueStateCommonOptions | null,
  logger: ILogger,
  cb: ICallback<IQueueStateTransition>,
): void {
  const queueDesc =
    typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
  logger.debug(`Unlocking queue: ${queueDesc} with lock ID: ${lockId}`);

  withSharedPoolConnection((client, done) => {
    _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
      if (err) return done(err);
      if (!queueParams) return done(new CallbackEmptyReplyError());

      _getQueueState(client, queueParams, (err, currentState) => {
        if (err) return done(err);
        if (!currentState) return done(new CallbackEmptyReplyError());

        // Verify lock owner
        if (currentState.lockOwner !== lockOwner) {
          const error = new QueueLockOwnerMismatchError({
            message: `Cannot unlock queue that is locked by other process`,
            metadata: {
              queue: queueParams,
              expectedOwner: EQueueStateLockOwner[lockOwner],
              actualOwner: currentState.lockOwner,
            },
          });
          logger.error(error.message, error);
          return done(error);
        }

        // Verify we're in locked state
        if (currentState.to !== EQueueOperationalState.LOCKED) {
          const error = new QueueStateTransitionError({
            message: `Cannot unlock queue that is not in LOCKED state. Current state: ${currentState.to}`,
            metadata: {
              from: currentState.to,
              to: EQueueOperationalState.ACTIVE,
            },
          });
          logger.error(error.message, error);
          return done(error);
        }

        // Verify lock ID matches
        if (currentState.lockId !== lockId) {
          const error = new QueueStateTransitionError({
            message: `Lock ID mismatch. Expected: ${currentState.lockId}, Got: ${lockId}`,
            metadata: {
              from: currentState.to,
              to: EQueueOperationalState.ACTIVE,
            },
          });
          logger.error(error.message, error);
          return done(error);
        }

        // Transition to ACTIVE state
        _transitQueueTo(
          queue,
          EQueueOperationalState.ACTIVE,
          {
            reason: options?.reason || EQueueStateTransitionReason.MANUAL,
            description: options?.description || 'Manual unlock',
            lockId, // Pass lockId for Lua validation
            metadata: options?.metadata,
          },
          logger,
          (err, transition) => {
            if (err) {
              logger.error(`Error unlocking ${queueDesc}: ${err.message}`, err);
              return done(err);
            }
            if (!transition) return done(new CallbackEmptyReplyError());

            logger.info(`Queue ${queueDesc} unlocked successfully`);

            done(null, transition);
          },
        );
      });
    });
  }, cb);
}
