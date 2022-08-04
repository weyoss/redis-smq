import { events } from '../../../src/common/events/events';
import { getProducer } from '../../common/producer';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Producer: isRunning, isGoingUp, isGoingDown, isUp, isDown', async () => {
  const mProducer = getProducer();
  await mProducer.runAsync();

  expect(typeof mProducer.getId()).toBe('string');
  if (mProducer.isGoingUp()) {
    await new Promise((resolve) => {
      mProducer.once(events.UP, resolve);
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
