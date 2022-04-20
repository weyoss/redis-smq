import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetQueueDeadLetteredRequestDTO } from './get-queue-dead-lettered.request.DTO';
import { GetQueueDeadLetteredResponseDTO } from './get-queue-dead-lettered.response.DTO';
import { queueTimeSeriesServiceInstance } from '../../../../../../services';

export const GetQueueDeadLetteredHandler: TRouteControllerActionHandler<
  GetQueueDeadLetteredRequestDTO,
  GetQueueDeadLetteredResponseDTO
> = () => {
  return async (ctx) => {
    return queueTimeSeriesServiceInstance().deadLettered(ctx.state.dto);
  };
};
