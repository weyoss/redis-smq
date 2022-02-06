import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetDeadLetteredRequestDTO } from './get-dead-lettered.request.DTO';
import { GetDeadLetteredResponseDTO } from './get-dead-lettered.response.DTO';

export const GetDeadLetteredHandler: TRouteControllerActionHandler<
  GetDeadLetteredRequestDTO,
  GetDeadLetteredResponseDTO
> = (app) => {
  return async (ctx) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.deadLettered(ctx.state.dto);
  };
};
