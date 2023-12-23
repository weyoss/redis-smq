/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, TEventListenersConfig } from '../../../types';

const defaultConfig: TEventListenersConfig = [];

export function EventListeners(
  userConfig: IRedisSMQConfig,
): TEventListenersConfig {
  const { eventListeners = [] } = userConfig;
  return [...defaultConfig, ...eventListeners];
}
