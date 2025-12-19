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
import { scheduleMessage } from '../../../tests/common/schedule-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { CountQueueScheduledMessagesControllerResponseDTO } from '../../dto/controllers/queue-scheduled-messages/CountQueueScheduledMessagesControllerResponseDTO.js';

describe('countQueueScheduledMessagesController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('q1');
    await scheduleMessage(queue);
    await scheduleMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<CountQueueScheduledMessagesControllerResponseDTO> =
      await request.get(
        `/api/v1/namespaces/${queue.ns}/queues/${queue.name}/total-messages/scheduled`,
      );
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(2);
  });
});
