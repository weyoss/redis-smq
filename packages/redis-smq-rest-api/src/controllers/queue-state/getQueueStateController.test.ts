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
import { GetQueueStateControllerResponseDTO } from '../../dto/controllers/queue-state/GetQueueStateControllerResponseDTO.js';

describe('getQueueStateController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetQueueStateControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/state`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      timestamp: response1.body?.data?.timestamp,
      from: null,
      to: 0,
      reason: 'SYSTEM_INIT',
      metadata: { queueType: 0, deliveryModel: 0 },
    });
  });
});
