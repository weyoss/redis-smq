/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import fs from 'fs';
import { resolve } from 'path';
import { async } from '../../async/index.js';
import { ICallback } from '../../async/index.js';
import { env } from '../../env/index.js';
import { CallbackEmptyReplyError, PanicError } from '../../errors/index.js';
import { EventEmitter } from '../../event/index.js';
import {
  IRedisClient,
  IRedisTransaction,
  TRedisClientEvent,
} from '../types/index.js';
import {
  UnknownRedisServerVersionError,
  UnsupportedRedisServerVersionError,
} from '../errors/index.js';

const dir = env.getCurrentDir();

export enum ELuaScriptName {
  LPOPRPUSH = 'LPOPRPUSH',
  ZPOPRPUSH = 'ZPOPRPUSH',
}

const luaScriptMap = {
  [ELuaScriptName.LPOPRPUSH]: resolve(dir, '../lua-scripts/lpoprpush.lua'),
  [ELuaScriptName.ZPOPRPUSH]: resolve(dir, '../lua-scripts/zpoprpush.lua'),
};

const minimalSupportedVersion: [number, number, number] = [4, 0, 0];

export abstract class RedisClientAbstract
  extends EventEmitter<TRedisClientEvent>
  implements IRedisClient
{
  protected static scripts: Record<string, string> = {};
  protected static redisServerVersion: number[] | null = null;
  protected connectionClosed = true;

  protected init(): void {
    async.series(
      [
        (cb: ICallback) => this.validateRedisServerSupport(cb),
        (cb: ICallback) => this.loadBuiltInScriptFiles(cb),
      ],
      (err) => {
        if (err) this.emit('error', err);
        else this.emit('ready');
      },
    );
  }

  validateRedisVersion(major: number, feature = 0, minor = 0): boolean {
    if (!RedisClientAbstract.redisServerVersion) {
      this.emit('error', new UnknownRedisServerVersionError());
      return false;
    }
    return (
      RedisClientAbstract.redisServerVersion[0] > major ||
      (RedisClientAbstract.redisServerVersion[0] === major &&
        RedisClientAbstract.redisServerVersion[1] >= feature &&
        RedisClientAbstract.redisServerVersion[2] >= minor)
    );
  }

  validateRedisServerSupport(cb: ICallback): void {
    const validate = (cb: ICallback) => {
      const [major, feature, minor] = minimalSupportedVersion;
      if (!this.validateRedisVersion(major, feature, minor))
        cb(new UnsupportedRedisServerVersionError());
      else cb();
    };
    if (!RedisClientAbstract.redisServerVersion) {
      this.updateServerVersion((err) => {
        if (err) cb(err);
        else validate(cb);
      });
    } else validate(cb);
  }

  abstract ping(cb: ICallback<string>): void;

  abstract mget(keys: string[], cb: ICallback<(string | null)[]>): void;

  abstract incr(key: string, cb: ICallback<number>): void;

  abstract decr(key: string, cb: ICallback<number>): void;

  abstract incrby(key: string, increment: number, cb: ICallback<number>): void;

  abstract decrby(key: string, decrement: number, cb: ICallback<number>): void;

  abstract expire(key: string, seconds: number, cb: ICallback<number>): void;

  abstract pexpire(
    key: string,
    milliseconds: number,
    cb: ICallback<number>,
  ): void;

  abstract ttl(key: string, cb: ICallback<number>): void;

  abstract pttl(key: string, cb: ICallback<number>): void;

  abstract lpush(
    key: string,
    elements: string | string[],
    cb: ICallback<number>,
  ): void;

  abstract rpush(
    key: string,
    elements: string | string[],
    cb: ICallback<number>,
  ): void;

  abstract lpop(key: string, cb: ICallback<string | null>): void;

  abstract ltrim(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string>,
  ): void;

  abstract zcount(
    key: string,
    min: string | number,
    max: string | number,
    cb: ICallback<number>,
  ): void;

  abstract zscore(
    key: string,
    member: string,
    cb: ICallback<string | null>,
  ): void;

  abstract set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void;

  abstract zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void;

  abstract multi(): IRedisTransaction;

  abstract watch(args: string[], cb: ICallback<string>): void;

  abstract unwatch(cb: ICallback<string>): void;

  abstract sismember(key: string, member: string, cb: ICallback<number>): void;

  abstract zcard(key: string, cb: ICallback<number>): void;

  abstract zrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;

  abstract zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;

  abstract psubscribe(pattern: string): void;

  abstract punsubscribe(channel?: string): void;

  abstract subscribe(channel: string): void;

  abstract unsubscribe(channel?: string): void;

  abstract zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void;

  abstract smembers(key: string, cb: ICallback<string[]>): void;

  abstract sscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void;

  sscanAll(
    key: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<string[]>,
  ): void {
    const result = new Set<string>();
    const iterate = (cursor: string) => {
      this.sscan(key, cursor, options, (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(new CallbackEmptyReplyError());
        else {
          reply.items.forEach((i) => result.add(i));
          if (reply.cursor === '0') cb(null, [...result]);
          else iterate(reply.cursor);
        }
      });
    };
    iterate('0');
  }

  abstract sadd(key: string, member: string, cb: ICallback<number>): void;

  abstract srem(key: string, member: string, cb: ICallback<number>): void;

  abstract scard(key: string, cb: ICallback<number>): void;

  abstract hgetall(key: string, cb: ICallback<Record<string, string>>): void;

  abstract hscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; result: Record<string, string> }>,
  ): void;

  hscanAll(
    key: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<Record<string, string>>,
  ): void {
    const result: Record<string, string> = {};
    const iterate = (cursor: string) => {
      this.hscan(key, cursor, options, (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(new CallbackEmptyReplyError());
        else {
          Object.assign(result, reply.result);
          if (reply.cursor === '0') cb(null, result);
          else iterate(reply.cursor);
        }
      });
    };
    iterate('0');
  }

  abstract hget(key: string, field: string, cb: ICallback<string | null>): void;

  abstract hset(
    key: string,
    field: string,
    value: string | number,
    cb: ICallback<number>,
  ): void;

  abstract hdel(
    key: string,
    fields: string | string[],
    cb: ICallback<number>,
  ): void;

  abstract lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void;

  abstract hkeys(key: string, cb: ICallback<string[]>): void;

  abstract hlen(key: string, cb: ICallback<number>): void;

  abstract brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string | null>,
  ): void;

  abstract rpoplpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void;

  zpoprpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void {
    this.runScript(
      ELuaScriptName.ZPOPRPUSH,
      [source, destination],
      [],
      (err, res?: unknown) => {
        if (err) cb(err);
        else cb(null, typeof res === 'string' ? res : null);
      },
    );
  }

  abstract zscan(
    key: string,
    cursor: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<{ cursor: string; items: string[] }>,
  ): void;

  lpoprpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void {
    if (this.validateRedisVersion(6, 2)) {
      this.lmove(source, destination, 'LEFT', 'RIGHT', cb);
    } else {
      this.runScript(
        ELuaScriptName.LPOPRPUSH,
        [source, destination],
        [],
        (err, res?: unknown) => {
          if (err) cb(err);
          else cb(null, typeof res === 'string' ? res : null);
        },
      );
    }
  }

  abstract zrangebyscorewithscores(
    source: string,
    min: number,
    max: number,
    cb: ICallback<Record<string, string>>,
  ): void;

  abstract zrem(source: string, id: string, cb: ICallback<number>): void;

  abstract rpop(key: string, cb: ICallback<string | null>): void;

  abstract lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void;

  abstract publish(
    channel: string,
    message: string,
    cb: ICallback<number>,
  ): void;

  abstract flushall(cb: ICallback<string>): void;

  abstract loadScript(script: string, cb: ICallback<string>): void;

  abstract evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void;

  abstract get(key: string, cb: ICallback<string | null>): void;

  abstract del(key: string | string[], cb: ICallback<number>): void;

  abstract llen(key: string, cb: ICallback<number>): void;

  abstract lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string | null>,
  ): void;

  abstract zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void;

  abstract hmget(
    source: string,
    keys: string[],
    cb: ICallback<(string | null)[]>,
  ): void;

  abstract halt(cb: ICallback): void;

  abstract end(flush: boolean): void;

  abstract shutdown(cb: ICallback): void;

  abstract getInfo(cb: ICallback<string>): void;

  updateServerVersion(cb: ICallback): void {
    if (!RedisClientAbstract.redisServerVersion) {
      this.getInfo((err, res) => {
        if (err) cb(err);
        else if (!res) cb(new CallbackEmptyReplyError());
        else {
          RedisClientAbstract.redisServerVersion = res
            .split('\r\n')[1]
            .split(':')[1]
            .split('.')
            .map((i) => Number(i));
          cb();
        }
      });
    } else cb();
  }

  loadBuiltInScriptFiles(cb: ICallback): void {
    this.loadScriptFiles(luaScriptMap, (err) => cb(err));
  }

  loadScriptFiles(
    scriptMap: Record<string, string | string[]>,
    cb: ICallback<Record<string, string>>,
  ): void {
    const scriptsToLoad: Record<string, string | string[]> = {};
    const loadedScripts: Record<string, string> = {};

    // Step 1: Segregate already loaded scripts from those that need loading.
    for (const name in scriptMap) {
      const sha = RedisClientAbstract.scripts[name];
      if (sha) {
        loadedScripts[name] = sha;
      } else {
        scriptsToLoad[name] = scriptMap[name];
      }
    }

    // If all scripts are already cached, return immediately.
    if (Object.keys(scriptsToLoad).length === 0) {
      return cb(null, loadedScripts);
    }

    // Step 2: Load the remaining scripts in parallel.
    async.eachIn(
      scriptsToLoad,
      (scripts, name, taskCallback) => {
        const scriptsArr = Array.isArray(scripts) ? scripts : [scripts];

        // Step 2a: Read and combine all file parts for a single script.
        async.map<string, string>(
          scriptsArr,
          (file, mapCallback) => fs.readFile(file, 'utf8', mapCallback),
          10,
          (err, contents) => {
            if (err) return taskCallback(err);
            if (!contents) return cb(new CallbackEmptyReplyError());
            const scriptContent = contents.join('\n');

            // Step 2b: Load the combined script content into Redis.
            this.loadScript(scriptContent, (err, sha) => {
              if (err) return taskCallback(err);
              if (!sha) return taskCallback(new CallbackEmptyReplyError());

              // Step 2c: Cache the loaded script SHA.
              loadedScripts[name] = sha;
              RedisClientAbstract.scripts[name] = sha;
              taskCallback();
            });
          },
        );
      },
      (err) => {
        // Step 3: Final callback after all scripts are loaded (or an error occurred).
        if (err) return cb(err);
        cb(null, loadedScripts);
      },
    );
  }

  getScriptId(name: string): string | PanicError {
    const id = RedisClientAbstract.scripts[name];
    if (!id) {
      return new PanicError({
        message: `ID of script [${name}] is missing`,
      });
    }
    return id;
  }

  runScript(
    scriptName: string,
    keys: (string | number)[],
    args: (string | number)[],
    cb: ICallback<unknown>,
  ): void {
    const sha = this.getScriptId(scriptName);
    if (sha instanceof Error) cb(sha);
    else {
      this.evalsha(
        sha,
        [keys.length, ...keys, ...args],
        (err, res?: unknown) => {
          if (err) cb(err);
          else cb(null, res);
        },
      );
    }
  }
}
