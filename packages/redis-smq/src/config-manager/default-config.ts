/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQParsedConfig } from './types/index.js';
import { EConsoleLoggerLevel } from 'redis-smq-common';

export const defaultConfig: IRedisSMQParsedConfig = {
  namespace: 'default',
  messageAudit: {
    acknowledgedMessages: {
      enabled: false,
      queueSize: 0,
      expire: 0,
    },
    deadLetteredMessages: {
      enabled: false,
      queueSize: 0,
      expire: 0,
    },
    unacknowledgementHistory: {
      enabled: false,
      maxSize: 100,
    },
  },
  logger: {
    enabled: false,
    options: {
      includeTimestamp: true,
      colorize: true,
      logLevel: EConsoleLoggerLevel.INFO,
    },
  },
};
