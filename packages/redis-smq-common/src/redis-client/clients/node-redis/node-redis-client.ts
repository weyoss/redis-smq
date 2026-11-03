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
import { InvalidArgumentsError } from '../../../errors/index.js';
import { RedisClientAbstract } from '../redis-client-abstract.js';
import { NodeRedisClientMulti } from './node-redis-client-multi.js';
import { CommandNotSupportedError } from '../../errors/index.js';

export class NodeRedisClient extends RedisClientAbstract {
  protected client;

  /**
   * True while a halt/shutdown/end is in flight. Used to queue concurrent
   * callers instead of racing them — a second `halt()` during a close must
   * not double-register with the raw client (which would leave one
   * caller's callback permanently unresolved).
   */
  private closing = false;

  /**
   * Callbacks waiting for the in-flight close to complete. Drained in
   * `finishClose()`, where each is invoked exactly once.
   */
  private pendingCloseCallbacks: ICallback<void>[] = [];

  constructor(config: RedisClientOptions = {}) {
    super();
    this.client = createClient(config);

    // Wire the raw client's lifecycle (error/ready/end) to this wrapper.
    // Pub/sub is deliberately NOT forwarded here: node-redis delivers
    // messages via per-channel subscription callbacks, not client events.
    // `subscribe()` / `psubscribe()` below bridge those callbacks directly
    // to `this.emit('message', …)` / `this.emit('pmessage', …)`, which
    // makes `on` / `once` / `removeListener` all behave uniformly on the
    // wrapper's own emitter — the fix for the original `on()` override
    // asymmetry.
    this.attachRawClient(this.client);

    // node-redis is lazy: createClient() builds the object but does not
    // open the socket. connect() starts the connection attempt. It returns
    // a Promise that rejects if the reconnect strategy gives up — the
    // 'error' event (forwarded by attachRawClient) is the authoritative
    // failure signal, so we swallow the rejection to avoid an unhandled
    // promise.
    this.client.connect().catch(() => void 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Connection lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Forceful close — closes the socket immediately without sending QUIT
   * and without waiting for server acknowledgement.
   */
  halt(cb: ICallback<void>): void {
    this.closeInternal(cb, true);
  }

  /**
   * Graceful close — sends QUIT and waits for the server to acknowledge
   * before closing the socket.
   */
  shutdown(cb: ICallback<void> = () => void 0): void {
    this.closeInternal(cb, false);
  }

  /**
   * Fire-and-forget forceful close. `flush` is preserved for API
   * compatibility with `IRedisClient`; node-redis always uses
   * `disconnect()` here (no flush), matching the original `end()` semantics.
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
      const promise = force ? this.client.disconnect() : this.client.quit();
      promise.then(
        () => finish(null),
        (reason) =>
          finish(reason instanceof Error ? reason : new Error(String(reason))),
      );
    } catch (reason) {
      finish(reason instanceof Error ? reason : new Error(String(reason)));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Commands
  // ═══════════════════════════════════════════════════════════════════════

  exists(key: string, cb: ICallback<boolean>) {
    this.client
      .exists(key)
      .then((reply) => cb(null, Boolean(reply)))
      .catch(cb);
  }

  /**
   * SET with EX|PX and/or NX|XX.
   *
   * Node-redis uses an options object (not variadic args), so we build a
   * typed `{ EX?, PX?, NX?, XX? }` and let the SDK handle each field.
   * The explicit `if` branches are required because assigning a dynamic
   * key (`opts[options.expire.mode] = …`) loses type safety on the
   * NX/XX `true` literal.
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
    const setOptions: {
      EX?: number;
      PX?: number;
      NX?: true;
      XX?: true;
    } = {};
    if (options.expire) {
      if (options.expire.mode === 'EX') setOptions.EX = options.expire.value;
      else setOptions.PX = options.expire.value;
    }
    if (options.exists === 'NX') setOptions.NX = true;
    else if (options.exists === 'XX') setOptions.XX = true;

    this.client
      .set(key, value, setOptions)
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

  /**
   * node-redis's `subscribe` accepts a per-channel callback. Bridge it
   * directly to the wrapper's own emitter so `on` / `once` /
   * `removeListener` all fire uniformly. This replaces the original
   * `this.client.emit('message', …)` workaround, which only worked in
   * combination with the (now-removed) `on()` override.
   */
  subscribe(channel: string): void {
    this.client
      .subscribe(channel, (message) => {
        this.emit('message', channel, message);
      })
      .catch(() => void 0);
  }

  unsubscribe(channel?: string): void {
    this.client.unsubscribe(channel).catch(() => void 0);
  }

  psubscribe(pattern: string): void {
    this.client
      .pSubscribe(pattern, (message, channel) => {
        this.emit('pmessage', pattern, channel, message);
      })
      .catch(() => void 0);
  }

  punsubscribe(channel?: string): void {
    this.client.pUnsubscribe(channel).catch(() => void 0);
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
      .then(({ cursor: resultCursor, members }) => {
        cb(null, { cursor: resultCursor, items: members });
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
      .then(({ cursor: resultCursor, members }) => {
        // Iterate without mutating the SDK reply.
        const result = new Set<string>();
        for (const entry of members) {
          result.add(entry.value);
        }
        cb(null, { cursor: resultCursor, items: [...result] });
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
      .then(({ cursor: resultCursor, entries }) => {
        // Iterate without mutating the SDK reply.
        const result: Record<string, string> = {};
        for (const entry of entries) {
          result[entry.field] = entry.value;
        }
        cb(null, { cursor: resultCursor, result });
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

  /**
   * ZRANGEBYSCORE ... WITHSCORES → Record<score, member>.
   *
   * `min` / `max` widened to `number | string` to match `IRedisClient`
   * (the original signature was narrower than the interface, which
   * rejected `'-inf'` / `'+inf'` at the class-type level). The SDK reply
   * is iterated, not mutated.
   */
  zrangebyscorewithscores(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<Record<string, string>>,
  ): void {
    this.client
      .zRangeByScoreWithScores(source, min, max)
      .then((reply) => {
        const range: Record<string, string> = {};
        for (const entry of reply) {
          range[entry.score] = entry.value;
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

  /**
   * LMOVE with the same validation as `IoredisClient`:
   *   - Version gate → `CommandNotSupportedError` below 6.2.
   *   - Direction gate → `InvalidArgumentsError` for LEFT→LEFT /
   *     RIGHT→RIGHT.
   */
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
      return;
    }
    if (!(
      (from === 'LEFT' && to === 'RIGHT') ||
      (from === 'RIGHT' && to === 'LEFT')
    )) {
      cb(
        new InvalidArgumentsError({
          message:
            'Invalid move direction. Use LEFT -> RIGHT or RIGHT -> LEFT.',
        }),
      );
      return;
    }
    this.client
      .lMove(source, destination, from, to)
      .then((reply) => cb(null, reply))
      .catch(cb);
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

  getInfo(cb: ICallback<string>): void {
    this.client
      .info()
      .then((reply) => cb(null, reply))
      .catch(cb);
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
}
