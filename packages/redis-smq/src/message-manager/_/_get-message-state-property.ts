/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  TMessageStateProperty,
  TMessageStatePropertyType,
} from '../../message/index.js';
import { propertyConfigs } from './_parse-message-state.js';

/**
 * Retrieves and parses a message state property from Redis.
 * Uses shared parsing utilities for consistent logic across the codebase.
 */
export function _getMessageStateProperty<T extends TMessageStateProperty>(
  redisClient: IRedisClient,
  messageId: string,
  property: T,
  cb: ICallback<TMessageStatePropertyType<T>>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);

  async.withCallback(
    (cb: ICallback<string | null>) =>
      redisClient.hget(keyMessage, String(property), cb),
    (value, cb) => {
      const config = propertyConfigs[property];
      if (!config) {
        return cb(new Error(`Could not find property '${property}'`));
      }
      const parsedValue = config.parser(value);
      cb(null, parsedValue);
    },
    cb,
  );
}
