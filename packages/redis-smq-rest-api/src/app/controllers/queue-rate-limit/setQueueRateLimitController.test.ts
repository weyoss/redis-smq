/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueRateLimit } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../../tests/common/config.js';
import { createQueue } from '../../../../tests/common/create-queue.js';
import { TResponse } from '../../../../tests/types/index.js';
import { GetQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/GetQueueRateLimitControllerResponseDTO.js';
import { SetQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/SetQueueRateLimitControllerResponseDTO.js';

describe('setQueueRateLimitController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const rateLimit: IQueueRateLimit = { limit: 8, interval: 60000 };
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<SetQueueRateLimitControllerResponseDTO> =
      await request
        .put(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/rate-limit`)
        .send(rateLimit);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(rateLimit);

    const response2: TResponse<GetQueueRateLimitControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/rate-limit`,
      );
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual(rateLimit);
  });
});
