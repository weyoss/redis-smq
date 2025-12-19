/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { IQueueParams } from '../../../src/index.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import { getNamespaceManager } from '../../common/namespace-manager.js';
import {
  NamespaceNotFoundError,
  QueueNotFoundError,
} from '../../../src/errors/index.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Combined: Fetching namespaces, deleting a namespace with its message queues', async () => {
  const queueA: IQueueParams = {
    name: 'queue_a',
    ns: 'ns1',
  };
  await createQueue(queueA, false);

  const queueB: IQueueParams = {
    name: 'queue_b',
    ns: 'ns1',
  };
  await createQueue(queueB, false);

  const namespaceManager = await getNamespaceManager();

  const m0 = await namespaceManager.getNamespacesAsync();
  expect(m0).toEqual(['ns1']);

  await namespaceManager.deleteAsync('ns1');

  const m1 = await namespaceManager.getNamespacesAsync();
  expect(m1).toEqual([]);

  await expect(namespaceManager.deleteAsync('ns1')).rejects.toThrow(
    NamespaceNotFoundError,
  );

  //
  const qm = await getQueueManager();
  await expect(qm.getPropertiesAsync(queueA)).rejects.toThrow(
    QueueNotFoundError,
  );
  await expect(qm.getPropertiesAsync(queueB)).rejects.toThrow(
    QueueNotFoundError,
  );
});
