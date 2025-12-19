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

export function parseLoggerConfig(userConfig?: ILoggerConfig): ILoggerConfig {
  return _.merge({}, defaultConfig.logger, userConfig ?? {});
}
