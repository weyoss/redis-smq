import IORedis from 'ioredis';
import { createClient, Multi, RedisClient as NodeRedis } from 'redis';
import {
  ICallback,
  IConfig,
  RedisClientName,
  TCompatibleRedisClient,
  TPaginatedRedisQuery,
  TPaginatedRedisQueryTotalItemsFn,
  TPaginatedRedisQueryTransformFn,
  TRedisClientMulti,
} from '../../types';
import { EventEmitter } from 'events';
import * as async from 'async';

function getPage<T>(
  client: RedisClient,
  from: 'zrange' | 'lrange',
  key: string,
  skip: number,
  take: number,
  getTotalFn: TPaginatedRedisQueryTotalItemsFn,
  transformFn: TPaginatedRedisQueryTransformFn<T>,
  cb: ICallback<TPaginatedRedisQuery<T>>,
) {
  if (skip < 0 || take <= 0) {
    cb(
      new Error(
        `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
      ),
    );
  } else {
    const getTotalItems = (cb: ICallback<number>) => getTotalFn(client, cb);
    const getItems = (
      total: number,
      cb: ICallback<TPaginatedRedisQuery<T>>,
    ) => {
      if (!total) {
        cb(null, {
          total,
          items: [],
        });
      } else {
        client[from](key, skip, skip + take - 1, (err, result) => {
          if (err) cb(err);
          else {
            const items = (result ?? []).map((msg) => transformFn(msg));
            cb(null, { total, items });
          }
        });
      }
    };
    async.waterfall(
      [getTotalItems, getItems],
      (err?: Error | null, result?: TPaginatedRedisQuery<T>) => {
        if (err) cb(err);
        else cb(null, result);
      },
    );
  }
}

export class RedisClient extends EventEmitter {
  protected client: TCompatibleRedisClient;

  protected constructor(config: IConfig = {}) {
    super();
    this.client = this.getClient(config);
    this.client.once('ready', () => {
      this.emit('ready');
    });
    this.client.once('error', (err: Error) => {
      throw err;
    });
  }

  protected getClient(config: IConfig): TCompatibleRedisClient {
    if (config.redis) {
      // in javascript land, we can pass any value
      if (!Object.values(RedisClientName).includes(config.redis.client)) {
        throw new Error('Invalid Redis driver name');
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

  execMulti<T>(multi: TRedisClientMulti, cb: ICallback<T[]>): void {
    if (multi instanceof Multi) {
      multi.exec(cb);
    } else {
      multi.exec((err?: Error | null, res?: Array<[Error | null, T]>) => {
        if (err) cb(err);
        else {
          const lengths: T[] = [];
          let err: Error | null = null;
          for (const i of res ?? []) {
            if (!Array.isArray(i)) {
              err = new Error('Expected an array reply from multi.exec()');
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

  rpop(key: string, cb: ICallback<string>): void {
    this.client.rpop(key, cb);
  }

  lpush(key: string, element: string, cb: ICallback<number>): void {
    this.client.lpush(key, element, cb);
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
    cb?: (err: Error | null, res?: unknown) => void,
  ): void {
    const arrHash: (string | number)[] = [hash];
    const arrArgs = Array.isArray(args) ? args : [args];
    this.client.evalsha(arrHash.concat(arrArgs), cb);
  }

  zRangePage<T>(
    key: string,
    skip: number,
    take: number,
    getTotalFn: TPaginatedRedisQueryTotalItemsFn,
    transformFn: TPaginatedRedisQueryTransformFn<T>,
    cb: ICallback<TPaginatedRedisQuery<T>>,
  ): void {
    getPage<T>(this, 'zrange', key, skip, take, getTotalFn, transformFn, cb);
  }

  lRangePage<T>(
    key: string,
    skip: number,
    take: number,
    getTotalFn: TPaginatedRedisQueryTotalItemsFn,
    transformFn: TPaginatedRedisQueryTransformFn<T>,
    cb: ICallback<TPaginatedRedisQuery<T>>,
  ): void {
    getPage<T>(this, 'lrange', key, skip, take, getTotalFn, transformFn, cb);
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

  static getNewInstance(
    config: IConfig = {},
    cb: (client: RedisClient) => void,
  ): void {
    const client = new RedisClient(config);
    client.once('ready', () => cb(client));
  }
}
