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
import { bindQueue } from '../../../../tests/common/bind-queue.js';
import { createFanOutExchange } from '../../../../tests/common/create-fan-out-exchange.js';
import { createQueue } from '../../../../tests/common/create-queue.js';
import { TResponse } from '../../../../tests/types/index.js';
import { GetAllExchangesControllerRequestQueryDTO } from '../../dto/controllers/exchange-fan-out/GetAllExchangesControllerRequestQueryDTO.js';
import { GetAllExchangesControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/GetAllExchangesControllerResponseDTO.js';

describe('getAllExchangesController', () => {
  it('HTTP 200 OK', async () => {
    const exchange1 = await createFanOutExchange('my-fan-out1');
    const exchange2 = await createFanOutExchange('my-fan-out2');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetAllExchangesControllerResponseDTO> =
      await request.get(`/api/v1/exchanges/fan-out-exchanges`);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.sort()).toEqual([exchange1, exchange2].sort());

    const { queue } = await createQueue('q1');
    await bindQueue(queue, exchange1);

    const queryParams: GetAllExchangesControllerRequestQueryDTO = queue;
    const response2: TResponse<GetAllExchangesControllerResponseDTO> =
      await request
        .get(`/api/v1/exchanges/fan-out-exchanges`)
        .query(queryParams);
    expect(response2.status).toEqual(200);
    expect(response2.body?.data).toEqual([exchange1]);
  });
});
