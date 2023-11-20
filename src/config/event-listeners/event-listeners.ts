/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IEventListenersConfigRequired } from '../../../types';
import { merge } from 'lodash';

const defaultConfig: IEventListenersConfigRequired = {
  consumerEventListeners: [],
  producerEventListeners: [],
};

export function EventListeners(
  userConfig: IRedisSMQConfig,
): IEventListenersConfigRequired {
  const { eventListeners = {} } = userConfig;
  return merge({}, defaultConfig, eventListeners);
}
