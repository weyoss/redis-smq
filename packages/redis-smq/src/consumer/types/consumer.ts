/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IConsumerOptions {
  heartbeatTTL?: number;
  enableMultiplexing?: boolean;
  enableBatchAcks?: boolean;
  enableBatchUnacks?: boolean;
  batchSize?: number;
  batchTimeoutMs?: number;
}

export type TConsumerParsedOptions = Required<IConsumerOptions>;
