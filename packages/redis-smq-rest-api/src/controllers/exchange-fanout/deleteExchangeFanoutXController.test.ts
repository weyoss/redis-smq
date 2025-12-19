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
import { createFanoutExchange } from '../../../tests/common/create-exchange.js';
import { TResponse } from '../../../tests/types/index.js';
import { DeleteExchangeFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/DeleteExchangeFanoutXControllerResponseDTO.js';

describe('deleteExchangeFanoutXController', () => {
  it('HTTP 204 No Content', async () => {
    const ns = 'ns1';
    const exchange: IExchangeParams = {
      ns,
      name: 'my-fanout',
    };
    await createFanoutExchange(exchange);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response: TResponse<DeleteExchangeFanoutXControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${exchange.ns}/exchanges/fanout/${exchange.name}`,
      );
    expect(response.status).toEqual(204);
    expect(response.body).toEqual({});
  });
});
