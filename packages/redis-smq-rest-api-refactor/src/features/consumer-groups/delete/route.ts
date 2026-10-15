import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { deleteConsumerGroup } from './handler.js';

export const deleteConsumerGroupRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups/:consumerGroupId',
  tags: ['Consumer Groups'],
  operationId: 'deleteConsumerGroup',
  request: { path: getSchema('DeleteConsumerGroupControllerRequestPathDTO') },
  response: getResponseSchemas('DeleteConsumerGroupControllerResponseDTO'),
  handler: deleteConsumerGroup,
};
