/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createQueue } from '../../../tests/helpers/create-queue.js';
import { publishAndDeadLetterMessage } from '../../../tests/helpers/publish-and-dead-letter-message.js';
import { TResponse } from '../../../tests/helpers/types.js';
import { GetMessageUnacknowledgementHistoryControllerResponseDTO } from './GetMessageUnacknowledgementHistoryControllerResponseDTO.js';
import { config } from '../../../tests/helpers/config.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
} from 'redis-smq';

describe('getMessageUnacknowledgementHistoryController', () => {
  it('HTTP 200 OK', async () => {
    const { queue } = await createQueue('my-queue');
    const [messageId] = await publishAndDeadLetterMessage(queue);

    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response: TResponse<GetMessageUnacknowledgementHistoryControllerResponseDTO> =
      await request.get(`/api/messages/${messageId}/unack-history`);
    expect(response.status).toEqual(200);
    expect(response.body?.data?.length).toEqual(1);
    expect(response.body?.data?.[0].cause).toEqual(
      EMessageUnacknowledgementCause.UNACKNOWLEDGED,
    );
    expect(response.body?.data?.[0].deadLetterCause).toEqual(
      EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
    );
  });
});
