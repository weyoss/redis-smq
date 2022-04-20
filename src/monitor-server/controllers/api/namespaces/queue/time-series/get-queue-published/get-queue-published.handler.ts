import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueuePublishedRequestDTO } from './get-queue-published.request.DTO';
import { GetQueuePublishedResponseDTO } from './get-queue-published.response.DTO';
import { queueTimeSeriesServiceInstance } from '../../../../../../services';

export const GetQueuePublishedHandler: TRouteControllerActionHandler<
  GetQueuePublishedRequestDTO,
  GetQueuePublishedResponseDTO
> = () => {
  return async (ctx) => {
    return queueTimeSeriesServiceInstance().published(ctx.state.dto);
  };
};
