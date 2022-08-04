import { merge } from 'lodash';
import { config } from '../../common/config';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Message storage: acknowledged = false, deadLettered = true', async () => {
  const cfg = merge(config, {
    messages: {
      store: {
        acknowledged: false,
        deadLettered: true,
      },
    },
  });
  await createQueue(defaultQueue, false);
  const { producer, consumer } = await produceAndDeadLetterMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(producer);
  await shutDownBaseInstance(consumer);
  const messageManager = await getMessageManager();
  const res1 = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);

  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const res2 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);
});
