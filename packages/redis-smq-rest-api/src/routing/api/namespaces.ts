/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ERequestMethod,
  ERequestPayload,
} from '../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../lib/router/types/index.js';

import { countConsumerGroupPendingMessagesController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/countConsumerGroupPendingMessagesController.js';
import { deleteConsumerGroupController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/deleteConsumerGroupController.js';
import { getConsumerGroupPendingMessagesController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/getConsumerGroupPendingMessagesController.js';
import { getConsumerGroupsController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/getConsumerGroupsController.js';
import { purgeConsumerGroupPendingMessagesController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/purgeConsumerGroupPendingMessagesController.js';
import { saveConsumerGroupController } from '../../controllers/namespaces/namespace/queues/queue/consumer-groups/saveConsumerGroupController.js';
import { deleteNamespaceController } from '../../controllers/namespaces/namespace/delete-namespace/deleteNamespaceController.js';
import { getNamespaceQueuesController } from '../../controllers/namespaces/namespace/queues/get-namespace-queues/getNamespaceQueuesController.js';
import { getNamespacesController } from '../../controllers/namespaces/get-namespaces/getNamespacesController.js';
import { getQueueExchangesController } from '../../controllers/namespaces/namespace/queues/queue/exchanges/getQueueExchangesController.js';
import { clearQueueRateLimitController } from '../../controllers/namespaces/namespace/queues/queue/rate-limit/clearQueueRateLimitController.js';
import { getQueueRateLimitController } from '../../controllers/namespaces/namespace/queues/queue/rate-limit/getQueueRateLimitController.js';
import { setQueueRateLimitController } from '../../controllers/namespaces/namespace/queues/queue/rate-limit/setQueueRateLimitController.js';
import { deleteQueueController } from '../../controllers/namespaces/namespace/queues/queue/delete-queue/deleteQueueController.js';
import { getQueueConsumersController } from '../../controllers/namespaces/namespace/queues/queue/consumers/getQueueConsumersController.js';
import { getQueuePropertiesController } from '../../controllers/namespaces/namespace/queues/queue/get-queue-properties/getQueuePropertiesController.js';
import { checkQueueExistenceController } from '../../controllers/namespaces/namespace/queues/queue/check-existence/checkQueueExistenceController.js';
import { getNamespaceExchangesController } from '../../controllers/namespaces/namespace/exchanges/getNamespaceExchangesController.js';
import { getQueueStateController } from '../../controllers/namespaces/namespace/queues/queue/state/getQueueStateController.js';
import { getQueueStateHistoryController } from '../../controllers/namespaces/namespace/queues/queue/state/getQueueStateHistoryController.js';
import { countQueueMessagesController } from '../../controllers/namespaces/namespace/queues/queue/messages/countQueueMessagesController.js';
import { getQueueMessagesController } from '../../controllers/namespaces/namespace/queues/queue/messages/getQueueMessagesController.js';
import { purgeQueueMessagesController } from '../../controllers/namespaces/namespace/queues/queue/messages/purgeQueueMessagesController.js';
import { transitQueueStateController } from '../../controllers/namespaces/namespace/queues/queue/state/transitQueueStateController.js';
import { matchQueuesController } from '../../controllers/namespaces/namespace/exchanges/exchange/match-queues/matchQueuesController.js';
import { bindQueueController } from '../../controllers/namespaces/namespace/exchanges/exchange/bind-queue/bindQueueController.js';
import { unbindQueueController } from '../../controllers/namespaces/namespace/exchanges/exchange/unbind-queue/unbindQueueController.js';
import { getBindingsController } from '../../controllers/namespaces/namespace/exchanges/exchange/get-bindings/getBindingsController.js';
import { deleteExchangeController } from '../../controllers/namespaces/namespace/exchanges/exchange/delete-exchange/deleteExchangeController.js';
import { getExchangeController } from '../../controllers/namespaces/namespace/exchanges/exchange/get-exchange/getExchangeController.js';
import { getRoutingKeysController } from '../../controllers/namespaces/namespace/exchanges/exchange/get-routing-keys/getRoutingKeysController.js';
import { getRoutingPatternsController } from '../../controllers/namespaces/namespace/exchanges/exchange/get-routing-patterns/getRoutingPatternsController.js';

export const namespaces: TRouterResourceMap = {
  path: 'namespaces',
  tags: ['Namespaces'],
  resource: [
    {
      handler: getNamespacesController,
      method: ERequestMethod.GET,
      payload: [],
    },
    {
      path: ':ns',
      resource: [
        {
          handler: deleteNamespaceController,
          method: ERequestMethod.DELETE,
          payload: [ERequestPayload.PATH],
        },
        {
          path: 'queues',
          tags: ['Namespace Queues'],
          resource: [
            {
              handler: getNamespaceQueuesController,
              method: ERequestMethod.GET,
              payload: [ERequestPayload.PATH],
            },
            {
              path: ':name',
              tags: ['Queue'],
              resource: [
                {
                  handler: getQueuePropertiesController,
                  method: ERequestMethod.GET,
                  payload: [ERequestPayload.PATH],
                },
                {
                  handler: deleteQueueController,
                  method: ERequestMethod.DELETE,
                  payload: [ERequestPayload.PATH],
                },
                {
                  handler: checkQueueExistenceController,
                  method: ERequestMethod.HEAD,
                  payload: [ERequestPayload.PATH],
                },
                {
                  path: 'state',
                  tags: ['Queue Operational State'],
                  resource: [
                    {
                      handler: getQueueStateController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      handler: transitQueueStateController,
                      method: ERequestMethod.PATCH,
                      payload: [ERequestPayload.PATH, ERequestPayload.BODY],
                    },
                    {
                      path: 'history',
                      resource: [
                        {
                          handler: getQueueStateHistoryController,
                          method: ERequestMethod.GET,
                          payload: [ERequestPayload.PATH],
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'consumers',
                  tags: ['Queue Consumers'],
                  resource: [
                    {
                      handler: getQueueConsumersController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'messages',
                  tags: ['Queue Messages'],
                  resource: [
                    {
                      handler: getQueueMessagesController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH, ERequestPayload.QUERY],
                    },
                    {
                      handler: purgeQueueMessagesController,
                      method: ERequestMethod.DELETE,
                      payload: [ERequestPayload.PATH, ERequestPayload.QUERY],
                    },
                    {
                      path: 'count',
                      resource: [
                        {
                          handler: countQueueMessagesController,
                          method: ERequestMethod.GET,
                          payload: [
                            ERequestPayload.PATH,
                            ERequestPayload.QUERY,
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'consumer-groups',
                  tags: ['Consumer Groups'],
                  resource: [
                    {
                      handler: getConsumerGroupsController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      handler: saveConsumerGroupController,
                      method: ERequestMethod.POST,
                      payload: [ERequestPayload.PATH, ERequestPayload.BODY],
                    },
                    {
                      path: ':consumerGroupId',
                      resource: [
                        {
                          handler: deleteConsumerGroupController,
                          method: ERequestMethod.DELETE,
                          payload: [ERequestPayload.PATH],
                        },
                        {
                          path: 'messages',
                          resource: [
                            {
                              handler:
                                getConsumerGroupPendingMessagesController,
                              method: ERequestMethod.GET,
                              payload: [
                                ERequestPayload.PATH,
                                ERequestPayload.QUERY,
                              ],
                            },
                            {
                              handler:
                                purgeConsumerGroupPendingMessagesController,
                              method: ERequestMethod.DELETE,
                              payload: [ERequestPayload.PATH],
                            },
                            {
                              path: 'count',
                              resource: [
                                {
                                  handler:
                                    countConsumerGroupPendingMessagesController,
                                  method: ERequestMethod.GET,
                                  payload: [ERequestPayload.PATH],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'rate-limit',
                  tags: ['Rate limiting'],
                  resource: [
                    {
                      handler: getQueueRateLimitController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      handler: setQueueRateLimitController,
                      method: ERequestMethod.PUT,
                      payload: [ERequestPayload.PATH, ERequestPayload.BODY],
                    },
                    {
                      handler: clearQueueRateLimitController,
                      method: ERequestMethod.DELETE,
                      payload: [ERequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'exchanges',
                  tags: ['Queue Exchanges'],
                  resource: [
                    {
                      handler: getQueueExchangesController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          path: 'exchanges',
          tags: ['Namespace Exchanges'],
          resource: [
            {
              handler: getNamespaceExchangesController,
              method: ERequestMethod.GET,
              payload: [ERequestPayload.PATH],
            },
            {
              path: ':exchange',
              resource: [
                {
                  handler: getExchangeController,
                  method: ERequestMethod.GET,
                  payload: [ERequestPayload.PATH],
                },
                {
                  handler: deleteExchangeController,
                  method: ERequestMethod.DELETE,
                  payload: [ERequestPayload.PATH],
                },
                {
                  path: 'match',
                  resource: [
                    {
                      handler: matchQueuesController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH, ERequestPayload.QUERY],
                    },
                  ],
                },
                {
                  path: 'routing-keys',
                  resource: [
                    {
                      handler: getRoutingKeysController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'routing-patterns',
                  resource: [
                    {
                      handler: getRoutingPatternsController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'bindings',
                  resource: [
                    {
                      handler: getBindingsController,
                      method: ERequestMethod.GET,
                      payload: [ERequestPayload.PATH, ERequestPayload.QUERY],
                    },
                    {
                      path: ':queue',
                      resource: [
                        {
                          handler: bindQueueController,
                          method: ERequestMethod.POST,
                          payload: [
                            ERequestPayload.PATH,
                            ERequestPayload.QUERY,
                          ],
                        },
                        {
                          handler: unbindQueueController,
                          method: ERequestMethod.DELETE,
                          payload: [
                            ERequestPayload.PATH,
                            ERequestPayload.QUERY,
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
