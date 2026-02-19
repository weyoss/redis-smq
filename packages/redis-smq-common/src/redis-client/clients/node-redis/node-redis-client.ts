/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createClient, RedisClientOptions } from '@redis/client';
import { ICallback } from '../../../async/index.js';
import { RedisClientAbstract } from '../redis-client-abstract.js';
import { NodeRedisClientMulti } from './node-redis-client-multi.js';
import { CommandNotSupportedError } from '../../errors/index.js';

export class NodeRedisClient extends RedisClientAbstract {
  protected client;

  constructor(config: RedisClientOptions = {}) {
    super();
    this.client = createClient(config);
    this.client.once('ready', () => {
      this.connectionClosed = false;
      this.init();
    });
    this.client.once('end', () => {
      this.connectionClosed = true;
      this.emit('end');
    });
    this.client.connect();
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
    this.client
      .set(key, value, {
        ...(options.expire
          ? { [options.expire.mode]: options.expire.value }
          : {}),
        ...(options.exists ? { [options.exists]: true } : {}),
      })
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void {
    this.client
      .zAdd(key, { score, value: member })
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  multi(): NodeRedisClientMulti {
    return new NodeRedisClientMulti(this.client);
  }

  watch(args: string[], cb: ICallback<string>): void {
    this.client
      .watch(args)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  unwatch(cb: ICallback<string>): void {
    this.client
      .unwatch()
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  sismember(key: string, member: string, cb: ICallback<number>): void {
    this.client
      .sIsMember(key, member)
      .then((reply) => cb(null, Number(reply)))
      .catch(cb);
  }

  zcard(key: string, cb: ICallback<number>): void {
    this.client
      .zCard(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void {
    this.client
      .zRange(key, min, max)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void {
    this.client
      .zRange(key, min, max, { REV: true })
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zrem(source: string, id: string, cb: ICallback<number>): void {
    this.client
      .zRem(source, id)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  psubscribe(pattern: string): void {
    this.client.pSubscribe(pattern, (message, channel) => {
      this.client.emit('pmessage', pattern, channel, message);
    });
  }

  punsubscribe(channel?: string): void {
    this.client.pUnsubscribe(channel).catch(() => void 0);
  }

  subscribe(channel: string): void {
    this.client.subscribe(channel, (message, channel) => {
      this.client.emit('message', channel, message);
    });
  }

  unsubscribe(channel?: string): void {
    this.client.unsubscribe(channel).catch(() => void 0);
  }

  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void {
    this.client
      .zRangeByScore(key, min, max, {
        LIMIT: {
          offset,
          count,
        },
      })
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  smembers(key: string, cb: ICallback<string[]>): void {
    this.client
      .sMembers(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  override sscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void {
    this.client
      .sScan(key, cursor, options)
      .then(({ cursor, members }) => {
        cb(null, { cursor, items: members });
      })
      .catch(cb);
  }

  override zscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void {
    this.client
      .zScan(key, cursor, options)
      .then(({ cursor, members }) => {
        const result = new Set<string>();
        for (const i of members) {
          result.add(i.value);
        }
        cb(null, { cursor, items: [...result] });
      })
      .catch(cb);
  }

  sadd(key: string, member: string, cb: ICallback<number>): void {
    this.client
      .sAdd(key, member)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  srem(key: string, member: string, cb: ICallback<number>): void {
    this.client
      .sRem(key, member)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  hgetall(key: string, cb: ICallback<Record<string, string>>): void {
    this.client
      .hGetAll(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  scard(key: string, cb: ICallback<number>): void {
    this.client
      .sCard(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  override hscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; result: Record<string, string> }>,
  ): void {
    this.client
      .hScan(key, cursor, options)
      .then(({ cursor, entries }) => {
        const result: Record<string, string> = {};
        for (const item of entries) {
          result[item.field] = item.value;
        }
        cb(null, { cursor, result });
      })
      .catch(cb);
  }

  hget(key: string, field: string, cb: ICallback<string | null>): void {
    this.client
      .hGet(key, field)
      .then((reply) => cb(null, reply ?? null))
      .catch(cb);
  }

  hset(
    key: string,
    field: string,
    value: string | number,
    cb: ICallback<number>,
  ): void {
    this.client
      .hSet(key, field, value)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  hdel(key: string, fields: string | string[], cb: ICallback<number>): void {
    this.client
      .hDel(key, fields)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void {
    this.client
      .lRange(key, start, stop)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  hkeys(key: string, cb: ICallback<string[]>): void {
    this.client
      .hKeys(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  hlen(key: string, cb: ICallback<number>): void {
    this.client
      .hLen(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string | null>,
  ): void {
    this.client
      .brPopLPush(source, destination, timeout)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  rpoplpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void {
    this.client
      .rPopLPush(source, destination)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zrangebyscorewithscores(
    source: string,
    min: number,
    max: number,
    cb: ICallback<Record<string, string>>,
  ): void {
    this.client
      .zRangeByScoreWithScores(source, min, max)
      .then((reply) => {
        const range: Record<string, string> = {};
        for (const { score, value } of reply) {
          range[score] = value;
        }
        cb(null, range);
      })
      .catch(cb);
  }

  rpop(key: string, cb: ICallback<string | null>): void {
    this.client
      .rPop(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void {
    this.client
      .lRem(key, count, element)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  override lindex(key: string, index: number, cb: ICallback<string | null>) {
    this.client
      .lIndex(key, index)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  publish(channel: string, message: string, cb: ICallback<number>): void {
    this.client
      .publish(channel, message)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  flushall(cb: ICallback<string>): void {
    this.client
      .flushAll()
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  loadScript(script: string, cb: ICallback<string>): void {
    this.client
      .scriptLoad(script)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void {
    const arrArgs = (Array.isArray(args) ? args : [args]).map(String);
    const numKeys = Number(arrArgs[0]);
    const keys = arrArgs.slice(1, numKeys + 1);
    const scriptArgs = arrArgs.slice(numKeys + 1);
    this.client
      .evalSha(hash, {
        keys,
        arguments: scriptArgs,
      })
      .then((reply) => {
        if (Array.isArray(reply)) {
          cb(
            null,
            reply.map((i) => (i instanceof Buffer ? i.toString() : i)),
          );
        } else if (reply instanceof Buffer) cb(null, reply.toString());
        else cb(null, reply);
      })
      .catch(cb);
  }

  get(key: string, cb: ICallback<string | null>): void {
    this.client
      .get(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  del(key: string | string[], cb: ICallback<number>): void {
    this.client
      .del(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  llen(key: string, cb: ICallback<number>): void {
    this.client
      .lLen(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
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
        new CommandNotSupportedError({
          metadata: {
            command: 'lmove',
          },
        }),
      );
    } else {
      this.client
        .lMove(source, destination, from, to)
        .then((reply) => cb(null, reply))
        .catch(cb);
    }
  }

  zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void {
    this.client
      .zRemRangeByScore(source, min, max)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  hmget(
    source: string,
    keys: string[],
    cb: ICallback<(string | null)[]>,
  ): void {
    this.client
      .hmGet(source, keys)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  halt(cb: ICallback<void>): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.end();
    } else cb();
  }

  end(): void {
    if (!this.connectionClosed) {
      this.client.disconnect().catch(() => void 0);
    }
  }

  shutdown(cb: ICallback<void> = () => void 0): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.client.quit().catch(() => void 0);
    } else cb();
  }

  getInfo(cb: ICallback<string>): void {
    this.client
      .info()
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  override on(event: string, listener: (...args: unknown[]) => unknown): this {
    this.client.on(event, listener);
    return this;
  }

  // -- start new methods

  ping(cb: ICallback<string>): void {
    this.client
      .ping()
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  mget(keys: string[], cb: ICallback<(string | null)[]>): void {
    this.client
      .mGet(keys)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  incr(key: string, cb: ICallback<number>): void {
    this.client
      .incr(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  decr(key: string, cb: ICallback<number>): void {
    this.client
      .decr(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  incrby(key: string, increment: number, cb: ICallback<number>): void {
    this.client
      .incrBy(key, increment)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  decrby(key: string, decrement: number, cb: ICallback<number>): void {
    this.client
      .decrBy(key, decrement)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  expire(key: string, seconds: number, cb: ICallback<number>): void {
    this.client
      .expire(key, seconds)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  pexpire(key: string, milliseconds: number, cb: ICallback<number>): void {
    this.client
      .pExpire(key, milliseconds)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }
  ttl(key: string, cb: ICallback<number>): void {
    this.client
      .ttl(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  pttl(key: string, cb: ICallback<number>): void {
    this.client
      .pTTL(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  lpush(key: string, elements: string | string[], cb: ICallback<number>): void {
    this.client
      .lPush(key, elements)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  rpush(key: string, elements: string | string[], cb: ICallback<number>): void {
    this.client
      .rPush(key, elements)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  lpop(key: string, cb: ICallback<string | null>): void {
    this.client
      .lPop(key)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  ltrim(key: string, start: number, stop: number, cb: ICallback<string>): void {
    this.client
      .lTrim(key, start, stop)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zcount(
    key: string,
    min: string | number,
    max: string | number,
    cb: ICallback<number>,
  ): void {
    this.client
      .zCount(key, min, max)
      .then((reply) => cb(null, reply))
      .catch(cb);
  }

  zscore(key: string, member: string, cb: ICallback<string | null>): void {
    this.client
      .zScore(key, member)
      .then((reply) => cb(null, reply !== null ? String(reply) : null))
      .catch(cb);
  }

  // -- end new methods
}
