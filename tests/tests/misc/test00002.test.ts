/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from '@jest/globals';
test('Consumer/Producer: handling async errors', async () => {
  /*
  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.messageHandlerError', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.consumeMessageError', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.dequeueMessageError', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.heartbeatError', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.workerError', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('consumer.error', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  await consumer.runAsync();
  expect(consumer.isRunning()).toBe(true);
  eventBus.emit('base.error', new Error(), consumer.getId());

  await bluebird.delay(5000);

  expect(consumer.isRunning()).toBe(false);
  expect(consumer.isDown()).toBe(true);

  const producer = bluebird.promisifyAll(new Producer());
  await producer.runAsync();
  expect(producer.isRunning()).toBe(true);
  eventBus.emit('producer.error', new Error(), producer.getId());

  await bluebird.delay(5000);

  expect(producer.isRunning()).toBe(false);
  expect(producer.isDown()).toBe(true);
   */
});
