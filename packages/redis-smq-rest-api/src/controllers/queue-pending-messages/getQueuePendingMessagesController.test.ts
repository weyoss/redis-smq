/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueDeliveryModel, EQueueType } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createConsumerGroup } from '../../../tests/common/create-consumer-group.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { publishMessage } from '../../../tests/common/publish-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetQueuePendingMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerRequestQueryDTO.js';
import { GetQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerResponseDTO.js';

describe('getQueuePendingMessagesController', () => {
  it('Point-2-Point: HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const [id1] = await publishMessage(queue);
    const [id2] = await publishMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const queryParams: GetQueuePendingMessagesControllerRequestQueryDTO = {
      pageSize: 10,
      page: 1,
    };
    const response1: TResponse<GetQueuePendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/pending-messages`,
        )
        .query(queryParams);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(2);
    expect(response1.body?.data?.items.map((i) => i.id).sort()).toEqual(
      [id1, id2].sort(),
    );
  });

  it('PUB/SUB: HTTP 200 OK', async () => {
    const { queue } = await createQueue(
      'q1',
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    await createConsumerGroup(queue, 'group1');
    await createConsumerGroup(queue, 'group2');

    const ids = await publishMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const queryParams1: GetQueuePendingMessagesControllerRequestQueryDTO = {
      pageSize: 10,
      page: 1,
      consumerGroupId: 'group1',
    };
    const response1: TResponse<GetQueuePendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/pending-messages`,
        )
        .query(queryParams1);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(1);

    //
    const id1 = response1.body?.data?.items[0].id || '';
    expect(ids.includes(id1)).toBe(true);

    const queryParams2: GetQueuePendingMessagesControllerRequestQueryDTO = {
      pageSize: 10,
      page: 1,
      consumerGroupId: 'group2',
    };
    const response2: TResponse<GetQueuePendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/pending-messages`,
        )
        .query(queryParams2);
    expect(response2.status).toEqual(200);
    expect(response2.body?.data?.totalItems).toEqual(1);

    //
    const id2 = response2.body?.data?.items[0].id || '';
    expect(ids.includes(id2)).toBe(true);

    //
    expect([id1, id2].sort()).toEqual(ids.sort());
  });
});
