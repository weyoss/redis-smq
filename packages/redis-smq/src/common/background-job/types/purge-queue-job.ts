/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../../queue-manager/index.js';
import { EQueueMessageType } from '../../queue-messages-registry/types/index.js';

export type TPurgeQueueJobTarget = {
  queue: IQueueParsedParams;
  messageType: EQueueMessageType;
};
