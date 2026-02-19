/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueWorkerAbstract } from '../queue-worker-abstract.js';
import { async, ICallback } from 'redis-smq-common';
import { _getQueueState } from '../../../../queue-state-manager/helpers/_get-queue-state.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import {
  EQueueStateLockOwner,
  EQueueStateTransitionReason,
  IQueueStateTransition,
} from '../../../../queue-state-manager/index.js';
import { EQueueOperationalState } from '../../../../queue-manager/index.js';
import { PurgeQueueJobManager } from '../../../../redis-smq/background-jobs/jobs/purge-queue/purge-queue-job-manager.js';
import { _unlockQueue } from '../../../../queue-state-manager/helpers/_unlock-queue.js';

export class RecoverOrphanedLockWorker extends QueueWorkerAbstract {
  override work(cb: ICallback) {
    withSharedPoolConnection((client, cb) => {
      const queue = this.queueParsedParams.queueParams;
      async.waterfall(
        [
          (next: ICallback<IQueueStateTransition>) =>
            _getQueueState(client, this.queueParsedParams.queueParams, next),
          (state, next) => {
            if (state.to !== EQueueOperationalState.LOCKED) return next();
            if (state.lockOwner === EQueueStateLockOwner.PURGE_JOB) {
              const purgeQueueJobManager = new PurgeQueueJobManager(
                client,
                this.logger,
              );
              const jobId = String(state.lockId);
              purgeQueueJobManager.validateJob(jobId, (err, r) => {
                if (err) return next(err);
                if (!r) {
                  this.logger.info(
                    `Recovering queue ${queue.name}@${queue.ns} from orphaned locked state...`,
                  );
                  _unlockQueue(
                    queue,
                    EQueueStateLockOwner.PURGE_JOB,
                    jobId,
                    {
                      reason: EQueueStateTransitionReason.RECOVERY,
                    },
                    this.logger,
                    (err) => {
                      if (err) {
                        this.logger.error(
                          `Failed to unlock queue: ${err.message}`,
                        );
                      } else {
                        this.logger.info(
                          `Successfully recovered queue ${queue.name}@${queue.ns} from orphaned locked state.`,
                        );
                      }
                      next(err);
                    },
                  );
                }
              });
            }
          },
        ],
        cb,
      );
    }, cb);
  }
}

export default RecoverOrphanedLockWorker;
