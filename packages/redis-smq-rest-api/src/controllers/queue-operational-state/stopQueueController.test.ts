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
import { StopQueueControllerRequestBodyDTO } from '../../dto/controllers/queue-operational-state/StopQueueControllerRequestBodyDTO.js';
import { StopQueueControllerResponseDTO } from '../../dto/controllers/queue-operational-state/StopQueueControllerResponseDTO.js';
import { EQueueOperationalState } from 'redis-smq';

describe('stopQueueController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const requestBody: StopQueueControllerRequestBodyDTO = {
      description: 'test stop',
      metadata: {
        hello: 'world',
      },
    };

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<StopQueueControllerResponseDTO> = await request
      .post(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/operational-state/stop`,
      )
      .send(requestBody);

    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      from: 0,
      to: EQueueOperationalState.STOPPED,
      reason: 'MANUAL',
      description: 'test stop',
      timestamp: response1.body?.data?.timestamp,
      metadata: { hello: 'world' },
    });
  });
});
