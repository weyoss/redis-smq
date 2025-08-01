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
import { config } from '../../../tests/common/config.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { SaveConsumerGroupControllerResponseDTO } from '../../dto/controllers/consumer-groups/SaveConsumerGroupControllerResponseDTO.js';

describe('saveConsumerGroupController', () => {
  it('HTTP 204 No Content', async () => {
    const { queue } = await createQueue(
      'q1',
      EQueueType.LIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<SaveConsumerGroupControllerResponseDTO> =
      await request
        .post(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups`,
        )
        .send({
          consumerGroupId: 'my-app-group',
        });

    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
