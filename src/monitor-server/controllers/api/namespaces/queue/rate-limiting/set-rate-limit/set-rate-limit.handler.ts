import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { SetRateLimitRequestDTO } from './set-rate-limit.request.DTO';
import { SetRateLimitResponseDTO } from './set-rate-limit.response.DTO';

export const SetRateLimitHandler: TRouteControllerActionHandler<
  SetRateLimitRequestDTO,
  SetRateLimitResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.setQueueRateLimit(ctx.state.dto);
  };
};
