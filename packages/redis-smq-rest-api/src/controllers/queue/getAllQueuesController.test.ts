/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { MatchQueuesFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/MatchQueuesFanoutXControllerResponseDTO.js';

describe('getAllQueuesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue: q1 } = await createQueue('my-queue1');
    const { queue: q2 } = await createQueue('my-queue2');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<MatchQueuesFanoutXControllerResponseDTO> =
      await request.get('/api/v1/queues');
    expect(response1.status).toEqual(200);
    expect(
      response1.body?.data?.sort((a, b) => (a.name > b.name ? 1 : -1)),
    ).toEqual([q1, q2].sort((a, b) => (a.name > b.name ? 1 : -1)));
  });
});
