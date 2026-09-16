/*
 * packages/redis-smq/src/common/redis/client.ts
 */

import { ICallback, IRedisClient, RedisClientFactory } from 'redis-smq-common';
import { scriptFileMap } from '../scripts/registry.js';

export class Client extends RedisClientFactory {
  protected override setupClient(
    client: IRedisClient,
    cb: ICallback<IRedisClient>,
  ) {
    client.loadScriptFiles(scriptFileMap, (err) => {
      if (err) cb(err);
      cb(null, client);
    });
  }
}
