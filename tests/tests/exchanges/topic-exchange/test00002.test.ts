/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { isEqual } from '../../../common/util';
import { getTopicExchange } from '../../../common/exchange';
import { createQueue } from '../../../common/message-producing-consuming';

test('ExchangeTopic: matching queues', async () => {
  await createQueue({ ns: 'testing', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4.5.6' }, false);
  await createQueue({ ns: 'beta', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4' }, false);
  await createQueue({ ns: 'my_app', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'my_app', name: 'w123.2.4' }, false);

  const e1 = getTopicExchange('w123.2.4');
  const queues = await e1.getQueuesAsync();
  expect(
    isEqual(queues, [
      { ns: 'testing', name: 'w123.2.4.5' },
      { ns: 'testing', name: 'w123.2.4.5.6' },
      { ns: 'testing', name: 'w123.2.4' },
    ]),
  ).toBe(true);
  const e2 = getTopicExchange({ ns: 'my_app', topic: 'w123.2.4' });
  const queues2 = await e2.getQueuesAsync();
  expect(
    isEqual(queues2, [
      { ns: 'my_app', name: 'w123.2.4.5' },
      { ns: 'my_app', name: 'w123.2.4' },
    ]),
  ).toBe(true);
});
