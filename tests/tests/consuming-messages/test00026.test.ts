import { delay } from 'bluebird';
import { merge } from 'lodash';
import { config } from '../../common/config';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';

test('Message storage: acknowledged.expire = 10000', async () => {
  const cfg = merge(config, {
    messages: {
      store: {
        acknowledged: {
          expire: 20000,
        },
      },
    },
  });

  const messageManager = await getMessageManager();
  await createQueue(defaultQueue, false);
  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );

  await p.shutdownAsync();
  await c.shutdownAsync();

  const res1 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);

  await delay(20000);

  const res2 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);
});
