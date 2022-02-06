import { TApplication } from '../../../../types/common';
import { GetQueuesRequestDTO } from './get-queues.request.DTO';
import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetQueuesResponseDTO } from './get-queues.response.DTO';

export const GetQueuesHandler: TRouteControllerActionHandler<
  GetQueuesRequestDTO,
  GetQueuesResponseDTO
> = (app: TApplication) => async () => {
  const { queuesService } = app.context.services;
  return queuesService.getQueues();
};
