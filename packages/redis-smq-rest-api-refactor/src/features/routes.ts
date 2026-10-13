/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../http/index.js';
import { getConfigurationRoute } from './configuration/get/route.js';
import { updateConfigurationRoute } from './configuration/update/route.js';
import { getExchangesRoute } from './exchanges/list/route.js';
import { pingRoute } from './ping/route.js';
import { createQueueRoute } from './queues/create/route.js';
import { getAllQueuesRoute } from './queues/list/route.js';

export const routes: RouteDefinition[] = [
  // Configuration
  getConfigurationRoute,
  updateConfigurationRoute,

  // Exchanges
  getExchangesRoute,

  // Queues
  getAllQueuesRoute,
  createQueueRoute,

  // Diagnostics
  pingRoute,
];
