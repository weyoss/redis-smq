/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueDeliveryModel, EQueueType } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../../tests/common/config.js';
import { createQueue } from '../../../../tests/common/create-queue.js';
import { saveConsumerGroup } from '../../../../tests/common/save-consumer-group.js';
import { TResponse } from '../../../../tests/types/index.js';
import { DeleteConsumerGroupControllerResponseDTO } from '../../dto/controllers/consumer-groups/DeleteConsumerGroupControllerResponseDTO.js';
import { GetConsumerGroupsControllerResponseDTO } from '../../dto/controllers/consumer-groups/GetConsumerGroupsControllerResponseDTO.js';

describe('deleteConsumerGroupController', () => {
  it('HTTP 204 No Content', async () => {
    const { queue } = await createQueue(
      'q1',
      EQueueType.LIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    const consumerGroup1 = await saveConsumerGroup(queue, 'my-app-group1');
    const consumerGroup2 = await saveConsumerGroup(queue, 'my-app-group2');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<DeleteConsumerGroupControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/${consumerGroup1}`,
      );
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});

    const response2: TResponse<GetConsumerGroupsControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups`,
      );
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual([consumerGroup2].sort());
  });
});
