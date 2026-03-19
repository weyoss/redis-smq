/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../queue-manager/index.js';

export interface IConsumerBatchConfig {
  enabled?: boolean;
  batchSize?: number;
  batchTimeoutMs?: number;
}

export interface IConsumerOptions {
  heartbeatTTL?: number;
  enableMultiplexing?: boolean;
  batchAcks?: boolean | IConsumerBatchConfig;
  batchUnacks?: boolean | IConsumerBatchConfig;
}

export interface IConsumerParsedOptions extends Required<IConsumerOptions> {
  batchAcks: Required<IConsumerBatchConfig>;
  batchUnacks: Required<IConsumerBatchConfig>;
}

export interface IConsumerQueuesWithStatus {
  queue: IQueueParsedParams;
  status: 'active' | 'stopped';
}
