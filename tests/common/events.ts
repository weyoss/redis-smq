/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from '../../src/lib/consumer/consumer';
import { TRedisSMQEvent } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function consumerOnEvent<T extends Array<any>>(
  consumer: Consumer,
  event: keyof TRedisSMQEvent,
) {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    consumer.once(event, (...args: T) => {
      resolve(args);
    });
  });
}

export async function untilMessageAcknowledged(
  consumer: Consumer,
  messageId?: string,
): Promise<void> {
  const [id] = await consumerOnEvent<[string]>(consumer, 'messageAcknowledged');
  if (messageId && messageId !== id) {
    await untilMessageAcknowledged(consumer, messageId);
  }
}

export async function untilMessageDeadLettered(
  consumer: Consumer,
  messageId?: string,
): Promise<void> {
  const [id] = await consumerOnEvent<[string, string]>(
    consumer,
    'messageDeadLettered',
  );
  if (messageId && messageId !== id) {
    await untilMessageDeadLettered(consumer, messageId);
  }
}

export async function untilConsumerEvent(
  consumer: Consumer,
  event: keyof TRedisSMQEvent,
): Promise<unknown[]> {
  return consumerOnEvent(consumer, event);
}
