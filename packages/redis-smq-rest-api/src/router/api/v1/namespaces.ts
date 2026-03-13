/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { countConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/countConsumerGroupPendingMessagesController.js';
import { deleteConsumerGroupController } from '../../../controllers/consumer-groups/deleteConsumerGroupController.js';
import { getConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/getConsumerGroupPendingMessagesController.js';
import { getConsumerGroupsController } from '../../../controllers/consumer-groups/getConsumerGroupsController.js';
import { purgeConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/purgeConsumerGroupPendingMessagesController.js';
import { saveConsumerGroupController } from '../../../controllers/consumer-groups/saveConsumerGroupController.js';
import { bindQueueDirectXController } from '../../../controllers/exchange-direct/bindQueueDirectXController.js';
import { deleteExchangeDirectXController } from '../../../controllers/exchange-direct/deleteExchangeDirectXController.js';
import { getRoutingKeyQueuesDirectXController } from '../../../controllers/exchange-direct/getRoutingKeyQueuesDirectXController.js';
import { getRoutingKeysDirectXController } from '../../../controllers/exchange-direct/getRoutingKeysDirectXController.js';
import { matchQueuesDirectXController } from '../../../controllers/exchange-direct/matchQueuesDirectXController.js';
import { unbindQueueDirectXController } from '../../../controllers/exchange-direct/unbindQueueDirectXController.js';
import { bindQueueFanoutXController } from '../../../controllers/exchange-fanout/bindQueueFanoutXController.js';
import { deleteExchangeFanoutXController } from '../../../controllers/exchange-fanout/deleteExchangeFanoutXController.js';
import { matchQueuesFanoutXController } from '../../../controllers/exchange-fanout/matchQueuesFanoutXController.js';
import { unbindQueueFanoutXController } from '../../../controllers/exchange-fanout/unbindQueueFanoutXController.js';
import { bindQueueTopicXController } from '../../../controllers/exchange-topic/bindQueueTopicXController.js';
import { deleteExchangeTopicXController } from '../../../controllers/exchange-topic/deleteExchangeTopicXController.js';
import { getBindingPatternQueuesTopicXController } from '../../../controllers/exchange-topic/getBindingPatternQueuesTopicXController.js';
import { getBindingPatternsTopicXController } from '../../../controllers/exchange-topic/getBindingPatternsTopicXController.js';
import { matchQueuesTopicXController } from '../../../controllers/exchange-topic/matchQueuesTopicXController.js';
import { unbindQueueTopicXController } from '../../../controllers/exchange-topic/unbindQueueTopicXController.js';
import { deleteNamespaceController } from '../../../controllers/namespace/deleteNamespaceController.js';
import { getNamespaceQueuesController } from '../../../controllers/namespace/getNamespaceQueuesController.js';
import { getNamespacesController } from '../../../controllers/namespace/getNamespacesController.js';
import { getQueueExchangesController } from '../../../controllers/queue-exchanges/getQueueExchangesController.js';
import { clearQueueRateLimitController } from '../../../controllers/queue-rate-limit/clearQueueRateLimitController.js';
import { getQueueRateLimitController } from '../../../controllers/queue-rate-limit/getQueueRateLimitController.js';
import { setQueueRateLimitController } from '../../../controllers/queue-rate-limit/setQueueRateLimitController.js';
import { deleteQueueController } from '../../../controllers/queue/deleteQueueController.js';
import { getQueueConsumersController } from '../../../controllers/queue/getQueueConsumersController.js';
import { getQueuePropertiesController } from '../../../controllers/queue/getQueuePropertiesController.js';
import { checkQueueExistenceController } from '../../../controllers/queue/checkQueueExistenceController.js';
import {
  ERequestMethod,
  ERequestPayload,
} from '../../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../../lib/router/types/index.js';
import { getNamespaceExchangesController } from '../../../controllers/namespace/getNamespaceExchangesController.js';
import { getQueueStateController } from '../../../controllers/queue-state/getQueueStateController.js';
import { getQueueStateHistoryController } from '../../../controllers/queue-state/getQueueStateHistoryController.js';
import { countQueueMessagesController } from '../../../controllers/queue-messages/countQueueMessagesController.js';
import { getQueueMessagesController } from '../../../controllers/queue-messages/getQueueMessagesController.js';
import { purgeQueueMessagesController } from '../../../controllers/queue-messages/purgeQueueMessagesController.js';
import { transitQueueStateController } from '../../../controllers/queue-state/transitQueueStateController.js';

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
                  tags: ['Consumers'],
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
                  tags: ['Messages'],
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
                  tags: ['Consumer groups'],
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
          resource: [
            {
              handler: getNamespaceExchangesController,
              method: ERequestMethod.GET,
              payload: [ERequestPayload.PATH],
            },
            {
              path: 'fanout',
              tags: ['Fanout Exchange'],
              resource: [
                {
                  path: ':fanout',
                  resource: [
                    {
                      handler: deleteExchangeFanoutXController,
                      method: ERequestMethod.DELETE,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      path: 'queues',
                      resource: [
                        {
                          handler: matchQueuesFanoutXController,
                          method: ERequestMethod.GET,
                          payload: [ERequestPayload.PATH],
                        },
                        {
                          path: ':queue',
                          resource: [
                            {
                              handler: bindQueueFanoutXController,
                              method: ERequestMethod.PUT,
                              payload: [ERequestPayload.PATH],
                            },
                            {
                              handler: unbindQueueFanoutXController,
                              method: ERequestMethod.DELETE,
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
              path: 'direct',
              tags: ['Direct Exchange'],
              resource: [
                {
                  path: ':direct',
                  resource: [
                    {
                      handler: deleteExchangeDirectXController,
                      method: ERequestMethod.DELETE,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      path: 'routing-keys',
                      resource: [
                        {
                          handler: getRoutingKeysDirectXController,
                          method: ERequestMethod.GET,
                          payload: [ERequestPayload.PATH],
                        },
                        {
                          path: ':routingKey',
                          resource: [
                            {
                              path: 'queues',
                              resource: [
                                {
                                  handler: getRoutingKeyQueuesDirectXController,
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
                      path: 'queues',
                      resource: [
                        {
                          handler: matchQueuesDirectXController,
                          method: ERequestMethod.GET,
                          payload: [
                            ERequestPayload.PATH,
                            ERequestPayload.QUERY,
                          ],
                        },
                        {
                          path: ':queue',
                          resource: [
                            {
                              handler: bindQueueDirectXController,
                              method: ERequestMethod.PUT,
                              payload: [
                                ERequestPayload.PATH,
                                ERequestPayload.QUERY,
                              ],
                            },
                            {
                              handler: unbindQueueDirectXController,
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
            {
              path: 'topic',
              tags: ['Topic Exchange'],
              resource: [
                {
                  path: ':topic',
                  resource: [
                    {
                      handler: deleteExchangeTopicXController,
                      method: ERequestMethod.DELETE,
                      payload: [ERequestPayload.PATH],
                    },
                    {
                      path: 'binding-patterns',
                      resource: [
                        {
                          handler: getBindingPatternsTopicXController,
                          method: ERequestMethod.GET,
                          payload: [ERequestPayload.PATH],
                        },
                        {
                          path: ':pattern',
                          resource: [
                            {
                              path: 'queues',
                              resource: [
                                {
                                  handler:
                                    getBindingPatternQueuesTopicXController,
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
                      path: 'queues',
                      resource: [
                        {
                          handler: matchQueuesTopicXController,
                          method: ERequestMethod.GET,
                          payload: [
                            ERequestPayload.PATH,
                            ERequestPayload.QUERY,
                          ],
                        },
                        {
                          path: ':queue',
                          resource: [
                            {
                              handler: bindQueueTopicXController,
                              method: ERequestMethod.PUT,
                              payload: [
                                ERequestPayload.PATH,
                                ERequestPayload.QUERY,
                              ],
                            },
                            {
                              handler: unbindQueueTopicXController,
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
    },
  ],
};
