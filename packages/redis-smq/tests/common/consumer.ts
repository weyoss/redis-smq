/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  Consumer,
  IQueueParams,
  TConsumerMessageHandler,
} from '../../src/index.js';
import { shutDownBaseInstance } from './base-instance.js';
import { getDefaultQueue } from './message-producing-consuming.js';

type TGetConsumerArgs = {
  queue?: string | IQueueParams;
  messageHandler?: TConsumerMessageHandler;
  consumeDefaultQueue?: boolean;
};

const consumersList: Consumer[] = [];

export function getConsumer(args: TGetConsumerArgs = {}) {
  const {
    queue = getDefaultQueue(),
    messageHandler = (msg, cb) => cb(),
    consumeDefaultQueue = true,
  } = args;
  const consumer = bluebird.promisifyAll(new Consumer());
  if (consumeDefaultQueue)
    consumer.consume(queue, messageHandler, () => void 0);
  consumersList.push(consumer);
  return consumer;
}

export async function shutDownConsumers() {
  for (const i of consumersList) await shutDownBaseInstance(i);
}
