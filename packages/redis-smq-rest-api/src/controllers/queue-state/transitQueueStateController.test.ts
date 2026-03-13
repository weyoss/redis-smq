/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { createQueue } from '../../../tests/common/create-queue.js';
import supertest from 'supertest';
import { config } from '../../../tests/common/config.js';
import { TResponse } from '../../../tests/types/index.js';
import { TransitQueueStateControllerRequestBodyDTO } from '../../dto/controllers/queue-state/TransitQueueStateControllerRequestBodyDTO.js';
import { TransitQueueStateControllerResponseDTO } from '../../dto/controllers/queue-state/TransitQueueStateControllerResponseDTO.js';
import { pauseQueue } from '../../../tests/common/pause-queue.js';
import { EQueueOperationalState } from 'redis-smq';

describe('transitQueueStateController', () => {
  it('pause: HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const requestBody: TransitQueueStateControllerRequestBodyDTO = {
      state: 'pause',
      options: {
        description: 'test pause',
        metadata: {
          hello: 'world',
        },
      },
    };

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<TransitQueueStateControllerResponseDTO> =
      await request
        .patch(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/state`)
        .send(requestBody);

    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      from: EQueueOperationalState.ACTIVE,
      to: EQueueOperationalState.PAUSED,
      reason: 'MANUAL',
      description: 'test pause',
      timestamp: response1.body?.data?.timestamp,
      metadata: { hello: 'world' },
    });
  });

  it('stop: HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const requestBody: TransitQueueStateControllerRequestBodyDTO = {
      state: 'stop',
      options: {
        description: 'test stop',
        metadata: {
          hello: 'world',
        },
      },
    };

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<TransitQueueStateControllerResponseDTO> =
      await request
        .patch(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/state`)
        .send(requestBody);

    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      from: EQueueOperationalState.ACTIVE,
      to: EQueueOperationalState.STOPPED,
      reason: 'MANUAL',
      description: 'test stop',
      timestamp: response1.body?.data?.timestamp,
      metadata: { hello: 'world' },
    });
  });

  it('resume: HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    await pauseQueue(queue);

    const requestBody: TransitQueueStateControllerRequestBodyDTO = {
      state: 'resume',
      options: {
        description: 'test resume',
        metadata: {
          hello: 'world',
        },
      },
    };

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<TransitQueueStateControllerResponseDTO> =
      await request
        .patch(`/api/v1/namespaces/${queue.ns}/queues/${queue.name}/state`)
        .send(requestBody);

    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual({
      from: EQueueOperationalState.PAUSED,
      to: EQueueOperationalState.ACTIVE,
      reason: 'MANUAL',
      description: 'test resume',
      timestamp: response1.body?.data?.timestamp,
      metadata: { hello: 'world' },
    });
  });
});
