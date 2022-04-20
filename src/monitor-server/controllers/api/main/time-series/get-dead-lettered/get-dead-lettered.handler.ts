import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetDeadLetteredRequestDTO } from './get-dead-lettered.request.DTO';
import { GetDeadLetteredResponseDTO } from './get-dead-lettered.response.DTO';
import { globalTimeSeriesServiceInstance } from '../../../../../services';

export const GetDeadLetteredHandler: TRouteControllerActionHandler<
  GetDeadLetteredRequestDTO,
  GetDeadLetteredResponseDTO
> = () => {
  return async (ctx) => {
    return globalTimeSeriesServiceInstance().deadLettered(ctx.state.dto);
  };
};
