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
import { GetMessagesByIdsControllerResponseDTO } from '../../dto/controllers/messages/GetMessagesByIdsControllerResponseDTO.js';

describe('getMessagesByIdsController', () => {
  it('HTTP 200 OK', async () => {
    await createQueue('my-queue');
    const [id1] = await publishMessage('my-queue');
    const [id2] = await publishMessage('my-queue');

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response2: TResponse<GetMessagesByIdsControllerResponseDTO> =
      await request.get(`/api/v1/messages`).query({
        ids: [id1, id2],
      });
    expect(response2.status).toEqual(200);
    expect(response2.body?.data?.length).toEqual(2);
    const pending = response2.body?.data?.map((i) => i.id);
    expect(pending).toEqual([id1, id2]);
  });
});
