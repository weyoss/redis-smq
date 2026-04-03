/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConfigManager, RedisSMQ } from '../../../src/index.js';
import { async, IRedisConfig } from 'redis-smq-common';

process.on('message', function (payload: unknown) {
  const {
    redisConfig,
  }: {
    redisConfig: IRedisConfig;
  } = JSON.parse(String(payload));

  async.series(
    [
      (cb) => RedisSMQ.initialize(redisConfig, cb),
      (cb) => {
        const configManager = new ConfigManager();
        configManager.updateConfig(
          {
            messageAudit: true,
          },
          cb,
        );
      },
      (cb) => {
        RedisSMQ.shutdown(cb);
      },
    ],
    (err) => {
      if (err) {
        console.log('update-config-thread error', err);
        process.exit(1);
      }
      process.exit(0);
    },
  );
});
