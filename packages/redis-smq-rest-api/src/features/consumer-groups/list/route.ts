import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { getConsumerGroups } from './handler.js';

export const getConsumerGroupsRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/consumer-groups',
  tags: ['Consumer Groups'],
  operationId: 'getConsumerGroups',
  request: { path: getSchema('GetConsumerGroupsControllerRequestPathDTO') },
  response: getResponseSchemas('GetConsumerGroupsControllerResponseDTO'),
  handler: getConsumerGroups,
};
