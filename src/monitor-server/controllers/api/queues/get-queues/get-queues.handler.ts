import { GetQueuesRequestDTO } from './get-queues.request.DTO';
import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetQueuesResponseDTO } from './get-queues.response.DTO';
import { queuesServiceInstance } from '../../../../services';

export const GetQueuesHandler: TRouteControllerActionHandler<
  GetQueuesRequestDTO,
  GetQueuesResponseDTO
> = () => async () => {
  return queuesServiceInstance().getQueues();
};
