/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue';
import { redisKeys } from '../../src/common/redis-keys/redis-keys';
import { IConsumableMessage } from '../message';

export type TConsumerMessageHandler = (
  msg: IConsumableMessage,
  cb: ICallback<void>,
) => void;

export interface IConsumerMessageHandlerArgs {
  queue: IQueueParams;
  messageHandler: TConsumerMessageHandler;
}

export type TConsumerRedisKeys = ReturnType<
  (typeof redisKeys)['getConsumerKeys']
>;
