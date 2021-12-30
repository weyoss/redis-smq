import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';
import { events } from '../../src/system/common/events';

test('MultiQueueProducer: Case 2', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  expect(typeof mProducer.getId()).toBe('string');
  if (mProducer.isGoingUp()) {
    await new Promise((resolve) => {
      mProducer.once(events.UP, resolve);
    });
  }
  await mProducer.shutdownAsync();
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
  await mProducer.shutdownAsync();
});
