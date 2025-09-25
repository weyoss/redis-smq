/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { IQueueParams } from '../../../src/index.js';
import {
  createQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getNamespaceManager } from '../../common/namespace-manager.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import {
  NamespaceNotFoundError,
  QueueManagerActiveConsumersError,
  QueueNotEmptyError,
  QueueNotFoundError,
} from '../../../src/errors/index.js';

test('Combined: Fetching namespaces, deleting a namespace with its message queues', async () => {
  const queueA: IQueueParams = {
    name: 'queue_a',
    ns: 'ns1',
  };
  await createQueue(queueA, false);
  const { consumer: c1 } = await produceAndAcknowledgeMessage(queueA);

  const queueB: IQueueParams = {
    name: 'queue_b',
    ns: 'ns1',
  };
  await createQueue(queueB, false);
  const { consumer: c2 } = await produceAndAcknowledgeMessage(queueB);

  const namespaceManager = await getNamespaceManager();

  const m0 = await namespaceManager.getNamespacesAsync();
  expect(m0).toEqual(['ns1']);

  const qm = await getQueueMessages();
  const m1 = await qm.countMessagesByStatusAsync(queueA);
  expect(m1.acknowledged).toBe(1);

  const m2 = await qm.countMessagesByStatusAsync(queueB);
  expect(m2.acknowledged).toBe(1);

  await c1.shutdownAsync();
  await c2.shutdownAsync();

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    QueueNotEmptyError,
  );

  await qm.purgeAsync(queueA);

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    QueueNotEmptyError,
  );

  await qm.purgeAsync(queueB);
  await c1.runAsync();
  await c2.runAsync();

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    QueueManagerActiveConsumersError,
  );

  await c1.shutdownAsync();

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    QueueManagerActiveConsumersError,
  );

  await c2.shutdownAsync();
  await namespaceManager.deleteAsync('ns1');

  await expect(qm.countMessagesByStatusAsync(queueA)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(qm.countMessagesByStatusAsync(queueB)).rejects.toThrow(
    QueueNotFoundError,
  );

  const m5 = await namespaceManager.getNamespacesAsync();
  expect(m5).toEqual([]);

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    NamespaceNotFoundError,
  );
});
