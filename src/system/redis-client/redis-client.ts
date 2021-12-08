import IORedis from 'ioredis';
import { createClient, Multi, RedisClient as NodeRedis } from 'redis';
import {
  ICallback,
  IConfig,
  RedisClientName,
  TCompatibleRedisClient,
  TRedisClientMulti,
} from '../../../types';
import { EventEmitter } from 'events';
import { ELuaScriptName, getScriptId, loadScripts } from './lua-scripts';
import * as async from 'async';
import { RedisClientError } from './redis-client.error';

/**
 * client.end() does unregister all event listeners which causes the 'end' event not being emitted.
 * This is a known bug. See https://github.com/redis/node-redis/issues/1565
 *
 * Monkey patching the "end" method to fix the issue. The only small change is:
 *
 * this.stream.once('close', () => {
 *  this.emit('end');
 *  this.emitted_end = true;
 * });
 *
 * which has been added after this.stream.removeAllListeners().
 * That's all.
 */
const patchedEnd = function (
  this: EventEmitter & {
    stream: EventEmitter & { destroySoon: () => void };
    flush_and_error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    connected: boolean;
    emitted_end: boolean;
    ready: boolean;
    closing: boolean;
    retry_timer: NodeJS.Timeout | null;
  },
  flush: boolean,
) {
  // Flush queue if wanted
  if (flush) {
    this.flush_and_error({
      message: 'Connection forcefully ended and command aborted.',
      code: 'NR_CLOSED',
    });
  } else if (arguments.length === 0) {
    this.warn(
      'Using .end() without the flush parameter is deprecated and throws from v.3.0.0 on.\n' +
        'Please check the doku (https://github.com/NodeRedis/node_redis) and explictly use flush.',
    );
  }
  // Clear retry_timer
  if (this.retry_timer) {
    clearTimeout(this.retry_timer);
    this.retry_timer = null;
  }
  this.stream.removeAllListeners();
  this.stream.once('close', () => {
    this.emit('end');
    this.emitted_end = true;
  });
  this.stream.on('error', () => void 0);
  this.connected = false;
  this.ready = false;
  this.closing = true;
  return this.stream.destroySoon();
};

export class RedisClient extends EventEmitter {
  static redisServerVersion: number[] | null = null;
  static scriptsLoaded = false;

  protected client: TCompatibleRedisClient;

  protected constructor(config: IConfig = {}) {
    super();
    this.client = this.getClient(config);
    this.client.once('ready', () => {
      this.emit('ready');
    });
    if (this.client instanceof NodeRedis) {
      this.client.end = patchedEnd;
    }
  }

  protected validateRedisVersion(
    major: number,
    feature = 0,
    minor = 0,
  ): boolean {
    if (!RedisClient.redisServerVersion)
      throw new RedisClientError('Unknown Redis server version.');
    return (
      RedisClient.redisServerVersion[0] > major ||
      (RedisClient.redisServerVersion[0] === major &&
        RedisClient.redisServerVersion[1] >= feature &&
        RedisClient.redisServerVersion[2] >= minor)
    );
  }

  protected getClient(config: IConfig): TCompatibleRedisClient {
    if (config.redis) {
      // in javascript land, we can pass any value
      if (!Object.values(RedisClientName).includes(config.redis.client)) {
        throw new RedisClientError('Invalid Redis driver name');
      }
      if (config.redis.client === RedisClientName.REDIS) {
        return createClient(config.redis.options);
      }
      if (config.redis.client === RedisClientName.IOREDIS) {
        return new IORedis(config.redis.options);
      }
    }
    return createClient();
  }

  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void {
    this.client.zadd(key, score, member, cb);
  }

  multi(): TRedisClientMulti {
    return this.client.multi();
  }

  watch(args: string[], cb: ICallback<string>): void {
    this.client.watch(args, cb);
  }

