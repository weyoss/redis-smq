/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TRedisSMQWorkerPayload } from './worker.js';

export interface IGlobalWorkerPayload extends TRedisSMQWorkerPayload {
  loggerContext: {
    namespaces: string[];
  };
}
