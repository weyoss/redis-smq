/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { PauseQueueControllerResponseDTO } from '../../dto/controllers/queues/PauseQueueControllerResponseDTO.js';
import { PauseQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/PauseQueueControllerRequestBodyDTO.js';

describe('pauseQueueController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const requestBody: PauseQueueControllerRequestBodyDTO = {
      description: 'test pause',
      metadata: {
        hello: 'world',
      },
    };

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<PauseQueueControllerResponseDTO> = await request
      .post(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/pause`)
      .send(requestBody);

    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      from: 0,
      to: 1,
      reason: 'MANUAL',
      description: 'test pause',
      timestamp: response1.body?.data?.timestamp,
      metadata: { hello: 'world' },
    });
  });
});
