import {
  ICallback,
  THeartbeatRegistryPayload,
  TRedisClientMulti,
} from '../../../../types';
import { RedisClient } from '../redis-client/redis-client';
import * as os from 'os';
import * as async from 'async';

const IPAddresses = (() => {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const netInterface in nets) {
    const addr = nets[netInterface] ?? [];
    for (const netAddr of addr) {
      if (netAddr.family === 'IPv4' && !netAddr.internal) {
        addresses.push(netAddr.address);
      }
    }
  }
  return addresses;
})();

export const heartbeatRegistry = {
  register(
    multi: TRedisClientMulti,
    keyRegistry: string,
    instanceId: string,
  ): void {
    const data: THeartbeatRegistryPayload = {
      ipAddress: IPAddresses,
      hostname: os.hostname(),
      pid: process.pid,
      createdAt: Date.now(),
    };
    multi.hset(keyRegistry, instanceId, JSON.stringify(data));
  },

  unregister(
    multi: TRedisClientMulti,
    keyRegistry: string,
    instanceId: string,
  ): void {
    multi.hdel(keyRegistry, instanceId);
  },

  exists(
    client: RedisClient,
    keyRegistry: string,
    instanceId: string,
    cb: ICallback<boolean>,
  ): void {
    client.hexists(keyRegistry, instanceId, cb);
  },

  getAll(
    client: RedisClient,
    keyRegistry: string,
    transform: boolean,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    client.hgetall(keyRegistry, (err, reply) => {
      if (err) cb(err);
      else {
        if (transform) {
          const data: Record<string | number, THeartbeatRegistryPayload> = {};
          async.eachOf(
            reply ?? {},
            (item, key, done) => {
              data[key] = JSON.parse(item);
              done();
            },
            () => cb(null, data),
          );
        } else cb(null, reply ?? {});
      }
    });
  },

  getIds(
    client: RedisClient,
    keyRegistry: string,
    cb: ICallback<string[]>,
  ): void {
    client.hkeys(keyRegistry, cb);
  },

  count(client: RedisClient, keyRegistry: string, cb: ICallback<number>): void {
    client.hlen(keyRegistry, cb);
  },
};
