/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { createQueue } from '../../../tests/common/create-queue.js';
import { publishAndAcknowledgeMessage } from '../../../tests/common/publish-and-acknowledge-message.js';
import supertest from 'supertest';
import { config } from '../../../tests/common/config.js';
import { TResponse } from '../../../tests/types/index.js';
import { publishAndDeadLetterMessage } from '../../../tests/common/publish-and-dead-letter-message.js';
import { publishMessage } from '../../../tests/common/publish-message.js';
import { scheduleMessage } from '../../../tests/common/schedule-message.js';
import { CountQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/CountQueueMessagesControllerResponseDTO.js';
import { PurgeQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/PurgeQueueMessagesControllerResponseDTO.js';
import bluebird from 'bluebird';

describe('purgeQueueMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    await publishAndAcknowledgeMessage(queue);
    await publishAndDeadLetterMessage(queue);
    await publishMessage(queue);
    await scheduleMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountQueueMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(4);

    const response2: TResponse<PurgeQueueMessagesControllerResponseDTO> =
      await request
        .delete(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          status: 'pending',
        });
    expect(response2.status).toEqual(204);

    await bluebird.delay(5000);

    const response3: TResponse<PurgeQueueMessagesControllerResponseDTO> =
      await request
        .delete(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          status: 'acknowledged',
        });
    expect(response3.status).toEqual(204);

    await bluebird.delay(5000);

    const response4: TResponse<CountQueueMessagesControllerResponseDTO> =
      await request
        .delete(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          status: 'dead-lettered',
        });
    expect(response4.status).toEqual(204);

    await bluebird.delay(5000);

    const response5: TResponse<CountQueueMessagesControllerResponseDTO> =
      await request
        .delete(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          status: 'scheduled',
        });
    expect(response5.status).toEqual(204);

    await bluebird.delay(5000);

    const response6: TResponse<CountQueueMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
      );
    expect(response6.status).toEqual(200);
    expect(response6.body?.data).toEqual(0);

    const response7: TResponse<CountQueueMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
        )
        .query({
          groupBy: 'status',
        });
    expect(response7.status).toEqual(200);
    expect(response7.body?.data).toEqual({
      acknowledged: 0,
      deadLettered: 0,
      pending: 0,
      scheduled: 0,
    });
  });
});
