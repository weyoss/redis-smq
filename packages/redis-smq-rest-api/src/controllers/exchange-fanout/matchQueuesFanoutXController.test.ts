/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParams } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { bindQueueFanout } from '../../../tests/common/bind-queue.js';
import { createFanoutExchange } from '../../../tests/common/create-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { MatchQueuesFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/MatchQueuesFanoutXControllerResponseDTO.js';

describe('matchQueuesFanoutXController', () => {
  it('HTTP 200 OK', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-fanout',
    };
    await createFanoutExchange(exchange);
    const { queue: q1 } = await createQueue({ ns, name: 'q1' });
    const { queue: q2 } = await createQueue({ ns, name: 'q2' });

    await bindQueueFanout(q1, exchange);
    await bindQueueFanout(q2, exchange);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<MatchQueuesFanoutXControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${exchange.ns}/exchanges/fanout/${exchange.name}/queues`,
      );
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
