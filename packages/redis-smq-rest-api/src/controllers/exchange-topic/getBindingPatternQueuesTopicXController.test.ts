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
import { bindQueueTopic } from '../../../tests/common/bind-queue.js';
import { createTopicExchange } from '../../../tests/common/create-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetBindingPatternQueuesTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/GetBindingPatternQueuesTopicXControllerResponseDTO.js';

describe('getBindingPatternQueuesTopicXController', () => {
  it('HTTP 200 OK', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-topic',
    };
    await createTopicExchange(exchange);
    const { queue: q1 } = await createQueue({ ns, name: 'q1' });

    await bindQueueTopic(q1, exchange, `rk1`);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetBindingPatternQueuesTopicXControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${exchange.ns}/exchanges/topic/${exchange.name}/binding-patterns/rk1/queues`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual([q1]);
  });
});
