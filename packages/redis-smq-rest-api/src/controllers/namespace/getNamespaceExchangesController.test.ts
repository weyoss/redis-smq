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
import { TResponse } from '../../../tests/types/index.js';
import { createDirectExchange } from '../../../tests/common/create-exchange.js';
import { GetNamespaceExchangesControllerResponseDTO } from '../../dto/controllers/namespaces/GetNamespaceExchangesControllerResponseDTO.js';
import { EExchangeType } from 'redis-smq';

describe('getNamespaceExchangesController', () => {
  it('HTTP 200 OK', async () => {
    const ns = 'ns1';
    const ex1 = { ns, name: 'ex1' };
    await createDirectExchange(ex1);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetNamespaceExchangesControllerResponseDTO> =
      await request.get('/api/v1/namespaces/ns1/exchanges');
    expect(response1.status).toEqual(200);
    expect(response1.body).toEqual({
      data: [{ ...ex1, type: EExchangeType.DIRECT }],
    });
  });
});
