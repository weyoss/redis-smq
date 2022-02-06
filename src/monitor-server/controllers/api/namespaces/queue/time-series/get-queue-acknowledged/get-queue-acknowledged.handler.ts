import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueueAcknowledgedRequestDTO } from './get-queue-acknowledged.request.DTO';
import { GetQueueAcknowledgedResponseDTO } from './get-queue-acknowledged.response.DTO';

export const GetQueueAcknowledgedHandler: TRouteControllerActionHandler<
  GetQueueAcknowledgedRequestDTO,
  GetQueueAcknowledgedResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.acknowledged(ctx.state.dto);
  };
};
