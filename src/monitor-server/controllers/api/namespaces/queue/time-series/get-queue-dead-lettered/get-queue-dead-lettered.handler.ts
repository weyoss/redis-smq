import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueueDeadLetteredRequestDTO } from './get-queue-dead-lettered.request.DTO';
import { GetQueueDeadLetteredResponseDTO } from './get-queue-dead-lettered.response.DTO';

export const GetQueueDeadLetteredHandler: TRouteControllerActionHandler<
  GetQueueDeadLetteredRequestDTO,
  GetQueueDeadLetteredResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.deadLettered(ctx.state.dto);
  };
};
