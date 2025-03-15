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
import { publishMessage } from '../../../../tests/common/publish-message.js';
import { TResponse } from '../../../../tests/types/index.js';
import { GetQueuePendingMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerRequestQueryDTO.js';
import { GetQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerResponseDTO.js';

describe('getQueuePendingMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const [id1] = await publishMessage(queue);
    const [id2] = await publishMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const queryParams: GetQueuePendingMessagesControllerRequestQueryDTO = {
      pageSize: 10,
      cursor: 0,
    };
    const response1: TResponse<GetQueuePendingMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/pending-messages`,
        )
        .query(queryParams);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(2);
    expect(response1.body?.data?.cursor).toEqual(0);
    expect(response1.body?.data?.items.map((i) => i.id).sort()).toEqual(
      [id1, id2].sort(),
    );
  });
});
