import { merge } from 'lodash';
import { config } from '../../common/config';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Message storage: acknowledged.queueSize = 3', async () => {
  const cfg = merge(config, {
    messages: {
      store: {
        acknowledged: {
          queueSize: 3,
        },
      },
    },
  });

  const messageManager = await getMessageManager();
  await createQueue(defaultQueue, false);
  const { consumer: c1, producer: p1 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c1);
  await shutDownBaseInstance(p1);

  const res1 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);

  const { consumer: c2, producer: p2 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c2);
  await shutDownBaseInstance(p2);

  const res2 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(2);
  expect(res2.items.length).toBe(2);

  const { consumer: c3, producer: p3 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c3);
  await shutDownBaseInstance(p3);

  const res3 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res3.total).toBe(3);
  expect(res3.items.length).toBe(3);

  const { consumer: c4, producer: p4 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c4);
  await shutDownBaseInstance(p4);

  const res4 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res4.total).toBe(3);
  expect(res4.items.length).toBe(3);
});
