/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { defaultConfig } from './default-config.js';
import { ILoggerConfig } from 'redis-smq-common';
import { ILoggerParsedConfig } from './types/index.js';

export function parseLoggerConfig(
  userConfig?: boolean | ILoggerConfig,
): ILoggerParsedConfig {
  if (typeof userConfig === 'boolean') {
    return {
      ...defaultConfig.logger,
      enabled: userConfig,
    };
  }
  return _.merge({}, defaultConfig.logger, userConfig ?? {});
}
