import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueuePublishedRequestDTO } from './get-queue-published.request.DTO';
import { GetQueuePublishedResponseDTO } from './get-queue-published.response.DTO';

export const GetQueuePublishedHandler: TRouteControllerActionHandler<
  GetQueuePublishedRequestDTO,
  GetQueuePublishedResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.published(ctx.state.dto);
  };
};
