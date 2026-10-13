import { getResponseSchemas, RouteDefinition } from '../../../http/index.js';
import { getSchema } from '../../../http/index.js';
import { requeueMessageById } from './handler.js';

export const requeueMessageByIdRoute: RouteDefinition = {
  method: 'post',
  path: '/api/messages/:id',
  tags: ['Messages'],
  operationId: 'requeueMessageById',
  request: {
    path: getSchema('RequeueMessageByIdControllerRequestPathDTO'),
  },
  response: getResponseSchemas('RequeueMessageByIdControllerResponseDTO'),
  handler: requeueMessageById,
};
