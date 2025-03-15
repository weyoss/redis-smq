/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Redis, RedisOptions } from 'ioredis';
import { ICallback } from '../../../common/index.js';
import { CallbackEmptyReplyError } from '../../../errors/index.js';
import { RedisClientError } from '../../errors/index.js';
import { RedisClientAbstract } from '../redis-client-abstract.js';
import { IoredisClientMulti } from './ioredis-client-multi.js';

export class IoredisClient extends RedisClientAbstract {
  protected client: Redis;

  constructor(config: RedisOptions = {}) {
    super();
    this.client = new Redis(config);
    this.client.once('ready', () => {
      this.connectionClosed = false;
      this.init();
    });
    this.client.once('end', () => {
      this.connectionClosed = true;
      this.emit('end');
    });
  }

  set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void {
    if (options.exists && options.expire) {
      this.client.set(
        key,
        value,
        // @ts-expect-error any
        options.expire.mode,
        options.expire.value,
        options.exists,
        cb,
      );
    } else if (options.expire) {
      this.client.set(
        key,
        value,
        // @ts-expect-error any
        options.expire.mode,
        options.expire.value,
        cb,
      );
    } else if (options.exists) {
      // @ts-expect-error any
      this.client.set(key, value, options.exists, cb);
    } else {
      this.client.set(key, value, cb);
    }
  }

  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void {
    this.client.zadd(key, score, member, cb);
  }

  multi(): IoredisClientMulti {
    return new IoredisClientMulti(this.client);
  }

  watch(args: string[], cb: ICallback<string>): void {
    this.client.watch(args, cb);
  }

  unwatch(cb: ICallback<string>): void {
    this.client.unwatch(cb);
  }

  sismember(key: string, member: string, cb: ICallback<number>): void {
    this.client.sismember(key, member, cb);
  }

  override sscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void {
    const args: [string, string] = [key, cursor];
    if (options.MATCH) args.push('MATCH', options.MATCH);
    if (options.COUNT) args.push('COUNT', String(options.COUNT));
    this.client.sscan(...args, (err, reply) => {
      if (err) return cb(err);
      const [cursor, items] = reply ?? [];
      if (!cursor || !items) return cb(new RedisClientError());
      cb(null, { cursor, items });
    });
  }

  zcard(key: string, cb: ICallback<number>): void {
    this.client.zcard(key, cb);
  }

  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void {
    this.client.zrange(key, min, max, cb);
  }

