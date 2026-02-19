/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
} from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { TResponse } from '../../../tests/types/index.js';
import { CreateQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/CreateQueueControllerRequestBodyDTO.js';
import { CreateQueueControllerResponseDTO } from '../../dto/controllers/queues/CreateQueueControllerResponseDTO.js';
import { GetAllQueuesControllerResponseDTO } from '../../dto/controllers/queues/GetAllQueuesControllerResponseDTO.js';

describe('createQueueController', () => {
  it('HTTP 201 Created', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const requestBody: CreateQueueControllerRequestBodyDTO = {
      queue: {
        ns: 'my-app',
        name: 'my-queue',
      },
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
      queueType: EQueueType.LIFO_QUEUE,
    };
    const response1: TResponse<CreateQueueControllerResponseDTO> = await request
      .post('/api/v1/queues')
      .send(requestBody);
    expect(response1.status).toEqual(201);
    expect(response1.body).toEqual({
      data: {
        queue: requestBody.queue,
        properties: {
          deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
          queueType: EQueueType.LIFO_QUEUE,
          rateLimit: null,
          messagesCount: 0,
          acknowledgedMessagesCount: 0,
          deadLetteredMessagesCount: 0,
          delayedMessagesCount: 0,
          requeuedMessagesCount: 0,
          pendingMessagesCount: 0,
          scheduledMessagesCount: 0,
          processingMessagesCount: 0,
          lockId: null,
          operationalState: EQueueOperationalState.ACTIVE,
          lastStateChangeAt: response1.body?.data?.properties.lastStateChangeAt,
        },
      },
    });

    const response2: TResponse<GetAllQueuesControllerResponseDTO> =
      await request.get('/api/v1/queues');
    expect(response2.status).toEqual(200);
    expect(response2.body).toEqual({ data: [requestBody.queue] });
  });
});
