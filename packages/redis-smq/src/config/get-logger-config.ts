/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { defaultConfig } from './default-config.js';

export function getLoggerConfig(
  userConfig: IRedisSMQConfig,
): IRedisSMQParsedConfig['logger'] {
  return _.merge({}, defaultConfig.logger, userConfig.logger ?? {});
}
