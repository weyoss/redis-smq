/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EControllerRequestMethod,
  EControllerRequestPayload,
} from '../../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../../lib/router/types/index.js';
import { countConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/countConsumerGroupPendingMessagesController.js';
import { deleteConsumerGroupController } from '../../../controllers/consumer-groups/deleteConsumerGroupController.js';
import { getConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/getConsumerGroupPendingMessagesController.js';
import { getConsumerGroupsController } from '../../../controllers/consumer-groups/getConsumerGroupsController.js';
import { purgeConsumerGroupPendingMessagesController } from '../../../controllers/consumer-groups/purgeConsumerGroupPendingMessagesController.js';
import { saveConsumerGroupController } from '../../../controllers/consumer-groups/saveConsumerGroupController.js';
import { deleteNamespaceController } from '../../../controllers/namespace/deleteNamespaceController.js';
import { getNamespaceQueuesController } from '../../../controllers/namespace/getNamespaceQueuesController.js';
import { getNamespacesController } from '../../../controllers/namespace/getNamespacesController.js';
import { countQueueAcknowledgedMessagesController } from '../../../controllers/queue-acknowledged-messages/countQueueAcknowledgedMessagesController.js';
import { getQueueAcknowledgedMessagesController } from '../../../controllers/queue-acknowledged-messages/getQueueAcknowledgedMessagesController.js';
import { purgeQueueAcknowledgedMessagesController } from '../../../controllers/queue-acknowledged-messages/purgeQueueAcknowledgedMessagesController.js';
import { countQueueDeadLetteredMessagesController } from '../../../controllers/queue-dead-lettered-messages/countQueueDeadLetteredMessagesController.js';
import { getQueueDeadLetteredMessagesController } from '../../../controllers/queue-dead-lettered-messages/getQueueDeadLetteredMessagesController.js';
import { purgeQueueDeadLetteredMessagesController } from '../../../controllers/queue-dead-lettered-messages/purgeQueueDeadLetteredMessagesController.js';
import { countQueueMessagesByStatusController } from '../../../controllers/queue-messages/countQueueMessagesByStatusController.js';
import { countQueueMessagesController } from '../../../controllers/queue-messages/countQueueMessagesController.js';
import { getQueueMessagesController } from '../../../controllers/queue-messages/getQueueMessagesController.js';
import { countQueuePendingMessagesController } from '../../../controllers/queue-pending-messages/countQueuePendingMessagesController.js';
import { getQueuePendingMessagesController } from '../../../controllers/queue-pending-messages/getQueuePendingMessagesController.js';
import { purgeQueuePendingMessagesController } from '../../../controllers/queue-pending-messages/purgeQueuePendingMessagesController.js';
import { clearQueueRateLimitController } from '../../../controllers/queue-rate-limit/clearQueueRateLimitController.js';
import { getQueueRateLimitController } from '../../../controllers/queue-rate-limit/getQueueRateLimitController.js';
import { setQueueRateLimitController } from '../../../controllers/queue-rate-limit/setQueueRateLimitController.js';
import { countQueueScheduledMessagesController } from '../../../controllers/queue-scheduled-messages/countQueueScheduledMessagesController.js';
import { getQueueScheduledMessagesController } from '../../../controllers/queue-scheduled-messages/getQueueScheduledMessagesController.js';
import { purgeQueueScheduledMessagesController } from '../../../controllers/queue-scheduled-messages/purgeQueueScheduledMessagesController.js';
import { deleteQueueController } from '../../../controllers/queue/deleteQueueController.js';
import { getQueueConsumersController } from '../../../controllers/queue/getQueueConsumersController.js';
import { getQueuePropertiesController } from '../../../controllers/queue/getQueuePropertiesController.js';
import { queueExistsController } from '../../../controllers/queue/queueExistsController.js';

export const namespaces: TRouterResourceMap = {
  path: 'namespaces',
  tags: ['Namespaces'],
  resource: [
    {
      handler: getNamespacesController,
      method: EControllerRequestMethod.GET,
      payload: [],
    },
    {
      path: ':ns',
      resource: [
        {
          handler: deleteNamespaceController,
          method: EControllerRequestMethod.DELETE,
          payload: [EControllerRequestPayload.PATH],
        },
        {
          path: 'queues',
          resource: [
            {
              handler: getNamespaceQueuesController,
              method: EControllerRequestMethod.GET,
              payload: [EControllerRequestPayload.PATH],
            },
            {
              path: ':name',
              tags: ['Queue'],
              resource: [
                {
                  handler: getQueuePropertiesController,
                  method: EControllerRequestMethod.GET,
                  payload: [EControllerRequestPayload.PATH],
                },
                {
                  handler: deleteQueueController,
                  method: EControllerRequestMethod.DELETE,
                  payload: [EControllerRequestPayload.PATH],
                },
                {
                  path: 'exists',
                  resource: [
                    {
                      handler: queueExistsController,
                      method: EControllerRequestMethod.GET,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'consumers',
                  tags: ['Consumers'],
                  resource: [
                    {
                      handler: getQueueConsumersController,
                      method: EControllerRequestMethod.GET,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'total-messages',
                  tags: ['Total Messages'],
                  resource: [
                    {
                      handler: countQueueMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [EControllerRequestPayload.PATH],
                    },
                    {
                      path: 'stats',
                      resource: [
                        {
                          handler: countQueueMessagesByStatusController,
                          method: EControllerRequestMethod.GET,
                          payload: [EControllerRequestPayload.PATH],
                        },
                      ],
                    },
                    {
                      path: 'pending',
                      resource: [
                        {
                          handler: countQueuePendingMessagesController,
                          method: EControllerRequestMethod.GET,
                          payload: [
                            EControllerRequestPayload.PATH,
                            EControllerRequestPayload.QUERY,
                          ],
                        },
                      ],
                    },
                    {
                      path: 'scheduled',
                      resource: [
                        {
                          handler: countQueueScheduledMessagesController,
                          method: EControllerRequestMethod.GET,
                          payload: [EControllerRequestPayload.PATH],
                        },
                      ],
                    },
                    {
                      path: 'acknowledged',
                      resource: [
                        {
                          handler: countQueueAcknowledgedMessagesController,
                          method: EControllerRequestMethod.GET,
                          payload: [EControllerRequestPayload.PATH],
                        },
                      ],
                    },
                    {
                      path: 'dead-lettered',
                      resource: [
                        {
                          handler: countQueueDeadLetteredMessagesController,
                          method: EControllerRequestMethod.GET,
                          payload: [EControllerRequestPayload.PATH],
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'messages',
                  tags: ['Queue messages'],
                  resource: [
                    {
                      handler: getQueueMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.QUERY,
                      ],
                    },
                  ],
                },
                {
                  path: 'pending-messages',
                  tags: ['Pending messages'],
                  resource: [
                    {
                      handler: getQueuePendingMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.QUERY,
                      ],
                    },
                    {
                      handler: purgeQueuePendingMessagesController,
                      method: EControllerRequestMethod.DELETE,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'acknowledged-messages',
                  tags: ['Acknowledged messages'],
                  resource: [
                    {
                      handler: getQueueAcknowledgedMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.QUERY,
                      ],
                    },
                    {
                      handler: purgeQueueAcknowledgedMessagesController,
                      method: EControllerRequestMethod.DELETE,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'dead-lettered-messages',
                  tags: ['Dead-lettered messages'],
                  resource: [
                    {
                      handler: getQueueDeadLetteredMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.QUERY,
                      ],
                    },
                    {
                      handler: purgeQueueDeadLetteredMessagesController,
                      method: EControllerRequestMethod.DELETE,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'scheduled-messages',
                  tags: ['Scheduled messages'],
                  resource: [
                    {
                      handler: getQueueScheduledMessagesController,
                      method: EControllerRequestMethod.GET,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.QUERY,
                      ],
                    },
                    {
                      handler: purgeQueueScheduledMessagesController,
                      method: EControllerRequestMethod.DELETE,
                      payload: [EControllerRequestPayload.PATH],
                    },
                  ],
                },
                {
                  path: 'consumer-groups',
                  tags: ['Consumer groups'],
                  resource: [
                    {
                      handler: getConsumerGroupsController,
                      method: EControllerRequestMethod.GET,
                      payload: [EControllerRequestPayload.PATH],
                    },
                    {
                      handler: saveConsumerGroupController,
                      method: EControllerRequestMethod.POST,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.BODY,
                      ],
                    },
                    {
                      path: ':consumerGroupId',
                      resource: [
                        {
                          handler: deleteConsumerGroupController,
                          method: EControllerRequestMethod.DELETE,
                          payload: [EControllerRequestPayload.PATH],
                        },
                        {
                          path: 'total-messages',
                          resource: [
                            {
                              handler:
                                countConsumerGroupPendingMessagesController,
                              method: EControllerRequestMethod.GET,
                              payload: [EControllerRequestPayload.PATH],
                            },
                          ],
                        },
                        {
                          path: 'messages',
                          resource: [
                            {
                              handler:
                                getConsumerGroupPendingMessagesController,
                              method: EControllerRequestMethod.GET,
                              payload: [
                                EControllerRequestPayload.PATH,
                                EControllerRequestPayload.QUERY,
                              ],
                            },
                            {
                              handler:
                                purgeConsumerGroupPendingMessagesController,
                              method: EControllerRequestMethod.DELETE,
                              payload: [EControllerRequestPayload.PATH],
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
                      method: EControllerRequestMethod.GET,
                      payload: [EControllerRequestPayload.PATH],
                    },
                    {
                      handler: setQueueRateLimitController,
                      method: EControllerRequestMethod.PUT,
                      payload: [
                        EControllerRequestPayload.PATH,
                        EControllerRequestPayload.BODY,
                      ],
                    },
                    {
                      handler: clearQueueRateLimitController,
                      method: EControllerRequestMethod.DELETE,
                      payload: [EControllerRequestPayload.PATH],
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
