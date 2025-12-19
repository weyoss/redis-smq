/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParams } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createDirectExchange } from '../../../tests/common/create-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { BindQueueFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/BindQueueFanoutXControllerResponseDTO.js';

describe('bindQueueDirectXController', () => {
  it('HTTP 204 No Content', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-direct',
    };
    await createDirectExchange(exchange);
    const { queue } = await createQueue({ ns, name: 'q1' });

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<BindQueueFanoutXControllerResponseDTO> =
      await request
        .put(
          `/api/v1/namespaces/${exchange.ns}/exchanges/direct/${exchange.name}/queues/${queue.name}`,
        )
        .query({ routingKey: 'rk1' });
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
