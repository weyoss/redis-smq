/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from '../../src/index.js';
import { getEventBus } from './event-bus-redis.js';
import { EMessageUnacknowledgementCause } from '../../src/consumer/message-handler/consume-message/types/index.js';

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
    eventBus.on('consumer.consumeMessage.messageUnacknowledged', (...args) => {
      console.log('AAAAA', ...args);

      if (args[3] === consumer.getId()) {
        if (messageId == null && cause == null) return resolve();
        if (messageId != null && messageId === args[0]) {
          if (cause == null) return resolve();
          if (cause === args[4]) return resolve();
        }
        if (cause != null && cause === args[4]) {
          if (messageId == null) return resolve();
          if (messageId === args[0]) return resolve();
        }
      }
    });
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
