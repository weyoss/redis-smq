import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetRateLimitRequestDTO } from './get-rate-limit.request.DTO';
import { GetRateLimitResponseDTO } from './get-rate-limit.response.DTO';
import { queuesServiceInstance } from '../../../../../../services';

export const GetRateLimitHandler: TRouteControllerActionHandler<
  GetRateLimitRequestDTO,
  GetRateLimitResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().getQueueRateLimit(ctx.state.dto);
  };
};
