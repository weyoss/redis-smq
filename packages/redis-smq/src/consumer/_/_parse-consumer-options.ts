/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IConsumerOptions, TConsumerParsedOptions } from '../types/index.js';

export function _parseConsumerOptions(
  config: boolean | IConsumerOptions | undefined,
  defaultConfig: TConsumerParsedOptions,
): TConsumerParsedOptions {
  if (config == null) {
    return defaultConfig;
  }

  if (typeof config === 'boolean') {
    return {
      ...defaultConfig,
      enableMultiplexing: true,
    };
  }

  if (config?.batchSize && config.batchSize > 1000) {
    throw new Error(`Batch size is too big. Maximum allowed value is 1000.`);
  }

  if (config?.batchTimeoutMs && config.batchTimeoutMs < 1000) {
    throw new Error(
      `Batch timeout is too small. Minimum allowed value is 1000.`,
    );
  }

  return {
    ...defaultConfig,
    ...config,
  };
}
