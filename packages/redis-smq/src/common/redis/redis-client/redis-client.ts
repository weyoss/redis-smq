/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient, RedisClientFactory } from 'redis-smq-common';
import { scriptFileMap } from '../scripts.js';

export class RedisClient extends RedisClientFactory {
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
