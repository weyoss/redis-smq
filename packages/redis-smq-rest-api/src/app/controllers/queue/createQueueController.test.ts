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
import { TResponse } from '../../../../tests/types/index.js';
import { GetAllExchangesControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/GetAllExchangesControllerResponseDTO.js';
import { CreateQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/CreateQueueControllerRequestBodyDTO.js';
import { CreateQueueControllerResponseDTO } from '../../dto/controllers/queues/CreateQueueControllerResponseDTO.js';

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
          exchange: null,
          messagesCount: 0,
        },
      },
    });

    const response2: TResponse<GetAllExchangesControllerResponseDTO> =
      await request.get('/api/v1/queues');
    expect(response2.status).toEqual(200);
    expect(response2.body).toEqual({ data: [requestBody.queue] });
  });
});
