/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, jest, test } from '@jest/globals';
import bluebird from 'bluebird';
import { Producer } from '../../../src/lib/index.js';

test('Health check: case 1', async () => {
  const producerUpMock = jest.fn();
  const producerDownMock = jest.fn();
  const producerGoingUpMock = jest.fn();
  const producerGoingDownMock = jest.fn();

  const producer = bluebird.promisifyAll(new Producer());
  producer.on('producer.up', producerUpMock);
  producer.on('producer.down', producerDownMock);
  producer.on('producer.goingDown', producerGoingDownMock);
  producer.on('producer.goingUp', producerGoingUpMock);

  await producer.runAsync();
  await producer.shutdownAsync();

  expect(producerGoingUpMock).toHaveBeenCalledTimes(1);
  expect(producerUpMock).toHaveBeenCalledTimes(1);
  expect(producerGoingDownMock).toHaveBeenCalledTimes(1);
  expect(producerDownMock).toHaveBeenCalledTimes(1);
});
