/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../async/index.js';
import { EventEmitter } from '../../event/index.js';
import { RedisClientError } from '../errors/index.js';

export * from './config.js';

export type TRedisClientEvent = {
  error: (err: Error) => void;
  ready: () => void;
  end: () => void;
  message: (channel: string, message: string) => void;
  pmessage: (pattern: string, channel: string, message: string) => void;
};

export interface IRedisClient extends EventEmitter<TRedisClientEvent> {
  // Server and Script Management
  validateRedisVersion(
    major: number,
    feature?: number,
    minor?: number,
  ): boolean;
  validateRedisServerSupport(cb: ICallback<void>): void;
  getInfo(cb: ICallback<string>): void;
  updateServerVersion(cb: ICallback<void>): void;
  loadBuiltInScriptFiles(cb: ICallback<void>): void;
  loadScriptFiles(
    scriptMap: Record<string, string | string[]>,
    cb: ICallback<Record<string, string>>,
  ): void;
  loadScript(script: string, cb: ICallback<string>): void;
  getScriptId(name: string): string | RedisClientError;
  runScript(
    scriptName: string,
    keys: (string | number)[],
    args: (string | number)[],
    cb: ICallback<unknown>,
  ): void;
  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void;

  // Connection Management
  ping(cb: ICallback<string>): void;
  halt(cb: ICallback<void>): void;
  end(flush: boolean): void;
  shutdown(cb: ICallback<void>): void;
  flushall(cb: ICallback<string>): void;

  // Pub/Sub
  psubscribe(pattern: string): void;
  punsubscribe(channel?: string): void;
  subscribe(channel: string): void;
  unsubscribe(channel?: string): void;
  publish(channel: string, message: string, cb: ICallback<number>): void;

  // Key/String Operations
  get(key: string, cb: ICallback<string | null>): void;
  set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void;
  del(key: string | string[], cb: ICallback<number>): void;
  mget(keys: string[], cb: ICallback<(string | null)[]>): void;
  incr(key: string, cb: ICallback<number>): void;
  decr(key: string, cb: ICallback<number>): void;
  incrby(key: string, increment: number, cb: ICallback<number>): void;
  decrby(key: string, decrement: number, cb: ICallback<number>): void;
  expire(key: string, seconds: number, cb: ICallback<number>): void;
  pexpire(key: string, milliseconds: number, cb: ICallback<number>): void;
  ttl(key: string, cb: ICallback<number>): void;
  pttl(key: string, cb: ICallback<number>): void;

  // Transaction
  multi(): IRedisTransaction;
  watch(args: string[], cb: ICallback<string>): void;
  unwatch(cb: ICallback<string>): void;

  // Hash Operations
  hgetall(key: string, cb: ICallback<Record<string, string>>): void;
  hscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; result: Record<string, string> }>,
  ): void;
  hscanAll(
    key: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<Record<string, string>>,
  ): void;
  hget(key: string, field: string, cb: ICallback<string | null>): void;
  hset(
    key: string,
    field: string,
    value: string | number,
    cb: ICallback<number>,
  ): void;
  hdel(key: string, fields: string | string[], cb: ICallback<number>): void;
  hkeys(key: string, cb: ICallback<string[]>): void;
  hlen(key: string, cb: ICallback<number>): void;
  hmget(source: string, keys: string[], cb: ICallback<(string | null)[]>): void;

  // List Operations
  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string | null>,
  ): void;
  rpoplpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void;
  lpoprpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void;
  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string | null>,
  ): void;
  lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void;
  lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void;
  lpush(key: string, elements: string | string[], cb: ICallback<number>): void;
  rpush(key: string, elements: string | string[], cb: ICallback<number>): void;
  lpop(key: string, cb: ICallback<string | null>): void;
  rpop(key: string, cb: ICallback<string | null>): void;
  ltrim(key: string, start: number, stop: number, cb: ICallback<string>): void;
  llen(key: string, cb: ICallback<number>): void;

  // Set Operations
  sismember(key: string, member: string, cb: ICallback<number>): void;
  smembers(key: string, cb: ICallback<string[]>): void;
  sscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void;
  sscanAll(
    key: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<string[]>,
  ): void;
  sadd(key: string, member: string, cb: ICallback<number>): void;
  srem(key: string, member: string, cb: ICallback<number>): void;
  scard(key: string, cb: ICallback<number>): void;

  // Sorted Set Operations
  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void;
  zcard(key: string, cb: ICallback<number>): void;
  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void;
  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void;
  zpoprpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void;
  zscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void;
  zrangebyscorewithscores(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<Record<string, string>>,
  ): void;
  zrem(source: string, id: string, cb: ICallback<number>): void;
  zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void;
  zcount(
    key: string,
    min: string | number,
    max: string | number,
    cb: ICallback<number>,
  ): void;
  zscore(key: string, member: string, cb: ICallback<string | null>): void;
}

export interface IRedisTransaction {
  // Read commands
  get(key: string): this;
  hget(key: string, field: string): this;
  smembers(key: string): this;
  hgetall(key: string): this;
  zcard(key: string): this;
  scard(key: string): this;
  llen(key: string): this;
  zscore(key: string, member: string): this;

  // Write commands
  del(key: string | string[]): this;
  lrem(key: string, count: number, element: string): this;
  lpop(key: string): this;
  rpush(key: string, element: string): this;
  rpop(key: string): this;
  lpush(key: string, element: string): this;
  hdel(key: string, field: string | string[]): this;
  srem(key: string, element: string | string[]): this;
  sadd(key: string, element: string): this;
  zrem(key: string, element: string | string[]): this;
  zadd(key: string, score: number, element: string): this;
  hset(key: string, field: string, value: string | number): this;
  ltrim(key: string, start: number, stop: number): this;
  rpoplpush(source: string, destination: string): this;

  // Numeric commands
  hincrby(key: string, field: string, by: number): this;
  incr(key: string): this;
  decr(key: string): this;
  incrby(key: string, increment: number): this;
  decrby(key: string, decrement: number): this;

  // Expiration commands
  pexpire(key: string, millis: number): this;
  expire(key: string, secs: number): this;

  // Execution
  exec(cb: ICallback<unknown[]>): void;
}

declare module 'ioredis' {
  export interface Commands {
    // Add missing method
    lmove(
      source: string,
      destination: string,
      from: 'LEFT' | 'RIGHT',
      to: 'LEFT' | 'RIGHT',
      cb: ICallback<string | null>,
    ): void;
  }
}
