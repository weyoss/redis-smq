/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../../../queue-manager/index.js';
import { IWorkerPayload } from '../../../../common/abstract/worker/types/worker.js';

export interface IQueueWorkerPayload extends IWorkerPayload {
  consumerId: string;
  queueParsedParams: IQueueParsedParams;
}