  execMulti<T>(multi: TRedisClientMulti, cb: ICallback<T[]>): void {
    if (multi instanceof Multi) {
      multi.exec(cb);
    } else {
      multi.exec((err?: Error | null, reply?: Array<[Error | null, T]>) => {
        if (err) cb(err);
        else {
          const lengths: T[] = [];
          let err: Error | null = null;
          if (reply === null) {
            console.log(
              'Exec multi has been abandoned due to a concurrency issue',
            );
          }
          for (const i of reply ?? []) {
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
      });
    }
  }

  zcard(key: string, cb: ICallback<number>): void {
    this.client.zcard(key, cb);
  }

  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void {
    this.client.zrange(key, min, max, cb);
  }

  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.zrevrange(key, min, max, cb);
  }

  subscribe(channel: string): void {
    this.client.subscribe(channel);
  }

  on(event: string, listener: (...args: unknown[]) => void) {
    this.client.on(event, listener);
    return this;
  }

  zrangebyscore(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.zrangebyscore(key, min, max, cb);
  }

  smembers(key: string, cb: ICallback<string[]>): void {
    this.client.smembers(key, cb);
  }

  sadd(key: string, member: string, cb: ICallback<number>): void {
    this.client.sadd(key, member, cb);
  }

  hgetall(key: string, cb: ICallback<Record<string, string>>): void {
    this.client.hgetall(key, cb);
  }

  hget(key: string, field: string, cb: ICallback<string>): void {
    this.client.hget(key, field, cb);
  }

  hset(key: string, field: string, value: string, cb: ICallback<number>): void {
    this.client.hset(key, field, value, cb);
  }

  hdel(key: string, fields: string | string[], cb: ICallback<number>): void {
    this.client.hdel(key, fields, cb);
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

  hmset(key: string, args: string[], cb: ICallback<string>): void {
    this.client.hmset(key, args, cb);
  }

  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string>,
  ): void {
    this.client.brpoplpush(source, destination, timeout, cb);
  }

  rpoplpush(source: string, destination: string, cb: ICallback<string>): void {
    this.client.rpoplpush(source, destination, cb);
  }

  zpoprpush(source: string, destination: string, cb: ICallback<string>): void {
    this.evalsha(
      getScriptId(ELuaScriptName.ZPOPRPUSH),
      [2, source, destination],
      (err, res?: unknown) => {
        if (err) cb(err);
        else if (typeof res !== 'string') cb();
        else cb(null, res);
      },
    );
  }

  zpophgetrpush(
    source: string,
    sourceHash: string,
    destination: string,
    cb: ICallback<string>,
  ): void {
    this.evalsha(
      getScriptId(ELuaScriptName.ZPOPHGETRPUSH),
      [3, source, sourceHash, destination],
      (err, res?: unknown) => {
        if (err) cb(err);
        else if (typeof res !== 'string') cb();
        else cb(null, res);
      },
    );
  }

  zpushhset(
    sortedSet: string,
    hash: string,
    score: number,
    keyId: string,
    keyValue: string,
    cb: ICallback<void>,
  ): void {
    this.evalsha(
      getScriptId(ELuaScriptName.ZPUSHHSET),
      [5, sortedSet, hash, score, keyId, keyValue],
      (err) => cb(err),
    );
  }

  zrem(key: string, value: string, cb: ICallback<string>): void {
    this.client.zrem(key, value, (err) => cb(err));
  }

  rpop(key: string, cb: ICallback<string>): void {
    this.client.rpop(key, cb);
  }

  lpush(key: string, element: string, cb: ICallback<number>): void {
    this.client.lpush(key, element, cb);
  }

  rpush(key: string, element: string, cb: ICallback<number>): void {
    this.client.rpush(key, element, cb);
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

  eval(
    args: (string | number)[] | string | number,
    cb?: (err: Error | null, res?: unknown) => void,
  ): void {
    const arrArgs = Array.isArray(args) ? args : [args];
    this.client.eval(arrArgs, cb);
  }

  loadScript(script: string, cb: ICallback<string>): void {
    this.client.script('load', script, cb);
  }

  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void {
    const arrHash: (string | number)[] = [hash];
    const arrArgs = Array.isArray(args) ? args : [args];
    this.client.evalsha(arrHash.concat(arrArgs), cb);
  }

  get(key: string, cb: ICallback<string>): void {
    this.client.get(key, cb);
  }

  set(key: string, value: string, cb: ICallback<void>): void {
    this.client.set(key, value, (err) => cb(err));
  }

  del(key: string, cb: ICallback<number>): void {
    this.client.del(key, cb);
  }

  llen(key: string, cb: ICallback<number>): void {
    this.client.llen(key, cb);
  }

  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string>,
  ): void {
    if (!this.validateRedisVersion(6, 2)) {
      cb(
        new RedisClientError(
          'Command not supported by your Redis server. Minimal required Redis server version is 6.2.0.',
        ),
      );
    } else {
      this.client.lmove(source, destination, from, to, cb);
    }
  }

  lpoprpush(source: string, destination: string, cb: ICallback<string>): void {
    if (this.validateRedisVersion(6, 2)) {
      this.lmove(source, destination, 'LEFT', 'RIGHT', cb);
    } else {
      this.evalsha(
        getScriptId(ELuaScriptName.LPOPRPUSH),
        [2, source, destination],
        (err, res?: unknown) => {
          if (err) cb(err);
          else if (typeof res !== 'string') cb();
          else cb(null, res);
        },
      );
    }
  }

  zremrangebyscore(source: string, score: number, cb: ICallback<number>): void {
    this.client.zremrangebyscore(source, score, score, cb);
  }

  hmget(source: string, keys: string[], cb: ICallback<string[]>): void {
    this.client.hmget(source, keys, cb);
  }

  halt(cb: ICallback<void>): void {
    this.client.once('end', cb);
    this.end(true);
  }

  end(flush: boolean): void {
    if (this.client instanceof NodeRedis) {
      this.client.end(flush);
    } else {
      this.client.disconnect(false);
    }
  }

  quit(cb?: ICallback<void>): void {
    this.client.quit(() => cb && cb());
  }

  updateServerVersion(cb: ICallback<void>): void {
    if (!RedisClient.redisServerVersion) {
      this.client.info((err, res) => {
        if (err) throw err;
        else {
          RedisClient.redisServerVersion = res
            .split('\r\n')[1]
            .split(':')[1]
            .split('.')
            .map((i) => Number(i));
          cb();
        }
      });
    } else cb();
  }

  loadScripts(cb: ICallback<void>): void {
    if (!RedisClient.scriptsLoaded) {
      loadScripts(this, (err) => {
        if (err) cb(err);
        else {
          RedisClient.scriptsLoaded = true;
          cb();
        }
      });
    } else cb();
  }

  static getNewInstance(
    config: IConfig = {},
    cb: ICallback<RedisClient>,
  ): void {
    // Waiting until a connection is established and ready
    // Do not return any error, and allow TCompatibleRedisClient (ioredis, node_redis)
    // to reconnect in case of Redis server restart or not responding.
    // An error will be thrown when max retries threshold is exceeded.
    const client = new RedisClient(config);
    client.once('ready', () => {
      async.waterfall(
        [
          (cb: ICallback<void>) => client.updateServerVersion(cb),
          (cb: ICallback<void>) => client.loadScripts(cb),
        ],
        (err) => {
          if (err) throw err;
          else cb(null, client);
        },
      );
    });
  }
}
