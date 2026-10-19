/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { MessageStatus } from '../MessageStatus.js';

/**
 * Query parameters of `GET …/messages/purge/:jobId`.
 *
 * `status` selects the message category the purge was started under.
 * It is optional: when omitted, the handler searches every category
 * and returns the first match. When provided, the lookup is a single
 * Redis read against that one category.
 */
export type GetPurgeJobControllerRequestQueryDTO = {
  status?: MessageStatus;
};
