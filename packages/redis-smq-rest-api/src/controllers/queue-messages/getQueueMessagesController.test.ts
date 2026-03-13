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
import { GetQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/GetQueueMessagesControllerResponseDTO.js';
import { publishAndDeadLetterMessage } from '../../../tests/common/publish-and-dead-letter-message.js';
import { publishMessage } from '../../../tests/common/publish-message.js';
import { scheduleMessage } from '../../../tests/common/schedule-message.js';
import { EMessagePropertyStatus } from 'redis-smq';

describe('getQueueMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    await publishAndAcknowledgeMessage(queue);
    await publishAndDeadLetterMessage(queue);
    await publishMessage(queue);
    await scheduleMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
        });
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(4);
    expect(response1.body?.data?.items.length).toEqual(4);

    const response2: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
          status: 'pending',
        });
    expect(response2.status).toEqual(200);
    expect(response2.body?.data?.totalItems).toEqual(1);
    expect(response2.body?.data?.items.length).toEqual(1);
    expect(response2.body?.data?.items[0].status).toEqual(
      EMessagePropertyStatus.PENDING,
    );

    const response3: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
          status: 'acknowledged',
        });
    expect(response3.status).toEqual(200);
    expect(response3.body?.data?.totalItems).toEqual(1);
    expect(response3.body?.data?.items.length).toEqual(1);
    expect(response3.body?.data?.items[0].status).toEqual(
      EMessagePropertyStatus.ACKNOWLEDGED,
    );

    const response4: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
          status: 'dead-lettered',
        });
    expect(response4.status).toEqual(200);
    expect(response4.body?.data?.totalItems).toEqual(1);
    expect(response4.body?.data?.items.length).toEqual(1);
    expect(response4.body?.data?.items[0].status).toEqual(
      EMessagePropertyStatus.DEAD_LETTERED,
    );

    const response5: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
          status: 'scheduled',
        });
    expect(response5.status).toEqual(200);
    expect(response5.body?.data?.totalItems).toEqual(1);
    expect(response5.body?.data?.items.length).toEqual(1);
    expect(response5.body?.data?.items[0].status).toEqual(
      EMessagePropertyStatus.SCHEDULED,
    );

    const response6: TResponse<GetQueueMessagesControllerResponseDTO> =
      await request
        .get(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/messages`)
        .query({
          page: 1,
          pageSize: 10,
          status: 'published',
        });
    expect(response6.status).toEqual(200);
    expect(response6.body?.data?.totalItems).toEqual(4);
    expect(response6.body?.data?.items.length).toEqual(4);
  });
});
