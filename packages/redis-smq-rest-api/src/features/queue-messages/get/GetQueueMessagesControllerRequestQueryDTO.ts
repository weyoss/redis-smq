/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageStatus } from '../MessageStatus.js';

/**
 * Query parameters of `GET …/messages`.
 *
 * `page` and `pageSize` are required; the schema generator with
 * `--required` enforces them at the HTTP boundary. `status` is
 * optional — omitting it delegates to the aggregate published-messages
 * browser, which is the same default the original package used.
 */
export type GetQueueMessagesControllerRequestQueryDTO = {
  page: number;
  pageSize: number;
  status?: MessageStatus;
};
