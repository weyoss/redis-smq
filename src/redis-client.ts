import IORedis from 'ioredis';
import { createClient, Multi, RedisClient as NodeRedis } from 'redis';
import {
  IConfig,
  RedisClientName,
  TCallback,
  TCompatibleRedisClient,
  TRedisClientMulti,
} from '../types';
import { EventEmitter } from 'events';

export class RedisClient extends EventEmitter {
  protected client: TCompatibleRedisClient;
  protected key: string | null = null;

  constructor(config: IConfig = {}) {
    super();
    const { client = RedisClientName.REDIS, options = {} } = config.redis ?? {};
    if (![RedisClientName.IOREDIS, RedisClientName.REDIS].includes(client)) {
      throw new Error('Invalid Redis driver name');
    }
    // cast to a generic type to avoid type-coverage complaining about (options as ClientOpts/RedisOptions)
    const opts: Record<string, any> = options;
    this.client =
      client === RedisClientName.REDIS ? createClient(opts) : new IORedis(opts);
    this.client.once('ready', () => {
      this.emit('ready');
    });
    this.client.once('error', (err: Error) => {
      throw err;
    });
  }

  zadd(
    key: string,
    score: number,
    member: string,
    cb: TCallback<number | string>,
  ): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.zadd(key, score, member, cb);
    } else {
      this.client.zadd(key, score, member, cb);
    }
  }

  multi() {
    return this.client.multi();
  }

  execMulti<T>(multi: TRedisClientMulti, cb: TCallback<T[]>): void {
    if (multi instanceof Multi) {
      multi.exec(cb);
    } else {
      multi.exec((err?: Error | null, res?: Array<[Error | null, T]>) => {
        if (err) cb(err);
        else {
          const lengths = (res ?? []).map((i) => {
            if (!i) {
              throw new Error('Expected an array reply from multi.exec()');
            }
            const [err, result] = i;
            if (err instanceof Error) {
              throw err;
            }
            return result;
          });
          cb(null, lengths);
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

  zcard(key: string, cb: TCallback<number>) {
    this.client.zcard(key, cb);
  }

  zrange(key: string, min: number, max: number, cb: TCallback<string[]>) {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.zrange(key, min, max, cb);
    } else {
      this.client.zrange(key, min, max, cb);
    }
  }

  subscribe(channel: string) {
    this.client.subscribe(channel);
  }

  on(event: string, listener: (channel: string, message: string) => void) {
    this.client.on(event, listener);
    return this;
  }

  zrangebyscore(
    key: string,
    min: number,
    max: number,
    cb: TCallback<string[]>,
  ): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.zrangebyscore(key, min, max, cb);
    } else {
      this.client.zrangebyscore(key, min, max, cb);
    }
  }

  smembers(key: string, cb: TCallback<string[]>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.smembers(key, cb);
    } else {
      this.client.smembers(key, cb);
    }
  }

  sadd(key: string, member: string, cb: TCallback<number>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.sadd(key, member, cb);
    } else {
      this.client.sadd(key, member, cb);
    }
  }

  hgetall(key: string, cb: TCallback<Record<string, string>>): void {
    this.client.hgetall(key, cb);
  }

  hget(key: string, field: string, cb: TCallback<string>): void {
    this.client.hget(key, field, cb);
  }

  hset(key: string, field: string, value: string, cb: TCallback<number>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.hset(key, field, value, cb);
    } else {
      this.client.hset(key, field, value, cb);
    }
  }

  hdel(key: string, fields: string | string[], cb: TCallback<number>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.hdel(key, fields, cb);
    } else {
      this.client.hdel(key, fields, cb);
    }
  }

  lrange(
    key: string,
    start: number,
    stop: number,
    cb: TCallback<string[]>,
  ): void {
    this.client.lrange(key, start, stop, cb);
  }

  hkeys(key: string, cb: TCallback<string[]>): void {
    this.client.hkeys(key, cb);
  }

  hmset(key: string, args: string[], cb: TCallback<string>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.hmset(key, args, cb);
    } else {
      this.client.hmset(key, args, cb);
    }
  }

  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: TCallback<string>,
  ): void {
    this.client.brpoplpush(source, destination, timeout, cb);
  }

  rpop(key: string, cb: TCallback<string>): void {
    this.client.rpop(key, cb);
  }

  lpush(key: string, element: string, cb: TCallback<number>): void {
    // different typescript signatures, using if/else to get it done
    if (this.client instanceof NodeRedis) {
      this.client.lpush(key, element, cb);
    } else {
      this.client.lpush(key, element, cb);
    }
  }

  publish(channel: string, message: string, cb: TCallback<number>): void {
    this.client.publish(channel, message, cb);
  }

  flushall(cb: TCallback<string>): void {
    this.client.flushall(cb);
  }

  // this exists ONLY to retain compatibility to `redlock`
  eval(
    args: (string | number)[] | string | number,
    cb?: (err: Error | null, res?: unknown) => void,
  ): void {
    const client = this.client as Record<string, any>;
    if (this.client instanceof NodeRedis) {
      client['eval'](args, cb);
    } else {
      const arrArgs = Array.isArray(args) ? args : [args];
      client['eval'](arrArgs, cb);
    }
  }

  // this exists ONLY to retain compatibility to `redlock`
  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb?: (err: Error | null, res?: unknown) => void,
  ): void {
    const client = this.client as Record<string, any>;
    if (this.client instanceof NodeRedis) {
      client['evalsha'](hash, args, cb);
    } else {
      const arrHash: (string | number)[] = [hash];
      const arrArgs = Array.isArray(args) ? args : [args];
      client['evalsha'](arrHash.concat(arrArgs), cb);
    }
  }

  // this exists ONLY to retain compatibility to `redlock`
  quit(): void {
    this.end(true);
  }
}
