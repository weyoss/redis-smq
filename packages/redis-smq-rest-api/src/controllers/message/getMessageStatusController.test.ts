/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePropertyStatus } from 'redis-smq';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { createQueue } from '../../../tests/common/create-queue.js';
import { publishMessage } from '../../../tests/common/publish-message.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetMessageStatusControllerResponseDTO } from '../../dto/controllers/messages/GetMessageStatusControllerResponseDTO.js';

describe('getMessageStatusController', () => {
  it('HTTP 200 OK', async () => {
    await createQueue('my-queue');
    const [messageId] = await publishMessage('my-queue');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetMessageStatusControllerResponseDTO> =
      await request.get(`/api/v1/messages/${messageId}/status`);
    expect(response1.status).toEqual(200);
    expect(response1.body?.data).toEqual(EMessagePropertyStatus.PENDING);
  });
});
