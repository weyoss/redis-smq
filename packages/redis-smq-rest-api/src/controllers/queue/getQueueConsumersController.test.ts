/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Consumer } from 'redis-smq';
import { ICallback } from 'redis-smq-common';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetQueueConsumersControllerResponseDTO } from '../../dto/controllers/queues/GetQueueConsumersControllerResponseDTO.js';

describe('getQueueConsumersController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.consumeAsync(queue, (msg, cb: ICallback<void>) => {
      cb();
    });
    await consumer.runAsync();

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetQueueConsumersControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/consumers`,
      );
    expect(response1.status).toEqual(200);

    const data = response1.body?.data || {};
    expect(Object.keys(data)).toEqual([consumer.getId()]);
    expect(Object.keys(data[consumer.getId()]).sort()).toEqual(
      ['pid', 'ipAddress', 'hostname', 'createdAt'].sort(),
    );

    await consumer.shutdownAsync();
  });
});
