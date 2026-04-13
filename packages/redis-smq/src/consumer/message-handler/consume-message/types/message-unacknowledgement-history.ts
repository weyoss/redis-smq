/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
} from './message-unacknowledgement.js';
import { IQueueParsedParams } from '../../../../queue-manager/index.js';

export interface IMessageUnacknowledgementRecord {
  messageId: string;
  queue: IQueueParsedParams;
  consumerId: string;
  cause: EMessageUnacknowledgementCause;
  action: EMessageUnacknowledgementAction;
  deadLetterCause?: EMessageDeadLetterCause;
  timestamp: number;
  retryCount: number;
}

export type TMessageUnacknowledgementHistory =
  IMessageUnacknowledgementRecord[];
