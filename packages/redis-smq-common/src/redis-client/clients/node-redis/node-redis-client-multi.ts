/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
  WatchError,
} from '@redis/client';
import { RedisClientMultiCommandType } from '@redis/client/dist/lib/client/multi-command.js';
import { ICallback } from '../../../common/index.js';
import { WatchedKeysChangedError } from '../../errors/index.js';
import { IRedisTransaction } from '../../types/index.js';

export type TRedisTransactionNodeRedis = RedisClientMultiCommandType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;
export type TRedisClientNodeRedis = RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

export class NodeRedisClientMulti implements IRedisTransaction {
  protected multi: TRedisTransactionNodeRedis;

  constructor(client: TRedisClientNodeRedis) {
    this.multi = client.multi();
  }

  lrem(key: string, count: number, element: string): this {
    this.multi.lRem(key, count, element);
    return this;
  }

  lpop(key: string): this {
    this.multi.lPop(key);
    return this;
  }

  lpush(key: string, element: string): this {
    this.multi.lPush(key, element);
    return this;
  }

  ltrim(key: string, start: number, stop: number): this {
    this.multi.lTrim(key, start, stop);
    return this;
  }

  rpop(key: string): this {
    this.multi.rPop(key);
    return this;
  }

  rpush(key: string, element: string): this {
    this.multi.rPush(key, element);
    return this;
  }

  zadd(key: string, score: number, element: string): this {
    this.multi.zAdd(key, { score, value: element });
    return this;
  }

  zrem(key: string, element: string | string[]): this {
    this.multi.zRem(key, element);
    return this;
  }

  sadd(key: string, element: string): this {
    this.multi.sAdd(key, element);
    return this;
  }

  srem(key: string, element: string | string[]): this {
    this.multi.sRem(key, element);
    return this;
  }

  hset(key: string, field: string, value: string | number): this {
    this.multi.hSet(key, field, value);
    return this;
  }

  hdel(key: string, field: string | string[]): this {
    this.multi.hDel(key, field);
    return this;
  }

  hincrby(key: string, field: string, by: number): this {
    this.multi.hIncrBy(key, field, by);
    return this;
  }

  pexpire(key: string, millis: number): this {
    this.multi.pExpire(key, millis);
    return this;
  }

  expire(key: string, secs: number): this {
    this.multi.expire(key, secs);
    return this;
  }

  rpoplpush(source: string, destination: string): this {
    this.multi.rPopLPush(source, destination);
    return this;
  }

  del(key: string | string[]): this {
    this.multi.del(key);
    return this;
  }

  exec(cb: ICallback<unknown[]>): void {
    this.multi
      .exec()
      .then((reply) => cb(null, reply))
      .catch((err: Error) => {
        if (err instanceof WatchError) cb(new WatchedKeysChangedError());
        else cb(err);
      });
  }
}
