import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { getConsumerGroupPendingMessages } from './handler.js';

export const getConsumerGroupPendingMessagesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups/:consumerGroupId/messages',
  tags: ['Consumer Groups'],
  operationId: 'getConsumerGroupPendingMessages',
  request: {
    path: getSchema('GetConsumerGroupPendingMessagesControllerRequestPathDTO'),
    query: getSchema(
      'GetConsumerGroupPendingMessagesControllerRequestQueryDTO',
    ),
  },
  response: getResponseSchemas(
    'GetConsumerGroupPendingMessagesControllerResponseDTO',
  ),
  handler: getConsumerGroupPendingMessages,
};
