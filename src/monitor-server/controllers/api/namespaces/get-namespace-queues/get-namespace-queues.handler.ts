import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetNamespaceQueuesRequestDTO } from './get-namespace-queues.request.DTO';
import { GetNamespaceQueuesResponseDTO } from './get-namespace-queues.response.DTO';

export const GetNamespaceQueuesHandler: TRouteControllerActionHandler<
  GetNamespaceQueuesRequestDTO,
  GetNamespaceQueuesResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.getNamespaceQueues(ctx.state.dto);
  };
};
