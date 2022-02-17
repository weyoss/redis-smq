import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { ClearRateLimitRequestDTO } from './clear-rate-limit.request.DTO';
import { ClearRateLimitResponseDTO } from './clear-rate-limit.response.DTO';

export const ClearRateLimitHandler: TRouteControllerActionHandler<
  ClearRateLimitRequestDTO,
  ClearRateLimitResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.clearQueueRateLimit(ctx.state.dto);
  };
};
