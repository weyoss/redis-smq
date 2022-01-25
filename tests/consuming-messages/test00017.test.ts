import {
  defaultQueue,
  getMessageManagerFrontend,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../common';
import { promisifyAll } from 'bluebird';
import { config } from '../config';

test('Disable storing acknowledged and dead-lettered messages', async () => {
  const { producer, consumer } = await produceAndDeadLetterMessage(
    defaultQueue,
    {
      ...config,
      storeMessages: false,
    },
  );
  await producer.shutdownAsync();
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getDeadLetteredMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage(
    defaultQueue,
    {
      ...config,
      storeMessages: false,
    },
  );

  await p.shutdownAsync();
  await c.shutdownAsync();

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);
});
