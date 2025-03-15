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
import { scheduleMessage } from '../../../../tests/common/schedule-message.js';
import { TResponse } from '../../../../tests/types/index.js';
import { PurgeQueueScheduledMessagesControllerResponseDTO } from '../../dto/controllers/queue-scheduled-messages/PurgeQueueScheduledMessagesControllerResponseDTO.js';

describe('purgeQueueScheduledMessagesController', () => {
  it('HTTP 204 Not Content', async () => {
    const { queue } = await createQueue('my-queue');
    await scheduleMessage(queue);
    await scheduleMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<PurgeQueueScheduledMessagesControllerResponseDTO> =
      await request.delete(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/scheduled-messages`,
      );
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
