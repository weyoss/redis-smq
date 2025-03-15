/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../common/index.js';
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
  validateRedisVersion(
    major: number,
    feature?: number,
    minor?: number,
  ): boolean;

  validateRedisServerSupport(cb: ICallback<void>): void;

  set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void;

  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void;

  multi(): IRedisTransaction;

  watch(args: string[], cb: ICallback<string>): void;

  unwatch(cb: ICallback<string>): void;

  sismember(key: string, member: string, cb: ICallback<number>): void;

  zcard(key: string, cb: ICallback<number>): void;

  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void;

  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;

  psubscribe(pattern: string): void;

  punsubscribe(channel?: string): void;

  subscribe(channel: string): void;

  unsubscribe(channel?: string): void;

  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void;

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

  lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void;

  hkeys(key: string, cb: ICallback<string[]>): void;

  hlen(key: string, cb: ICallback<number>): void;

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

  lpoprpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void;

  zrangebyscorewithscores(
    source: string,
    min: number,
    max: number,
    cb: ICallback<Record<string, string>>,
  ): void;

  zrem(source: string, id: string, cb: ICallback<number>): void;

  rpop(key: string, cb: ICallback<string | null>): void;

  lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void;

  publish(channel: string, message: string, cb: ICallback<number>): void;

  flushall(cb: ICallback<string>): void;

  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void;

  get(key: string, cb: ICallback<string | null>): void;

  del(key: string | string[], cb: ICallback<number>): void;

  llen(key: string, cb: ICallback<number>): void;

  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string | null>,
  ): void;

  zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void;

  hmget(source: string, keys: string[], cb: ICallback<(string | null)[]>): void;

  halt(cb: ICallback<void>): void;

  end(flush: boolean): void;

  shutdown(cb: ICallback<void>): void;

  getInfo(cb: ICallback<string>): void;

  updateServerVersion(cb: ICallback<void>): void;

  loadBuiltInScriptFiles(cb: ICallback<void>): void;

  loadScriptFiles(
    scriptMap: Record<string, string>,
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
}

export interface IRedisTransaction {
  lrem(key: string, count: number, element: string): this;

  lpop(key: string): this;

  rpush(key: string, element: string): this;

  rpop(key: string): this;

  lpush(key: string, element: string): this;

  hdel(key: string, field: string | string[]): this;

  hincrby(key: string, field: string, by: number): this;

  del(key: string | string[]): this;

  srem(key: string, element: string | string[]): this;

  sadd(key: string, element: string): this;

  zrem(key: string, element: string | string[]): this;

  zadd(key: string, score: number, element: string): this;

  hset(key: string, field: string, value: string | number): this;

  pexpire(key: string, millis: number): this;

  expire(key: string, secs: number): this;

  ltrim(key: string, start: number, stop: number): this;

  rpoplpush(source: string, destination: string): this;

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
      cb: ICallback<string>,
    ): void;
  }
}
