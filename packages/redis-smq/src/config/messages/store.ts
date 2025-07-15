/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IMessagesConfigStorage,
  IMessagesConfigStorageOptions,
  IMessagesConfigStorageOptionsRequired,
  IMessagesConfigStorageRequired,
} from '../../index.js';
import {
  ConfigurationMessageQueueSizeError,
  ConfigurationMessageStoreExpireError,
} from '../errors/index.js';
import { IRedisSMQConfig } from '../types/index.js';

function getMessageStorageConfig(
  config: IRedisSMQConfig,
  key: keyof IMessagesConfigStorage,
): boolean | IMessagesConfigStorageOptions {
  const { store } = config.messages ?? {};
  if (typeof store === 'undefined' || typeof store === 'boolean') {
    return Boolean(store);
  }
  const params = store[key];
  if (params) return params;
  return false;
}

function getMessageStorageParams(
  config: IRedisSMQConfig,
  key: keyof IMessagesConfigStorage,
): IMessagesConfigStorageOptionsRequired {
  const params = getMessageStorageConfig(config, key);
  if (typeof params === 'boolean') {
    return {
      store: params,
      queueSize: 0,
      expire: 0,
    };
  }
  const queueSize = Number(params.queueSize ?? 0);
  if (isNaN(queueSize) || queueSize < 0) {
    throw new ConfigurationMessageQueueSizeError();
  }
  const expire = Number(params.expire ?? 0);
  if (isNaN(expire) || expire < 0) {
    throw new ConfigurationMessageStoreExpireError();
  }
  return {
    store: true,
    queueSize,
    expire,
  };
}

export default function Store(
  config: IRedisSMQConfig,
): IMessagesConfigStorageRequired {
  return {
    acknowledged: getMessageStorageParams(config, 'acknowledged'),
    deadLettered: getMessageStorageParams(config, 'deadLettered'),
  };
}
