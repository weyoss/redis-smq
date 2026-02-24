/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IConsumerOptions } from '../types/index.js';

const defaultConfig: Required<IConsumerOptions> = {
  enableMultiplexing: false,
  heartbeatTTL: 120_000,
};

export function _parseConsumerOptions(
  config?: boolean | IConsumerOptions,
): Required<IConsumerOptions> {
  if (config == null) {
    return defaultConfig;
  }
  if (typeof config === 'boolean') {
    return {
      ...defaultConfig,
      enableMultiplexing: true,
    };
  }
  return {
    ...defaultConfig,
    ...config,
  };
}
