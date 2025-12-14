/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ICallback,
  IRedisClient,
  IRedisConfig,
  RedisClientFactory,
} from 'redis-smq-common';
import { Configuration } from '../../../config/index.js';
import { scriptFileMap } from './scripts/scripts.js';

export class RedisClient extends RedisClientFactory {
  constructor(cfg?: IRedisConfig) {
    const config = cfg ?? Configuration.getConfig().redis;
    super(config);
  }

  protected override setupClient(
    client: IRedisClient,
    cb: ICallback<IRedisClient>,
  ) {
    client.loadScriptFiles(scriptFileMap, (err) => {
      if (err) cb(err);
      cb(null, client);
    });
  }
}
