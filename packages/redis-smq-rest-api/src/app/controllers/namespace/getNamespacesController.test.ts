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
import { createQueue } from '../../../../tests/common/create-queue.js';
import { TResponse } from '../../../../tests/types/index.js';
import { GetNamespacesControllerResponseDTO } from '../../dto/controllers/namespaces/GetNamespacesControllerResponseDTO.js';

describe('getNamespacesController', () => {
  it('HTTP 200 OK', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetNamespacesControllerResponseDTO> =
      await request.get('/api/v1/namespaces');
    expect(response1.status).toEqual(200);
    expect(response1.body).toEqual({ data: [] });

    const { queue: q1 } = await createQueue({ ns: 'ns1', name: 'q1' });
    const { queue: q2 } = await createQueue({ ns: 'ns2', name: 'q1' });

    const response2: TResponse<GetNamespacesControllerResponseDTO> =
      await request.get('/api/v1/namespaces');
    expect(response2.status).toEqual(200);
    expect(response2.body?.data?.sort()).toEqual([q1.ns, q2.ns].sort());
  });
});
