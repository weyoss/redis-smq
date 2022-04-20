import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueueAcknowledgedRequestDTO } from './get-queue-acknowledged.request.DTO';
import { GetQueueAcknowledgedResponseDTO } from './get-queue-acknowledged.response.DTO';
import { queueTimeSeriesServiceInstance } from '../../../../../../services';

export const GetQueueAcknowledgedHandler: TRouteControllerActionHandler<
  GetQueueAcknowledgedRequestDTO,
  GetQueueAcknowledgedResponseDTO
> = () => {
  return async (ctx) => {
    return queueTimeSeriesServiceInstance().acknowledged(ctx.state.dto);
  };
};
