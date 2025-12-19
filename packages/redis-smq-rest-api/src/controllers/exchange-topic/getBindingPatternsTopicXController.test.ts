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
import { bindQueueTopic } from '../../../tests/common/bind-queue.js';
import { config } from '../../../tests/common/config.js';
import { createTopicExchange } from '../../../tests/common/create-exchange.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { UnbindQueueTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/UnbindQueueTopicXControllerResponseDTO.js';

describe('getBindingPatternsTopicXController', () => {
  it('HTTP 200 OK', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-topic',
    };
    await createTopicExchange(exchange);
    const { queue } = await createQueue({ ns, name: 'q1' });

    //
    await bindQueueTopic(queue, exchange, 'rk1');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response: TResponse<UnbindQueueTopicXControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${exchange.ns}/exchanges/topic/${exchange.name}/binding-patterns`,
      );
    expect(response.status).toEqual(200);
    expect(response.body?.data).toEqual(['rk1']);
  });
});
