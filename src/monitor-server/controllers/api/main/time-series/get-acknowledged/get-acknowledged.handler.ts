import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetAcknowledgedRequestDTO } from './get-acknowledged.request.DTO';
import { GetAcknowledgedResponseDTO } from './get-acknowledged.response.DTO';
import { globalTimeSeriesServiceInstance } from '../../../../../services';

export const GetAcknowledgedHandler: TRouteControllerActionHandler<
  GetAcknowledgedRequestDTO,
  GetAcknowledgedResponseDTO
> = () => {
  return async (ctx) => {
    return globalTimeSeriesServiceInstance().acknowledged(ctx.state.dto);
  };
};
