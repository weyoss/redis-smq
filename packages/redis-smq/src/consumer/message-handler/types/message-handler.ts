/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageTransferable } from '../../../message/index.js';
import { ICallback } from 'redis-smq-common';
import { IQueueParsedParams } from '../../../queue-manager/index.js';

export type TConsumerMessageHandlerFn = (
  msg: IMessageTransferable,
  cb: ICallback<void>,
) => void;

export type TConsumerMessageHandler = string | TConsumerMessageHandlerFn;

export interface IConsumerMessageHandlerParams {
  queue: IQueueParsedParams;
  messageHandler: TConsumerMessageHandler;
}
