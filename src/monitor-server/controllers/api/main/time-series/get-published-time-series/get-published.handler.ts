import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { GetPublishedRequestDTO } from './get-published.request.DTO';
import { GetPublishedResponseDTO } from './get-published.response.DTO';
import { globalTimeSeriesServiceInstance } from '../../../../../services';

export const GetPublishedHandler: TRouteControllerActionHandler<
  GetPublishedRequestDTO,
  GetPublishedResponseDTO
> = () => {
  return async (ctx) => {
    return globalTimeSeriesServiceInstance().published(ctx.state.dto);
  };
};
