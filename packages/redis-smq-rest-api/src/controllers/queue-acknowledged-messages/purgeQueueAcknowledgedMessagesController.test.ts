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
import { publishAndAcknowledgeMessage } from '../../../tests/common/publish-and-acknowledge-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { PurgeQueueAcknowledgedMessagesControllerResponseDTO } from '../../dto/controllers/queue-acknowledged-messages/PurgeQueueAcknowledgedMessagesControllerResponseDTO.js';

describe('purgeQueueAcknowledgedMessagesController', () => {
  it('HTTP 204 No Content', async () => {
    const { queue } = await createQueue('my-queue');
    await publishAndAcknowledgeMessage(queue);
    await publishAndAcknowledgeMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<PurgeQueueAcknowledgedMessagesControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/acknowledged-messages`,
      );
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
