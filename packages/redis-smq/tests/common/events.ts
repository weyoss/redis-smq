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
  messageId?: string,
): Promise<void> {
  const eventBus = await getEventBus();
  await new Promise<void>((resolve) => {
    eventBus.on('consumer.consumeMessage.messageUnacknowledged', (...args) => {
      if (args[3] === consumer.getId()) {
        if (messageId) {
          if (messageId === args[0]) resolve();
        } else resolve();
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
