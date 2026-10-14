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
 * Query parameters of `GET …/messages/count`.
 *
 * When `groupBy === 'status'`, the endpoint returns a map of
 * status → count instead of a single number. In that mode `status`
 * is ignored — the aggregate browser produces the map. When `groupBy`
 * is omitted, `status` selects which browser's count is returned
 * (defaulting to the aggregate published count).
 */
export type CountQueueMessagesControllerRequestQueryDTO = {
  status?: MessageStatus;
  groupBy?: 'status';
};
