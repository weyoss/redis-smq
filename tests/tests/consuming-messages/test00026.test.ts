import { delay } from 'bluebird';
import { merge } from 'lodash';
import { config } from '../../common/config';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { Configuration } from '../../../src/config/configuration';

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
  Configuration.reset();
  Configuration.getSetConfig(cfg);

  await createQueue(defaultQueue, false);
  const { producer: p, consumer: c } =
    await produceAndAcknowledgeMessage(defaultQueue);

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res1 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(1);
  expect(res1.items.length).toBe(1);

  await delay(20000);

  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);
});
