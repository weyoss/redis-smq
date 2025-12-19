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
import { CountConsumerGroupPendingMessagesControllerResponseDTO } from '../../dto/controllers/consumer-groups/CountConsumerGroupPendingMessagesControllerResponseDTO.js';
import { errors } from '../../errors/errors.js';

describe('countConsumerGroupPendingMessagesController', () => {
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
    const response1: TResponse<CountConsumerGroupPendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/${consumerGroup1}/total-messages`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(2);

    const response2: TResponse<CountConsumerGroupPendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/${consumerGroup2}/total-messages`,
      );
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual(2);
  });

  it('HTTP 400 BAD REQUEST: InvalidQueueParametersError', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountConsumerGroupPendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/$$$/queues/@@@@/consumer-groups/******/total-messages`,
      );
    expect(response1.status).toEqual(errors.InvalidQueueParametersError[0]);
    expect(response1.body?.error?.code).toEqual(
      errors.InvalidQueueParametersError[0],
    );
    expect(response1.body?.error?.message).toEqual(
      'InvalidQueueParametersError',
    );
  });

  it('HTTP 400 BAD REQUEST: ConsumerGroupsNotSupportedError', async () => {
    const { queue } = await createQueue(
      'my-queue',
      EQueueType.LIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountConsumerGroupPendingMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups/gp1/total-messages`,
      );
    expect(response1.status).toEqual(errors.ConsumerGroupsNotSupportedError[0]);
    expect(response1.body?.error?.code).toEqual(
      errors.ConsumerGroupsNotSupportedError[0],
    );
    expect(response1.body?.error?.message).toEqual(
      'ConsumerGroupsNotSupportedError',
    );
  });
});
