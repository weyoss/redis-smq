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
import { deleteMessageByIdRoute } from './messages/delete-by-id/route.js';
import { deleteMessagesByIdsRoute } from './messages/delete-by-ids/route.js';
import { getMessageByIdRoute } from './messages/get-by-id/route.js';
import { getMessagesByIdsRoute } from './messages/get-by-ids/route.js';
import { getMessageStatusRoute } from './messages/get-status/route.js';
import { getMessageUnacknowledgementHistoryRoute } from './messages/get-unack-history/route.js';
import { publishMessageRoute } from './messages/publish/route.js';
import { requeueMessageByIdAliasRoute } from './messages/requeue-by-id/alias-route.js';
import { requeueMessageByIdRoute } from './messages/requeue-by-id/route.js';
import { pingRoute } from './ping/route.js';
import { countQueueMessagesRoute } from './queue-messages/count/route.js';
import { getQueueMessagesRoute } from './queue-messages/get/route.js';
import { purgeQueueMessagesRoute } from './queue-messages/purge/route.js';
import { createQueueRoute } from './queues/create/route.js';
import { getAllQueuesRoute } from './queues/list/route.js';
import { getNamespaceExchangesRoute } from './namespace-exchanges/list/route.js';
import { getExchangeRoute } from './namespace-exchanges/get/route.js';
import { deleteExchangeRoute } from './namespace-exchanges/delete/route.js';
import { matchQueuesRoute } from './namespace-exchanges/match-queues/route.js';
import { getRoutingKeysRoute } from './namespace-exchanges/get-routing-keys/route.js';
import { getRoutingPatternsRoute } from './namespace-exchanges/get-routing-patterns/route.js';
import { getBindingsRoute } from './namespace-exchanges/get-bindings/route.js';
import { bindQueueRoute } from './namespace-exchanges/bind-queue/route.js';
import { unbindQueueRoute } from './namespace-exchanges/unbind-queue/route.js';
import { getQueuePropertiesRoute } from './queue-properties/get/route.js';
import { checkQueueExistenceRoute } from './queue-properties/check-existence/route.js';
import { deleteQueueRoute } from './queue-properties/delete/route.js';
import { getQueueStateRoute } from './queue-state/get/route.js';
import { transitQueueStateRoute } from './queue-state/transit/route.js';
import { getQueueStateHistoryRoute } from './queue-state/get-history/route.js';

export const routes: RouteDefinition[] = [
  // Configuration
  getConfigurationRoute,
  updateConfigurationRoute,

  // Exchanges
  getExchangesRoute,

  // Messages
  publishMessageRoute,
  getMessagesByIdsRoute,
  deleteMessagesByIdsRoute,
  getMessageByIdRoute,
  deleteMessageByIdRoute,
  requeueMessageByIdRoute,
  requeueMessageByIdAliasRoute,
  getMessageStatusRoute,
  getMessageUnacknowledgementHistoryRoute,

  // Queue Messages
  getQueueMessagesRoute,
  purgeQueueMessagesRoute,
  countQueueMessagesRoute,

  // Queues
  getAllQueuesRoute,
  createQueueRoute,

  // Namespace Exchanges
  getNamespaceExchangesRoute,
  getExchangeRoute,
  deleteExchangeRoute,
  matchQueuesRoute,
  getRoutingKeysRoute,
  getRoutingPatternsRoute,
  getBindingsRoute,
  bindQueueRoute,
  unbindQueueRoute,

  // Queue Properties
  getQueuePropertiesRoute,
  deleteQueueRoute,
  checkQueueExistenceRoute,

  // Queue State
  getQueueStateRoute,
  transitQueueStateRoute,
  getQueueStateHistoryRoute,

  // Diagnostics
  pingRoute,
];
