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

const defaultConfig: IRedisSMQConfigRequired['eventBus'] = {
  enabled: false,
};

export default function EventBus(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['eventBus'] {
  return _.merge({}, defaultConfig, userConfig.eventBus ?? {});
}
