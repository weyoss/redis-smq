import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { saveConsumerGroup } from './handler.js';

export const saveConsumerGroupRoute: RouteDefinition = {
  method: 'post',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups',
  tags: ['Consumer Groups'],
  operationId: 'saveConsumerGroup',
  request: {
    path: getSchema('SaveConsumerGroupControllerRequestPathDTO'),
    body: getSchema('SaveConsumerGroupControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('SaveConsumerGroupControllerResponseDTO'),
  handler: saveConsumerGroup,
};
