/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, test } from '@jest/globals';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
  scheduleMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';

describe('QueueMessages: countMessagesByStatus()', () => {
  test('Case 1', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceMessage();
    const queueMessages = await getQueueMessages();
    const m = await queueMessages.countMessagesByStatusAsync(queue);
    expect(m.pending).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
    expect(m.scheduled).toBe(0);
  });

  test('Case 2', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceAndDeadLetterMessage();
    const queueMessages = await getQueueMessages();
    const m = await queueMessages.countMessagesByStatusAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(1);
    expect(m.scheduled).toBe(0);
  });

  test('Case 3', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceAndAcknowledgeMessage();
    const queueMessages = await getQueueMessages();
    const m = await queueMessages.countMessagesByStatusAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLettered).toBe(0);
    expect(m.scheduled).toBe(0);
  });

  test('Case 4', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await scheduleMessage();
    const queueMessages = await getQueueMessages();
    const m = await queueMessages.countMessagesByStatusAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
    expect(m.scheduled).toBe(1);
  });

  test('Case 5', async () => {
    await createQueue(defaultQueue, true);
    const { queue } = await produceMessageWithPriority();
    const queueMessages = await getQueueMessages();
    const m = await queueMessages.countMessagesByStatusAsync(queue);
    expect(m.pending).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
    expect(m.scheduled).toBe(0);
  });
});
