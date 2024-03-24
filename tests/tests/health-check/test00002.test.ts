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
import { Consumer } from '../../../src/lib/index.js';

test('Health check: case 2', async () => {
  const consumerUpMock = jest.fn();
  const consumerDownMock = jest.fn();
  const consumerGoingUpMock = jest.fn();
  const consumerGoingDownMock = jest.fn();

  const consumer = bluebird.promisifyAll(new Consumer());
  consumer.on('consumer.up', consumerUpMock);
  consumer.on('consumer.down', consumerDownMock);
  consumer.on('consumer.goingDown', consumerGoingDownMock);
  consumer.on('consumer.goingUp', consumerGoingUpMock);

  await consumer.runAsync();
  await consumer.shutdownAsync();

  expect(consumerGoingUpMock).toHaveBeenCalledTimes(1);
  expect(consumerUpMock).toHaveBeenCalledTimes(1);
  expect(consumerGoingDownMock).toHaveBeenCalledTimes(1);
  expect(consumerDownMock).toHaveBeenCalledTimes(1);
});
