/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  IMessageTransferable,
  IQueueParams,
  RedisSMQ,
  TConsumerMessageHandler,
} from '../../src/index.js';
import { getDefaultQueue } from './message-producing-consuming.js';

type TGetConsumerArgs = {
  queue?: string | IQueueParams;
  messageHandler?: TConsumerMessageHandler;
};

export function getConsumer(args?: TGetConsumerArgs | false) {
  const c = bluebird.promisifyAll(RedisSMQ.createConsumer());
  if (args === false) {
    return c;
  }
  const {
    queue = getDefaultQueue(),
    messageHandler = (m: IMessageTransferable, cb: ICallback) => cb(),
  } = args || {};
  c.consume(queue, messageHandler, () => void 0);
  return c;
}
