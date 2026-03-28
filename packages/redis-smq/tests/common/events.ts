/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer, IQueueParsedParams } from '../../src/index.js';
import { getEventBus } from './event-bus-redis.js';
import { EMessageUnacknowledgementCause } from '../../src/index.js';

export async function untilMessageAcknowledged(
  consumer: Consumer,
  messageId?: string,
): Promise<void> {
  const eventBus = await getEventBus();
  await new Promise<void>((resolve) => {
    eventBus.on('consumer.consumeMessage.messageAcknowledged', (...args) => {
      if (args[3] === consumer.getId()) {
        if (messageId) {
          if (messageId === args[0]) resolve();
        } else resolve();
      }
    });
  });
}

export async function untilMessageUnacknowledged(
  consumer: Consumer,
  messageId?: string | null,
  cause?: EMessageUnacknowledgementCause,
): Promise<void> {
  const eventBus = await getEventBus();
  await new Promise<void>((resolve) => {
    const handler = (
      eventMessageId: string,
      eventQueue: IQueueParsedParams,
      eventMessageHandlerId: string,
      eventConsumerId: string,
      eventCause: EMessageUnacknowledgementCause,
    ) => {
      // Check if this event is for our consumer
      if (eventConsumerId !== consumer.getId()) {
        return;
      }

      // Check messageId if specified
      if (messageId != null && eventMessageId !== messageId) {
        return;
      }

      // Check cause if specified
      if (cause != null && eventCause !== cause) {
        return;
      }

      // All conditions met - resolve the promise
      eventBus.removeListener(
        'consumer.consumeMessage.messageUnacknowledged',
        handler,
      );
      resolve();
    };
    eventBus.on('consumer.consumeMessage.messageUnacknowledged', handler);
  });
}

export async function untilMessageDeadLettered(
  consumer: Consumer,
  messageId?: string,
): Promise<void> {
  const eventBus = await getEventBus();
  await new Promise<void>((resolve) => {
    eventBus.on('consumer.consumeMessage.messageDeadLettered', (...args) => {
      if (args[3] === consumer.getId()) {
        if (messageId) {
          if (messageId === args[0]) resolve();
        } else resolve();
      }
    });
  });
}

export async function untilConsumerDown(consumer: Consumer): Promise<void> {
  await new Promise<void>((resolve) => {
    consumer.on('consumer.down', () => resolve());
  });
}
