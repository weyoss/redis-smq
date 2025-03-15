/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../common/index.js';
import { CallbackEmptyReplyError } from '../errors/index.js';
import { RedisClientError } from './errors/index.js';
import {
  ERedisConfigClient,
  IRedisClient,
  IRedisConfig,
} from './types/index.js';

function createNodeRedisClient(
  config: IRedisConfig,
  cb: ICallback<IRedisClient>,
): void {
  import('./clients/node-redis/node-redis-client.js')
    .then(({ NodeRedisClient }): void => {
      const client = new NodeRedisClient(config.options);
      cb(null, client);
    })
    .catch(() =>
      cb(
        new RedisClientError(
          'REDIS client is not available. Please install node-redis.',
        ),
      ),
    );
}

function createIORedisClient(
  config: IRedisConfig,
  cb: ICallback<IRedisClient>,
): void {
  import('./clients/ioredis/ioredis-client.js')
    .then(({ IoredisClient }): void => {
      const client = new IoredisClient(config.options);
      cb(null, client);
    })
    .catch(() =>
      cb(
        new RedisClientError(
          'IOREDIS client is not available. Please install ioredis.',
        ),
      ),
    );
}

function createClient(config: IRedisConfig, cb: ICallback<IRedisClient>): void {
  if (config.client === ERedisConfigClient.REDIS) {
    return createNodeRedisClient(config, cb);
  }
  if (config.client === ERedisConfigClient.IOREDIS) {
    return createIORedisClient(config, cb);
  }
  cb(
    new RedisClientError(
      'Unsupported Redis client type. Supported types are: REDIS, IOREDIS.',
    ),
  );
}

export function createRedisClient(
  config: IRedisConfig,
  cb: ICallback<IRedisClient>,
): void {
  createClient(config, (err, client) => {
    if (err) return cb(err);
    if (!client) return cb(new CallbackEmptyReplyError());
    const onReady = () => {
      removeListeners();
      cb(null, client);
    };
    const onError = (err: Error) => {
      removeListeners();
      cb(err);
    };
    const removeListeners = () => {
      client.removeListener('ready', onReady);
      client.removeListener('error', onError);
    };
    client.once('ready', onReady);
    client.once('error', onError);
  });
}
