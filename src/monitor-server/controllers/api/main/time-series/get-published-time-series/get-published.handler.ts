import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetPublishedRequestDTO } from './get-published.request.DTO';
import { GetPublishedResponseDTO } from './get-published.response.DTO';

export const GetPublishedHandler: TRouteControllerActionHandler<
  GetPublishedRequestDTO,
  GetPublishedResponseDTO
> = (app) => {
  return async (ctx) => {
    const { globalTimeSeriesService } = app.context.services;
    return globalTimeSeriesService.published(ctx.state.dto);
  };
};
