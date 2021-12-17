import {
  ERouteControllerActionMethod,
  TRouteController,
} from '../../lib/routing';
import { GetQueuesHandler } from './actions/get-queues/get-queues.handler';
import { GetQueuesRequestDTO } from './actions/get-queues/get-queues-request.DTO';
import { GetQueuesResponseDTO } from './actions/get-queues/get-queues-response.DTO';

export const queuesController: TRouteController = {
  prefix: '/queues',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [],
      Handler: GetQueuesHandler,
      RequestDTO: GetQueuesRequestDTO,
      ResponseDTO: GetQueuesResponseDTO,
    },
  ],
};
