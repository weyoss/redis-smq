/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { IRedisSMQConfig, IRedisSMQConfigRequired } from './types/index.js';

const defaultConfig: IRedisSMQConfigRequired['logger'] = {
  enabled: false,
};

export default function Logger(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['logger'] {
  return _.merge({}, defaultConfig, userConfig.logger ?? {});
}
