/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../../tests/common/config.js';
import { createQueue } from '../../../../tests/common/create-queue.js';
import { setRateLimit } from '../../../../tests/common/set-rate-limit.js';
import { TResponse } from '../../../../tests/types/index.js';
import { ClearQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/ClearQueueRateLimitControllerResponseDTO.js';
import { GetQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/GetQueueRateLimitControllerResponseDTO.js';

describe('clearQueueRateLimitController', () => {
  it('HTTP 204 No Content', async () => {
    const { queue } = await createQueue('my-queue');
    await setRateLimit(queue, { limit: 8, interval: 60000 });

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<ClearQueueRateLimitControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/rate-limit`,
      );
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});

    const response2: TResponse<GetQueueRateLimitControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/rate-limit`,
      );
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual(null);
  });
});
