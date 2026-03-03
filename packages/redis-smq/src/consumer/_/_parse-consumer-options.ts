/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IConsumerOptions,
  IConsumerParsedOptions,
  IConsumerBatchConfig,
} from '../types/index.js';

function parseBatchConfig(
  config: boolean | IConsumerBatchConfig | undefined,
  defaultConfig: Required<IConsumerBatchConfig>,
): Required<IConsumerBatchConfig> {
  if (config === undefined || config === true) {
    return { ...defaultConfig };
  }
  if (config === false) {
    return {
      enabled: false,
      batchSize: defaultConfig.batchSize,
      batchTimeoutMs: defaultConfig.batchTimeoutMs,
    };
  }
  return {
    enabled: config.enabled ?? defaultConfig.enabled,
    batchSize: config.batchSize ?? defaultConfig.batchSize,
    batchTimeoutMs: config.batchTimeoutMs ?? defaultConfig.batchTimeoutMs,
  };
}

export function _parseConsumerOptions(
  config: boolean | IConsumerOptions | undefined,
  defaultConfig: IConsumerParsedOptions,
): IConsumerParsedOptions {
  if (config === undefined) {
    return {
      heartbeatTTL: defaultConfig.heartbeatTTL,
      enableMultiplexing: defaultConfig.enableMultiplexing,
      batchAcks: { ...defaultConfig.batchAcks },
      batchUnacks: { ...defaultConfig.batchUnacks },
    };
  }
  if (typeof config === 'boolean') {
    return {
      heartbeatTTL: defaultConfig.heartbeatTTL,
      enableMultiplexing: config,
      batchAcks: { ...defaultConfig.batchAcks },
      batchUnacks: { ...defaultConfig.batchUnacks },
    };
  }
  return {
    heartbeatTTL: config.heartbeatTTL ?? defaultConfig.heartbeatTTL,
    enableMultiplexing:
      config.enableMultiplexing ?? defaultConfig.enableMultiplexing,
    batchAcks: parseBatchConfig(config.batchAcks, defaultConfig.batchAcks),
    batchUnacks: parseBatchConfig(
      config.batchUnacks,
      defaultConfig.batchUnacks,
    ),
  };
}
