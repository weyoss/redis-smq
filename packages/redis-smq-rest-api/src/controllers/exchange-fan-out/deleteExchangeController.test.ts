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
import { SaveExchangeControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/SaveExchangeControllerResponseDTO.js';
import { DeleteExchangeControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/DeleteExchangeControllerResponseDTO.js';

describe('deleteExchangeController', () => {
  it('HTTP 204 No Content', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);

    const response1: TResponse<SaveExchangeControllerResponseDTO> =
      await request
        .post(`/api/v1/exchanges/fan-out`)
        .send({ fanOutName: 'my-fan-out' });
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});

    const response2: TResponse<DeleteExchangeControllerResponseDTO> =
      await request.delete(`/api/v1/exchanges/fan-out/my-fan-out`);
    expect(response2.status).toEqual(204);
    expect(response2.body).toEqual({});
  });
});
