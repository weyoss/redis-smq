/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import bluebird from 'bluebird';
import {
  EQueueDeliveryModel,
  EQueueType,
  Namespace,
  NamespaceNotFoundError,
  Queue,
} from '../../../src/lib/index.js';

test('Namespace', async () => {
  const queue = bluebird.promisifyAll(new Queue());
  await queue.saveAsync(
    'myqueue',
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const namespace = bluebird.promisifyAll(new Namespace());
  const nsList = await namespace.getNamespacesAsync();
  expect(nsList).toEqual(['testing']);

  const nsQueues = await namespace.getNamespaceQueuesAsync('testing');
  expect(nsQueues).toEqual([{ ns: 'testing', name: 'myqueue' }]);

  await namespace.deleteAsync('testing');
  const nsList1 = await namespace.getNamespacesAsync();
  expect(nsList1).toEqual([]);

  await expect(namespace.getNamespaceQueuesAsync('testing')).rejects.toThrow(
    NamespaceNotFoundError,
  );

  await queue.shutdownAsync();
  await namespace.shutdownAsync();
});
