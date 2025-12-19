/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType, IExchangeParams } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import {
  createDirectExchange,
  createFanoutExchange,
  createTopicExchange,
} from '../../../tests/common/create-exchange.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetExchangesControllerResponseDTO } from '../../dto/controllers/exchanges/GetExchangesControllerResponseDTO.js';

describe('getExchangesController', () => {
  it('HTTP 200 OK', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetExchangesControllerResponseDTO> =
      await request.get('/api/v1/exchanges');
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual([]);

    const e1: IExchangeParams = {
      ns: 'ns1',
      name: 'e1',
    };
    const e2: IExchangeParams = {
      ns: 'ns2',
      name: 'e2',
    };
    const e3: IExchangeParams = {
      ns: 'ns3',
      name: 'e3',
    };

    await createDirectExchange(e1);
    await createFanoutExchange(e2);
    await createTopicExchange(e3);

    const response2: TResponse<GetExchangesControllerResponseDTO> =
      await request.get('/api/v1/exchanges');
    expect(response2.status).toEqual(200);
    expect(
      response2.body?.data?.sort((a, b) => {
        return `${a.name}@${a.ns}` > `${b.name}@${b.ns}` ? 1 : -1;
      }),
    ).toEqual(
      [
        {
          ...e1,
          type: EExchangeType.DIRECT,
        },
        {
          ...e2,
          type: EExchangeType.FANOUT,
        },
        {
          ...e3,
          type: EExchangeType.TOPIC,
        },
      ].sort((a, b) => {
        return `${a.name}@${a.ns}` > `${b.name}@${b.ns}` ? 1 : -1;
      }),
    );
  });
});
