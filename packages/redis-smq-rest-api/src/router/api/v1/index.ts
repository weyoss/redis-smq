/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TRouterResourceMap } from '../../../lib/router/types/index.js';
import { exchanges } from './exchanges.js';
import { messages } from './messages.js';
import { namespaces } from './namespaces.js';
import { queues } from './queues.js';

export const v1: TRouterResourceMap = {
  path: 'v1',
  resource: [queues, namespaces, messages, exchanges],
};
