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
import { CountQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/CountQueuePendingMessagesControllerResponseDTO.js';

describe('countQueuePendingMessagesController', () => {
  it('Point-2-Point: HTTP 200 OK', async () => {
    const { queue } = await createQueue('q1');
    await publishMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountQueuePendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/total-messages/pending`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(1);
  });

  it('PUB/SUB: HTTP 200 OK', async () => {
    const { queue } = await createQueue(
      'q1',
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    await createConsumerGroup(queue, 'group1');
    await createConsumerGroup(queue, 'group2');

    await publishMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountQueuePendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/total-messages/pending?consumerGroupId=group1`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(1);

    const response2: TResponse<CountQueuePendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/total-messages/pending?consumerGroupId=group2`,
      );
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual(1);
  });
});
