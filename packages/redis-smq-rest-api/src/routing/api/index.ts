/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TRouterResourceMap } from '../../lib/router/types/index.js';
import { configuration } from './configuration.js';
import { queues } from './queues.js';
import { namespaces } from './namespaces.js';
import { messages } from './messages.js';
import { exchanges } from './exchanges.js';

export const api: TRouterResourceMap = {
  path: 'api',
  resource: [configuration, queues, namespaces, messages, exchanges],
};