  override zscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void {
    const args: [string, string] = [key, cursor];
    if (options.MATCH) args.push('MATCH', options.MATCH);
    if (options.COUNT) args.push('COUNT', String(options.COUNT));
    this.client.zscan(...args, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new CallbackEmptyReplyError());
      else {
        const result = new Set<string>();
        const [cursor, items] = reply;
        while (items.length) {
          const item = String(items.shift());
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const score = String(items.shift());
          result.add(item);
        }
        cb(null, { cursor, items: [...result] });
      }
    });
  }

  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.zrevrange(key, min, max, cb);
  }

  zrem(source: string, id: string, cb: ICallback<number>): void {
    this.client.zrem(source, id, cb);
  }

  psubscribe(pattern: string): void {
    this.client.psubscribe(pattern);
  }

  punsubscribe(channel?: string): void {
    if (channel) this.client.punsubscribe(channel);
    else this.client.punsubscribe();
  }

  subscribe(channel: string): void {
    this.client.subscribe(channel);
  }

  unsubscribe(channel?: string): void {
    if (channel) this.client.unsubscribe(channel);
    else this.client.unsubscribe();
  }

  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.zrangebyscore(key, min, max, 'LIMIT', offset, count, cb);
  }

  smembers(key: string, cb: ICallback<string[]>): void {
    this.client.smembers(key, cb);
  }

  sadd(key: string, member: string, cb: ICallback<number>): void {
    this.client.sadd(key, member, cb);
  }

  srem(key: string, member: string, cb: ICallback<number>): void {
    this.client.srem(key, member, cb);
  }

  hgetall(key: string, cb: ICallback<Record<string, string>>): void {
    this.client.hgetall(key, cb);
  }

  override hscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; result: Record<string, string> }>,
  ): void {
    const args: [string, string] = [key, cursor];
    if (options.MATCH) args.push('MATCH', options.MATCH);
    if (options.COUNT) args.push('COUNT', String(options.COUNT));
    this.client.hscan(...args, (err, reply) => {
      if (err) return cb(err);
      const [cursor, items] = reply ?? [];
      if (!cursor || !items) return cb(new RedisClientError());
      const result: Record<string, string> = {};
      while (items.length) {
        const key = String(items.shift());
        result[key] = String(items.shift());
      }
      cb(null, { cursor, result });
    });
  }

  hget(key: string, field: string, cb: ICallback<string | null>): void {
    this.client.hget(key, field, cb);
  }

  hset(
    key: string,
    field: string,
    value: string | number,
    cb: ICallback<number>,
  ): void {
    this.client.hset(key, field, value, cb);
  }

  hdel(key: string, fields: string | string[], cb: ICallback<number>): void {
    // Normalize key to always be an array of strings
    const f = Array.isArray(fields) ? fields : [fields];
    this.client.hdel(key, ...f, cb);
  }

  lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.lrange(key, start, stop, cb);
  }

  hkeys(key: string, cb: ICallback<string[]>): void {
    this.client.hkeys(key, cb);
  }

  hlen(key: string, cb: ICallback<number>): void {
    this.client.hlen(key, cb);
  }

  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string | null>,
  ): void {
    this.client.brpoplpush(source, destination, timeout, cb);
  }

  rpoplpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void {
    this.client.rpoplpush(source, destination, cb);
  }

  zrangebyscorewithscores(
    source: string,
    min: number,
    max: number,
    cb: ICallback<Record<string, string>>,
  ): void {
    this.client.zrangebyscore(source, min, max, 'WITHSCORES', (err, reply) => {
      if (err) cb(err);
      else {
        const replyRange = reply ?? [];
        const range: Record<string, string> = {};
        for (
          let slice = replyRange.splice(0, 2);
          slice.length > 0;
          slice = replyRange.splice(0, 2)
        ) {
          const [member, score] = slice;
          range[score] = member;
        }
        cb(null, range);
      }
    });
  }

  rpop(key: string, cb: ICallback<string | null>): void {
    this.client.rpop(key, cb);
  }

  lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void {
    this.client.lrem(key, count, element, cb);
  }

  publish(channel: string, message: string, cb: ICallback<number>): void {
    this.client.publish(channel, message, cb);
  }

  flushall(cb: ICallback<string>): void {
    this.client.flushall(cb);
  }

  loadScript(script: string, cb: ICallback<string>): void {
    this.client.script('LOAD', script, (err, data) => {
      if (err) return cb(err);
      if (!data) return cb(new CallbackEmptyReplyError());
      if (typeof data !== 'string') return cb(new RedisClientError());
      cb(null, data);
    });
  }

  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void {
    const arrArgs = Array.isArray(args)
      ? args.map((i) => String(i))
      : [String(args)];
    const [numKeys, ...keysAndArgs] = arrArgs;
    this.client.evalsha(hash, numKeys, keysAndArgs, cb);
  }

  get(key: string, cb: ICallback<string | null>): void {
    this.client.get(key, cb);
  }

  del(key: string | string[], cb: ICallback<number>): void {
    // Normalize key to always be an array of strings
    const keys = Array.isArray(key) ? key : [key];
    this.client.del(...keys, cb);
  }

  llen(key: string, cb: ICallback<number>): void {
    this.client.llen(key, cb);
  }

  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string | null>,
  ): void {
    if (!this.validateRedisVersion(6, 2)) {
      cb(
        new RedisClientError(
          'Command not supported by your Redis server. Minimal required Redis server version is 6.2.0.',
        ),
      );
    } else {
      if (from === 'LEFT' && to === 'RIGHT') {
        this.client.lmove(source, destination, from, to, cb);
      } else if (from === 'RIGHT' && to === 'LEFT') {
        this.client.lmove(source, destination, from, to, cb);
      } else {
        cb(
          new RedisClientError(
            'Invalid move direction. Use LEFT -> RIGHT or RIGHT -> LEFT.',
          ),
        );
      }
    }
  }

  zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void {
    this.client.zremrangebyscore(source, min, max, cb);
  }

  hmget(
    source: string,
    keys: string[],
    cb: ICallback<(string | null)[]>,
  ): void {
    this.client.hmget(source, ...keys, cb);
  }

  halt(cb: ICallback<void>): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.end();
    } else cb();
  }

  end(): void {
    if (!this.connectionClosed) {
      this.client.disconnect(false);
    }
  }

  shutdown(cb: ICallback<void> = () => void 0): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.client.quit();
    } else cb();
  }

  getInfo(cb: ICallback<string>): void {
    this.client.info(cb);
  }

  override on(event: string, listener: (...args: unknown[]) => unknown): this {
    this.client.on(event, listener);
    return this;
  }
}
