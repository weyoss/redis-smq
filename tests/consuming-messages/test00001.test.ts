import {
  createQueue,
  defaultQueue,
  getConsumer,
  untilConsumerIdle,
} from '../common';

test('Wait until a consumer is idle', async () => {
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
});
