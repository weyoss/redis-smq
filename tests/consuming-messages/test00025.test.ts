import {
  defaultQueue,
  getMessageManager,
  mockConfiguration,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Message storage: acknowledged = false, deadLettered = true', async () => {
  mockConfiguration({
    storeMessages: {
      acknowledged: false,
      deadLettered: true,
    },
  });
  const { producer, consumer } = await produceAndDeadLetterMessage();
  await producer.shutdownAsync();
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getDeadLetteredMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);

  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage();

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
