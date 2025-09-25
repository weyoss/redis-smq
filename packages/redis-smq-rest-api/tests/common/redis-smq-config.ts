/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig } from 'redis-smq';

export const redisSMQConfig: IRedisSMQConfig = {
  logger: {
    enabled: false,
    options: {
      logLevel: 'DEBUG',
    },
  },
  eventBus: {
    enabled: true,
  },
  messages: {
    store: true,
  },
};
