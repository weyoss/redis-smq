/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from '../../src/lib/consumer/consumer';
import { events } from '../../src/common/events/events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function consumerOnEvent<T extends Array<any>>(
  consumer: Consumer,
  event: string,
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
  const [id] = await consumerOnEvent<[string]>(
    consumer,
    events.MESSAGE_ACKNOWLEDGED,
  );
  if (messageId && messageId !== id) {
    await untilMessageAcknowledged(consumer, messageId);
  }
}

export async function untilMessageDeadLettered(
  consumer: Consumer,
  messageId?: string,
): Promise<void> {
  const [, id] = await consumerOnEvent<[string, string]>(
    consumer,
    events.MESSAGE_DEAD_LETTERED,
  );
  if (messageId && messageId !== id) {
    await untilMessageDeadLettered(consumer, messageId);
  }
}

export async function untilConsumerEvent(
  consumer: Consumer,
  event: string,
): Promise<unknown[]> {
  return consumerOnEvent(consumer, event);
}
