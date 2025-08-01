/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { consumerErrors } from './errors/consumerErrors.js';
import { consumerGroupsErrors } from './errors/consumerGroupsErrors.js';
import { exchangeErrors } from './errors/exchangeErrors.js';
import { messageErrors } from './errors/messageErrors.js';
import { namespaceErrors } from './errors/namespaceErrors.js';
import { producerErrors } from './errors/producerErrors.js';
import { queueErrors } from './errors/queueErrors.js';
import { queueMessagesErrors } from './errors/queueMessagesErrors.js';
import { queueRateErrors } from './errors/queueRateErrors.js';
import { routerErrors } from './errors/routerErrors.js';

export const errors = {
  ...consumerErrors,
  ...consumerGroupsErrors,
  ...exchangeErrors,
  ...messageErrors,
  ...namespaceErrors,
  ...producerErrors,
  ...queueErrors,
  ...queueMessagesErrors,
  ...queueRateErrors,
  ...routerErrors,
} as const;
