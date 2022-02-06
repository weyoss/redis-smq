import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetAcknowledgedRequestDTO } from './get-acknowledged.request.DTO';
import { GetAcknowledgedResponseDTO } from './get-acknowledged.response.DTO';

export const GetAcknowledgedHandler: TRouteControllerActionHandler<
  GetAcknowledgedRequestDTO,
  GetAcknowledgedResponseDTO
> = (app) => {
  return async (ctx) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.acknowledged(ctx.state.dto);
  };
};
