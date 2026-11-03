/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Redis, RedisOptions } from 'ioredis';
import { ICallback } from '../../../async/index.js';
import {
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  InvalidArgumentsError,
} from '../../../errors/index.js';
import { RedisClientAbstract } from '../redis-client-abstract.js';
import { IoredisClientMulti } from './ioredis-client-multi.js';
import { CommandNotSupportedError } from '../../errors/index.js';

export class IoredisClient extends RedisClientAbstract {
  protected client: Redis;

  /**
   * True while a `halt()` / `shutdown()` / `end()` is in flight. Used to
   * queue concurrent callers instead of racing them — a second `halt()`
   * while the first is closing must not double-register an `'end'`
   * listener (which would leave one caller's callback permanently
   * unresolved).
   */
  private closing = false;

  /**
   * Callbacks waiting for the in-flight close to complete. Drained in
   * `finishClose()`, where each is invoked exactly once.
   */
  private pendingCloseCallbacks: ICallback<void>[] = [];

  constructor(config: RedisOptions = {}) {
    super();
    this.client = new Redis(config);
    this.attachRawClient(this.client);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Connection lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Forceful close — closes the socket immediately without sending QUIT
   * and without waiting for server acknowledgement. Faster than
   * `shutdown()`, but in-flight commands are abandoned.
   *
   * Safe under concurrent calls: the first call starts the close, all
   * subsequent calls queue and fire when the shared close completes.
   */
  halt(cb: ICallback<void>): void {
    this.closeInternal(cb, true);
  }

  /**
   * Graceful close — sends QUIT and waits for the server to acknowledge
   * before closing the socket. In-flight commands complete; new commands
   * are rejected by the server-side close.
   *
   * Safe under concurrent calls: same queueing behavior as `halt()`.
   */
  shutdown(cb: ICallback<void> = () => void 0): void {
    this.closeInternal(cb, false);
  }

  /**
   * Fire-and-forget forceful close. `flush` is preserved for API
   * compatibility with `IRedisClient`; ioredis always uses `disconnect(false)`
   * here (no flush), matching the original `end()` semantics.
   */
  // eslint-disable-next-line
  end(_flush?: boolean): void {
    this.closeInternal(() => void 0, true);
  }

  private closeInternal(cb: ICallback<void>, force: boolean): void {
    if (this.connectionClosed) return cb();
    if (this.closing) {
      this.pendingCloseCallbacks.push(cb);
      return;
    }

    this.closing = true;
    this.pendingCloseCallbacks.push(cb);

    const finish = (err: Error | null): void => {
      this.closing = false;
      this.connectionClosed = true;
      const callbacks = this.pendingCloseCallbacks.splice(0);
      for (const callback of callbacks) {
        try {
          callback(err);
        } catch {
          // A caller's callback throwing must not block other callers.
        }
      }
    };

    try {
      if (force) {
        this.client.once('end', () => finish(null));
        this.client.disconnect(false);
      } else {
        this.client.quit().then(
          () => finish(null),
          (reason) =>
            finish(
              reason instanceof Error ? reason : new Error(String(reason)),
            ),
        );
      }
    } catch (reason) {
      finish(reason instanceof Error ? reason : new Error(String(reason)));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Commands
  // ═══════════════════════════════════════════════════════════════════════

  ping(cb: ICallback<string>): void {
    this.client.ping(cb);
  }

  exists(key: string, cb: ICallback<boolean>) {
    this.client.exists(key, (err, reply) => {
      if (err) return cb(err);
      cb(null, Boolean(reply));
    });
  }

  mget(keys: string[], cb: ICallback<(string | null)[]>): void {
    this.client.mget(...keys, cb);
  }

  incr(key: string, cb: ICallback<number>): void {
    this.client.incr(key, cb);
  }

  decr(key: string, cb: ICallback<number>): void {
    this.client.decr(key, cb);
  }

  incrby(key: string, increment: number, cb: ICallback<number>): void {
    this.client.incrby(key, increment, cb);
  }

  decrby(key: string, decrement: number, cb: ICallback<number>): void {
    this.client.decrby(key, decrement, cb);
  }

  expire(key: string, seconds: number, cb: ICallback<number>): void {
    this.client.expire(key, seconds, cb);
  }

  pexpire(key: string, milliseconds: number, cb: ICallback<number>): void {
    this.client.pexpire(key, milliseconds, cb);
  }

  ttl(key: string, cb: ICallback<number>): void {
    this.client.ttl(key, cb);
  }

  pttl(key: string, cb: ICallback<number>): void {
    this.client.pttl(key, cb);
  }

  lpush(key: string, elements: string | string[], cb: ICallback<number>): void {
    const args = Array.isArray(elements) ? elements : [elements];
    this.client.lpush(key, ...args, cb);
  }

  rpush(key: string, elements: string | string[], cb: ICallback<number>): void {
    const args = Array.isArray(elements) ? elements : [elements];
    this.client.rpush(key, ...args, cb);
  }

  lpop(key: string, cb: ICallback<string | null>): void {
    this.client.lpop(key, cb);
  }

  ltrim(key: string, start: number, stop: number, cb: ICallback<string>): void {
    this.client.ltrim(key, start, stop, cb);
  }

  override lindex(key: string, index: number, cb: ICallback<string | null>) {
    this.client.lindex(key, index, cb);
  }

  zcount(
    key: string,
    min: string | number,
    max: string | number,
    cb: ICallback<number>,
  ): void {
    this.client.zcount(key, min, max, cb);
  }

  zscore(key: string, member: string, cb: ICallback<string | null>): void {
    this.client.zscore(key, member, cb);
  }

  /**
   * SET with EX|PX and/or NX|XX.
   *
   * ioredis's `set` overloads require **literal** `'EX' | 'PX'` and
   * **literal** `'NX' | 'XX'` at each argument position. A union type
   * (`'EX' | 'PX'`) doesn't satisfy any single overload, so dispatching on
   * the literal value is the only way to preserve strong typing without
   * a cast.
   *
   * Argument order matches the original implementation
   * (`EX|PX` before `NX|XX`) so the wire bytes are identical to the
   * pre-refactor version.
   */
  set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void {
    const { expire, exists } = options;
    if (expire && expire.mode === 'EX') {
      if (exists === 'NX')
        this.client.set(key, value, 'EX', expire.value, 'NX', cb);
      else if (exists === 'XX')
        this.client.set(key, value, 'EX', expire.value, 'XX', cb);
      else this.client.set(key, value, 'EX', expire.value, cb);
    } else if (expire) {
      // expire.mode is 'PX' here
      if (exists === 'NX')
        this.client.set(key, value, 'PX', expire.value, 'NX', cb);
      else if (exists === 'XX')
        this.client.set(key, value, 'PX', expire.value, 'XX', cb);
      else this.client.set(key, value, 'PX', expire.value, cb);
    } else if (exists === 'NX') {
      this.client.set(key, value, 'NX', cb);
    } else if (exists === 'XX') {
      this.client.set(key, value, 'XX', cb);
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
      const [resultCursor, items] = reply ?? [];
      if (!resultCursor || !items) return cb(new CallbackEmptyReplyError());
      cb(null, { cursor: resultCursor, items });
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
      if (err) return cb(err);
      if (!reply) return cb(new CallbackEmptyReplyError());
      // Reply shape: [member1, score1, member2, score2, ...]
      // Indexed access — the original mutated the SDK reply via shift().
      const [resultCursor, items] = reply;
      const result = new Set<string>();
      for (let i = 0; i < items.length; i += 2) {
        const item = items[i];
        if (item === undefined) continue;
        result.add(String(item));
      }
      cb(null, { cursor: resultCursor, items: [...result] });
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

  scard(key: string, cb: ICallback<number>) {
    this.client.scard(key, cb);
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
      const [resultCursor, items] = reply ?? [];
      if (!resultCursor || !items) return cb(new CallbackEmptyReplyError());
      // Reply shape: [field1, value1, field2, value2, ...]
      // Indexed access — the original mutated via shift().
      const result: Record<string, string> = {};
      for (let i = 0; i < items.length; i += 2) {
        const field = items[i];
        const value = items[i + 1];
        if (field === undefined || value === undefined) continue;
        result[field] = value;
      }
      cb(null, { cursor: resultCursor, result });
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

  /**
   * ZRANGEBYSCORE ... WITHSCORES → Record<score, member>.
   *
   * `min` / `max` widened to `number | string` to match `IRedisClient`.
   *
   * Indexed access instead of `splice(0, 2)` — the original mutated the
   * SDK reply array, which breaks any future caller that needs the raw
   * reply (logging, snapshot tests).
   */
  zrangebyscorewithscores(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<Record<string, string>>,
  ): void {
    this.client.zrangebyscore(source, min, max, 'WITHSCORES', (err, reply) => {
      if (err) return cb(err);
      // Reply shape: [member1, score1, member2, score2, ...]
      const replyRange = reply ?? [];
      const range: Record<string, string> = {};
      for (let i = 0; i < replyRange.length; i += 2) {
        const member = replyRange[i];
        const score = replyRange[i + 1];
        if (member === undefined || score === undefined) continue;
        range[score] = member;
      }
      cb(null, range);
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
      if (typeof data !== 'string') return cb(new CallbackInvalidReplyError());
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
      cb(new CommandNotSupportedError({ metadata: { command: 'lmove' } }));
    } else {
      if (from === 'LEFT' && to === 'RIGHT') {
        this.client.lmove(source, destination, from, to, cb);
      } else if (from === 'RIGHT' && to === 'LEFT') {
        this.client.lmove(source, destination, from, to, cb);
      } else {
        cb(
          new InvalidArgumentsError({
            message:
              'Invalid move direction. Use LEFT -> RIGHT or RIGHT -> LEFT.',
          }),
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

  getInfo(cb: ICallback<string>): void {
    this.client.info(cb);
  }
}
