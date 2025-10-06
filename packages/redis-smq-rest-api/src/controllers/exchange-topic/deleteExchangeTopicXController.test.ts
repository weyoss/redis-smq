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
import { createTopicExchange } from '../../../tests/common/create-exchange.js';
import { TResponse } from '../../../tests/types/index.js';
import { DeleteExchangeTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/DeleteExchangeTopicXControllerResponseDTO.js';

describe('deleteExchangeTopicXController', () => {
  it('HTTP 204 No Content', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-topic',
    };
    await createTopicExchange(exchange);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response: TResponse<DeleteExchangeTopicXControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${exchange.ns}/exchanges/topic/${exchange.name}`,
      );
    expect(response.status).toEqual(204);
    expect(response.body).toEqual({});
  });
});
