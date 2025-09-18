/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../../../queue-manager/index.js';
import { ICallback, IRedisConfig } from 'redis-smq-common';

export type TConsumerMessageHandlerWorkerPayload = {
  redisConfig: IRedisConfig;
  queueParsedParams: IQueueParsedParams;
};

export type TConsumerMessageHandlerWorkerBootstrapFn = (
  args: TConsumerMessageHandlerWorkerPayload,
) => {
  run: (cb: ICallback) => void;
  shutdown: (cb: ICallback) => void;
};
