import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { countConsumerGroupPendingMessages } from './handler.js';

export const countConsumerGroupPendingMessagesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups/:consumerGroupId/messages/count',
  tags: ['Consumer Groups'],
  operationId: 'countConsumerGroupPendingMessages',
  request: {
    path: getSchema(
      'CountConsumerGroupPendingMessagesControllerRequestPathDTO',
    ),
  },
  response: getResponseSchemas(
    'CountConsumerGroupPendingMessagesControllerResponseDTO',
  ),
  handler: countConsumerGroupPendingMessages,
};
