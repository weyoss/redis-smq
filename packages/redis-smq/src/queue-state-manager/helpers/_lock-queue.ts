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
  EQueueStateTransitionReason,
  IQueueStateTransition,
  TQueueStateCommonOptions,
} from '../types/index.js';
import { ICallback, ILogger } from 'redis-smq-common';
import { _transitQueueTo } from './_transit-queue-to.js';

export function _lockQueuelock(
  queue: string | IQueueParams,
  lockOwner: EQueueStateLockOwner,
  lockId: string,
  options: TQueueStateCommonOptions | null,
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
      reason: options?.reason || EQueueStateTransitionReason.MANUAL,
      description: options?.description || 'Exclusive lock',
      lockId,
      lockOwner,
      metadata: options?.metadata,
    },
    logger,
    cb,
  );
}
