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
import { TResponse } from '../../../tests/types/index.js';
import { PublishMessageControllerRequestBodyDTO } from '../../dto/controllers/messages/PublishMessageControllerRequestBodyDTO.js';
import { PublishMessageControllerResponseDTO } from '../../dto/controllers/messages/PublishMessageControllerResponseDTO.js';
import { CreateQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/CreateQueueControllerRequestBodyDTO.js';

describe('publishMessageController', () => {
  it('HTTP 201 Created', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);

    const requestBody1: CreateQueueControllerRequestBodyDTO = {
      queue: {
        ns: 'my-app1',
        name: 'my-queue',
      },
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
      queueType: EQueueType.LIFO_QUEUE,
    };
    await request.post('/api/v1/queues').send(requestBody1);

    const requestBody2: PublishMessageControllerRequestBodyDTO = {
      message: {
        body: 'hello world',
      },
      exchange: { queue: requestBody1.queue },
    };
    const response: TResponse<PublishMessageControllerResponseDTO> =
      await request.post('/api/v1/messages').send(requestBody2);
    expect(response.status).toEqual(201);
    expect(response.body?.data?.length).toEqual(1);
    expect(typeof (response.body?.data || [])[0]).toEqual('string');
  });
});
