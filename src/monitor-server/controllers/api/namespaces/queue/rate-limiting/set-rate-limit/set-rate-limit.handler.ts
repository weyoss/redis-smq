import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { SetRateLimitRequestDTO } from './set-rate-limit.request.DTO';
import { SetRateLimitResponseDTO } from './set-rate-limit.response.DTO';
import { queuesServiceInstance } from '../../../../../../services';

export const SetRateLimitHandler: TRouteControllerActionHandler<
  SetRateLimitRequestDTO,
  SetRateLimitResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().setQueueRateLimit(ctx.state.dto);
  };
};
