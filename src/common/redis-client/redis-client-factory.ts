/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TUnaryFunction } from 'redis-smq-common';
import { RedisClientInstance } from './redis-client-instance.js';

const instances: Record<string, RedisClientInstance> = {};

export function RedisClientFactory(
  id: string,
  onError: TUnaryFunction<Error>,
): RedisClientInstance {
  if (!instances[id]) {
    const instance = new RedisClientInstance();
    instance.on('error', onError);
    instances[id] = instance;
  }
  return instances[id];
}
