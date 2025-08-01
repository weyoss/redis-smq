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
import { config } from '../../../tests/common/config.js';
import { createFanOutExchange } from '../../../tests/common/create-fan-out-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { BindQueueControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/BindQueueControllerResponseDTO.js';
import { UnbindQueueControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/UnbindQueueControllerResponseDTO.js';

describe('unbindQueueController', () => {
  it('HTTP 204 No Content', async () => {
    const exchange = await createFanOutExchange('my-fan-out');
    const { queue } = await createQueue({ ns: 'ns1', name: 'q1' });

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);

    const response1: TResponse<BindQueueControllerResponseDTO> = await request
      .put(`/api/v1/exchanges/fan-out/${exchange}/queues`)
      .send({ queue });
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});

    const response2: TResponse<UnbindQueueControllerResponseDTO> = await request
      .delete(`/api/v1/exchanges/fan-out/${exchange}/queues`)
      .query(queue);
    expect(response2.status).toEqual(204);
    expect(response2.body).toEqual({});
  });
});
