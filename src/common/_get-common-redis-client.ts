/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  redis,
  RedisClient,
} from 'redis-smq-common';
import { Configuration } from '../config/configuration';

let redisClient: RedisClient | null = null;

export function _getCommonRedisClient(cb: ICallback<RedisClient>): void {
  if (!redisClient) {
    const cfg = Configuration.getSetConfig().redis;
    redis.createInstance(cfg, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        redisClient = client;
        cb(null, client);
      }
    });
  } else cb(null, redisClient);
}

export function _destroyCommonRedisClient(cb: ICallback<void>): void {
  if (redisClient) {
    redisClient.halt(() => {
      redisClient = null;
      cb();
    });
  } else cb();
}
