/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Redis } from 'ioredis';
import { ICallback } from '../../../common/index.js';
import {
  RedisClientError,
  WatchedKeysChangedError,
} from '../../errors/index.js';
import { IRedisTransaction } from '../../types/index.js';

export class IoredisClientMulti implements IRedisTransaction {
  protected multi;

  constructor(client: Redis) {
    this.multi = client.multi();
  }

  lrem(key: string, count: number, element: string): this {
    this.multi.lrem(key, count, element);
    return this;
  }

  lpop(key: string): this {
    this.multi.lpop(key);
    return this;
  }

  lpush(key: string, element: string): this {
    this.multi.lpush(key, element);
    return this;
  }

  ltrim(key: string, start: number, stop: number): this {
    this.multi.ltrim(key, start, stop);
    return this;
  }

  rpop(key: string): this {
    this.multi.rpop(key);
    return this;
  }

  rpush(key: string, element: string): this {
    this.multi.rpush(key, element);
    return this;
  }

  zadd(key: string, score: number, element: string): this {
    this.multi.zadd(key, score, element);
    return this;
  }

  zrem(key: string, element: string | string[]): this {
    this.multi.zrem(
      key,
      ...(typeof element === 'string' ? [element] : element),
    );
    return this;
  }

  sadd(key: string, element: string): this {
    this.multi.sadd(key, element);
    return this;
  }

  srem(key: string, element: string | string[]): this {
    this.multi.srem(
      key,
      ...(typeof element === 'string' ? [element] : element),
    );
    return this;
  }

  hset(key: string, field: string, value: string | number): this {
    this.multi.hset(key, field, value);
    return this;
  }

  hdel(key: string, field: string | string[]): this {
    this.multi.hdel(key, ...(typeof field === 'string' ? [field] : field));
    return this;
  }

  hincrby(key: string, field: string, by: number): this {
    this.multi.hincrby(key, field, by);
    return this;
  }

  pexpire(key: string, millis: number): this {
    this.multi.pexpire(key, millis);
    return this;
  }

  expire(key: string, secs: number): this {
    this.multi.expire(key, secs);
    return this;
  }

  rpoplpush(source: string, destination: string): this {
    this.multi.rpoplpush(source, destination);
    return this;
  }

  del(key: string | string[]): this {
    this.multi.del(...(typeof key === 'string' ? [key] : key));
    return this;
  }

  exec(cb: ICallback<unknown[]>): void {
    this.multi.exec(
      (err, reply: [Error | null, unknown][] | null | undefined) => {
        if (err) cb(err);
        else if (!reply) cb(new WatchedKeysChangedError());
        else {
          const lengths: unknown[] = [];
          let err: Error | null = null;
          for (const i of reply) {
            if (!Array.isArray(i)) {
              err = new RedisClientError(
                'Expected an array reply from multi.exec()',
              );
              break;
            }
            const [error, result] = i;
            if (error instanceof Error) {
              err = error;
              break;
            }
            lengths.push(result);
          }
          if (err) cb(err);
          else cb(null, lengths);
        }
      },
    );
  }
}
