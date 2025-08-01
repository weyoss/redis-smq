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
import { bindQueue } from '../../../tests/common/bind-queue.js';
import { createFanOutExchange } from '../../../tests/common/create-fan-out-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetQueuesControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/GetQueuesControllerResponseDTO.js';

describe('getQueuesController', () => {
  it('HTTP 200 OK', async () => {
    const exchange = await createFanOutExchange('my-fan-out');
    const { queue: q1 } = await createQueue({ ns: 'ns1', name: 'q1' });
    const { queue: q2 } = await createQueue({ ns: 'ns1', name: 'q2' });

    await bindQueue(q1, exchange);
    await bindQueue(q2, exchange);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetQueuesControllerResponseDTO> =
      await request.get(`/api/v1/exchanges/fan-out/${exchange}/queues`);
    expect(response1.status).toEqual(200);
    expect(
      response1.body?.data?.sort((a, b) => {
        return `${a.name}@${a.ns}` > `${b.name}@${b.ns}` ? 1 : -1;
      }),
    ).toEqual(
      [q1, q2].sort((a, b) => {
        return `${a.name}@${a.ns}` > `${b.name}@${b.ns}` ? 1 : -1;
      }),
    );
  });
});
