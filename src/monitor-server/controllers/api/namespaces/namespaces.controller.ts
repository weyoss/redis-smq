import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../lib/routing';
import { GetNamespacesRequestDTO } from './get-namespaces/get-namespaces.request.DTO';
import { GetNamespacesResponseDTO } from './get-namespaces/get-namespaces.response.DTO';
import { GetNamespacesHandler } from './get-namespaces/get-namespaces.handler';
import { GetNamespaceQueuesHandler } from './get-namespace-queues/get-namespace-queues.handler';
import { GetNamespaceQueuesRequestDTO } from './get-namespace-queues/get-namespace-queues.request.DTO';
import { GetNamespaceQueuesResponseDTO } from './get-namespace-queues/get-namespace-queues.response.DTO';
import { DeleteNamespaceHandler } from './delete-namespace/delete-namespace.handler';
import { DeleteNamespaceRequestDTO } from './delete-namespace/delete-namespace.request.DTO';
import { DeleteNamespaceResponseDTO } from './delete-namespace/delete-namespace.response.DTO';
import { queueController } from './queue/queue.controller';

export const namespacesController: IRouteController = {
  path: '/ns',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [],
      Handler: GetNamespacesHandler,
      RequestDTO: GetNamespacesRequestDTO,
      ResponseDTO: GetNamespacesResponseDTO,
    },
    {
      path: '/:ns',
      actions: [
        {
          path: '/',
          method: ERouteControllerActionMethod.DELETE,
          payload: [ERouteControllerActionPayload.PATH],
          Handler: DeleteNamespaceHandler,
          RequestDTO: DeleteNamespaceRequestDTO,
          ResponseDTO: DeleteNamespaceResponseDTO,
        },
        {
          path: '/queues',
          actions: [
            {
              path: '/',
              method: ERouteControllerActionMethod.GET,
              payload: [ERouteControllerActionPayload.PATH],
              Handler: GetNamespaceQueuesHandler,
              RequestDTO: GetNamespaceQueuesRequestDTO,
              ResponseDTO: GetNamespaceQueuesResponseDTO,
            },
            queueController,
          ],
        },
      ],
    },
  ],
};
