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
  EQueueStateLockOwner,
  EStateTransitionReason,
  IQueueStateTransition,
  TQueueStateTransitionOptions,
} from '../types/index.js';
import { ICallback, ILogger } from 'redis-smq-common';
import { _transitQueueTo } from './_transit-queue-to.js';

export function _lockQueue(
  queue: string | IQueueParams,
  lockOwner: EQueueStateLockOwner,
  lockId: string,
  options: TQueueStateTransitionOptions | null,
  logger: ILogger,
  cb: ICallback<IQueueStateTransition>,
): void {
  const queueDesc =
    typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;

  logger.debug(
    `Locking queue: ${queueDesc} for ${lockOwner}. Lock ID: ${lockId}.`,
  );

  _transitQueueTo(
    queue,
    EQueueOperationalState.LOCKED,
    {
      reason: options?.reason || EStateTransitionReason.MANUAL,
      description: options?.description || 'Exclusive lock',
      lockId,
      lockOwner,
      metadata: options?.metadata,
    },
    logger,
    cb,
  );
}
