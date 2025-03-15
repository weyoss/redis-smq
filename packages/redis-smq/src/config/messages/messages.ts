/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../types/index.js';
import Store from './store.js';

const defaultConfig: IRedisSMQConfigRequired['messages'] = {
  store: {
    acknowledged: {
      store: false,
      queueSize: 0,
      expire: 0,
    },
    deadLettered: {
      store: false,
      queueSize: 0,
      expire: 0,
    },
  },
};

export default function Messages(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['messages'] {
  const store = Store(userConfig);
  return _.merge({}, defaultConfig, { store });
}
