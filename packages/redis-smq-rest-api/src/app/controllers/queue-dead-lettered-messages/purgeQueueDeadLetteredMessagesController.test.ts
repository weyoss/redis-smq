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
import { publishAndDeadLetterMessage } from '../../../../tests/common/publish-and-dead-letter-message.js';
import { TResponse } from '../../../../tests/types/index.js';
import { PurgeQueueDeadLetteredMessagesControllerResponseDTO } from '../../dto/controllers/queue-dead-lettered-messages/PurgeQueueDeadLetteredMessagesControllerResponseDTO.js';

describe('purgeQueueDeadLetteredMessagesController', () => {
  it('HTTP 204 No Content', async () => {
    const { queue } = await createQueue('my-queue');
    await publishAndDeadLetterMessage(queue);
    await publishAndDeadLetterMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<PurgeQueueDeadLetteredMessagesControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/dead-lettered-messages`,
      );
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
