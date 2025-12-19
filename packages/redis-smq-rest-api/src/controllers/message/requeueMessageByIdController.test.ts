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
import { publishAndDeadLetterMessage } from '../../../tests/common/publish-and-dead-letter-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { RequeueMessageByIdControllerResponseDTO } from '../../dto/controllers/messages/RequeueMessageByIdControllerResponseDTO.js';

describe('requeueMessageByIdController', () => {
  it('HTTP 204 No Content', async () => {
    await createQueue('my-queue');
    const [messageId] = await publishAndDeadLetterMessage('my-queue');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<RequeueMessageByIdControllerResponseDTO> =
      await request.post(`/api/v1/messages/${messageId}/requeue`);
    expect(response1.status).toEqual(204);
    expect(response1.body).toEqual({});
  });
});
