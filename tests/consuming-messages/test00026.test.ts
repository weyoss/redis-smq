import {
  defaultQueue,
  getMessageManager,
  mockConfiguration,
  produceAndAcknowledgeMessage,
} from '../common';
import { delay, promisifyAll } from 'bluebird';

test('Message storage: acknowledged.expire = 10000', async () => {
  mockConfiguration({
    storeMessages: {
      acknowledged: {
        expire: 20000,
      },
    },
  });

  const messageManager = promisifyAll(await getMessageManager());
  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage();

  await p.shutdownAsync();
  await c.shutdownAsync();

  const res1 = await messageManager.getAcknowledgedMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);

  await delay(20000);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);
});
