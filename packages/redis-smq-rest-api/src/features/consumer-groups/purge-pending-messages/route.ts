import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { purgeConsumerGroupPendingMessages } from './handler.js';

export const purgeConsumerGroupPendingMessagesRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups/:consumerGroupId/messages',
  tags: ['Consumer Groups'],
  operationId: 'purgeConsumerGroupPendingMessages',
  request: {
    path: getSchema(
      'PurgeConsumerGroupPendingMessagesControllerRequestPathDTO',
    ),
  },
  response: getResponseSchemas(
    'PurgeConsumerGroupPendingMessagesControllerResponseDTO',
  ),
  handler: purgeConsumerGroupPendingMessages,
};
