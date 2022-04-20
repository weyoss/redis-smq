import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetNamespaceQueuesRequestDTO } from './get-namespace-queues.request.DTO';
import { GetNamespaceQueuesResponseDTO } from './get-namespace-queues.response.DTO';
import { queuesServiceInstance } from '../../../../services';

export const GetNamespaceQueuesHandler: TRouteControllerActionHandler<
  GetNamespaceQueuesRequestDTO,
  GetNamespaceQueuesResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().getNamespaceQueues(ctx.state.dto);
  };
};
