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
import { createQueue } from '../../../tests/common/create-queue.js';
import { publishAndAcknowledgeMessage } from '../../../tests/common/publish-and-acknowledge-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetQueueAcknowledgedMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-acknowledged-messages/GetQueueAcknowledgedMessagesControllerRequestQueryDTO.js';
import { GetQueueAcknowledgedMessagesControllerResponseDTO } from '../../dto/controllers/queue-acknowledged-messages/GetQueueAcknowledgedMessagesControllerResponseDTO.js';

describe('getQueueAcknowledgedMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const [id1] = await publishAndAcknowledgeMessage(queue);
    const [id2] = await publishAndAcknowledgeMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const queryParams: GetQueueAcknowledgedMessagesControllerRequestQueryDTO = {
      pageSize: 10,
      page: 1,
    };
    const response1: TResponse<GetQueueAcknowledgedMessagesControllerResponseDTO> =
      await request
        .get(
          `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/acknowledged-messages`,
        )
        .query(queryParams);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data?.totalItems).toEqual(2);
    expect(response1.body?.data?.items.map((i) => i.id).sort()).toEqual(
      [id1, id2].sort(),
    );
  });
});
