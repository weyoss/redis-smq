/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IMessageTransferable } from '../../message/index.js';
import { IQueueParsedParams } from '../../queue/index.js';

export type TConsumerMessageHandlerFn = (
  msg: IMessageTransferable,
  cb: ICallback<void>,
) => void;

export type TConsumerMessageHandler = string | TConsumerMessageHandlerFn;

export interface IConsumerMessageHandlerArgs {
  queue: IQueueParsedParams;
  messageHandler: TConsumerMessageHandler;
}

export type TConsumerRedisKeys = ReturnType<
  (typeof redisKeys)['getConsumerKeys']
>;
