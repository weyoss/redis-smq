/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getProducer } from '../../common/producer';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Producer: isRunning, isGoingUp, isGoingDown, isUp, isDown', async () => {
  const mProducer = getProducer();
  await mProducer.runAsync();

  expect(typeof mProducer.getId()).toBe('string');
  if (mProducer.isGoingUp()) {
    await new Promise<void>((resolve) => {
      mProducer.once('up', resolve);
    });
  }
  await shutDownBaseInstance(mProducer);
  expect(mProducer.isRunning()).toBe(false);
  expect(mProducer.isGoingUp()).toBe(false);
  expect(mProducer.isGoingDown()).toBe(false);
  expect(mProducer.isUp()).toBe(false);
  expect(mProducer.isDown()).toBe(true);
  await mProducer.runAsync();
  expect(mProducer.isRunning()).toBe(true);
  expect(mProducer.isGoingUp()).toBe(false);
  expect(mProducer.isGoingDown()).toBe(false);
  expect(mProducer.isUp()).toBe(true);
  expect(mProducer.isDown()).toBe(false);
  await shutDownBaseInstance(mProducer);
});
