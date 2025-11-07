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
import { configuration } from './configuration.js';

export const v1: TRouterResourceMap = {
  path: 'v1',
  resource: [configuration, queues, namespaces, messages, exchanges],
};
