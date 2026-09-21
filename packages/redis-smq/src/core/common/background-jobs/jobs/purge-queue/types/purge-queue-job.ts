/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IBackgroundJob } from '../../../types/index.js';
import { IQueueParsedParams } from '../../../../../../contracts/index.js';
import { EQueueMessageType } from '../../../../../queue-messages/types/queue-messages-registry.js';

export type TPurgeQueueJobPayload = {
  queue: IQueueParsedParams;
  messageType: EQueueMessageType;
};

export type TPurgeQueueJobMeta = {
  purged: number;
};

export type TPurgeQueueJob = IBackgroundJob<
  TPurgeQueueJobPayload,
  TPurgeQueueJobMeta
>;
