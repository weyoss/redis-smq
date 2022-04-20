import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { ClearRateLimitRequestDTO } from './clear-rate-limit.request.DTO';
import { ClearRateLimitResponseDTO } from './clear-rate-limit.response.DTO';
import { queuesServiceInstance } from '../../../../../../services';

export const ClearRateLimitHandler: TRouteControllerActionHandler<
  ClearRateLimitRequestDTO,
  ClearRateLimitResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().clearQueueRateLimit(ctx.state.dto);
  };
};
