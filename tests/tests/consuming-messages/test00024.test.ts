import { merge } from 'lodash';
import { config } from '../../common/config';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { Configuration } from '../../../src/config/configuration';

test('Message storage: acknowledged = true, deadLettered = false', async () => {
  const cfg = merge(config, {
    messages: {
      store: {
        acknowledged: true,
        deadLettered: false,
      },
    },
  });
  Configuration.reset();
  Configuration.getSetConfig(cfg);

  await createQueue(defaultQueue, false);
  const { producer, consumer } = await produceAndDeadLetterMessage(
    defaultQueue,
  );
  await shutDownBaseInstance(producer);
  await shutDownBaseInstance(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res1 = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(0);
  expect(res1.items.length).toBe(0);

  const { producer: p, consumer: c } = await produceAndAcknowledgeMessage(
    defaultQueue,
  );

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);
});
