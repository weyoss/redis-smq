import IORedis from 'ioredis';
import { createClient, Multi, RedisClient as NodeRedis } from 'redis';
import {
  IConfig,
  RedisClientName,
  ICallback,
  TCompatibleRedisClient,
  TRedisClientMulti,
} from '../types';
import { EventEmitter } from 'events';

export class RedisClient extends EventEmitter {
  protected client: TCompatibleRedisClient;

  protected constructor(config: IConfig = {}) {
    super();
    const { client = RedisClientName.REDIS, options = {} } = config.redis ?? {};
    if (![RedisClientName.IOREDIS, RedisClientName.REDIS].includes(client)) {
      throw new Error('Invalid Redis driver name');
    }
    // cast to a generic type to avoid type-coverage complaining about (options as ClientOpts/RedisOptions)
    const opts: Record<string, any> = options;
    this.client =
      client === RedisClientName.REDIS ? createClient(opts) : new IORedis(opts);
    this.client.once('ready', () => this.emit('ready'));
    this.client.once('error', (err: Error) => {
      throw err;
    });
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

  end(flush: boolean): void {
    if (this.client instanceof NodeRedis) {
      this.client.end(flush);
    } else {
      this.client.disconnect(false);
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

  static getInstance(
    config: IConfig = {},
    cb: (client: RedisClient) => void,
  ): void {
    const client = new RedisClient(config);
    client.once('ready', () => cb(client));
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

  quit(): void {
    this.end(true);
  }
}
