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
import { createQueue } from '../../../tests/common/create-queue.js';
import { publishMessage } from '../../../tests/common/publish-message.js';
import { saveConsumerGroup } from '../../../tests/common/save-consumer-group.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetConsumerGroupPendingMessagesControllerRequestQueryDTO } from '../../dto/controllers/consumer-groups/GetConsumerGroupPendingMessagesControllerRequestQueryDTO.js';
import { GetConsumerGroupPendingMessagesControllerResponseDTO } from '../../dto/controllers/consumer-groups/GetConsumerGroupPendingMessagesControllerResponseDTO.js';

describe('getConsumerGroupPendingMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue(
      'my-queue',
      EQueueType.LIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    const consumerGroup1 = await saveConsumerGroup(queue, 'my-group1');
    const consumerGroup2 = await saveConsumerGroup(queue, 'my-group2');

    const batch1 = await publishMessage(queue);
    expect(batch1.length).toEqual(2);

    const batch2 = await publishMessage(queue);
    expect(batch2.length).toEqual(2);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const queryParams: GetConsumerGroupPendingMessagesControllerRequestQueryDTO =
      {
        pageSize: 10,
        page: 1,
      };
    const response1: TResponse<GetConsumerGroupPendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/${consumerGroup1}/messages`,
        )
        .query(queryParams);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(2);
    const msg = response1.body?.data?.items;

    const response2: TResponse<GetConsumerGroupPendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/${consumerGroup2}/messages`,
        )
        .query(queryParams);
    expect(response2.status).toEqual(200);
    expect(response2.body?.data?.totalItems).toEqual(2);
    msg?.push(...(response2.body?.data?.items || []));

    //
    expect(msg?.map((i) => i.id).sort()).toEqual([...batch1, ...batch2].sort());
  });
});
