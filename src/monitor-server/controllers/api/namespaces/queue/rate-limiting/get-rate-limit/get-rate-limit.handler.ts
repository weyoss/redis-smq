import { TRouteControllerActionHandler } from '../../../../../../lib/routing';
import { GetRateLimitRequestDTO } from './get-rate-limit.request.DTO';
import { GetRateLimitResponseDTO } from './get-rate-limit.response.DTO';

export const GetRateLimitHandler: TRouteControllerActionHandler<
  GetRateLimitRequestDTO,
  GetRateLimitResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.getQueueRateLimit(ctx.state.dto);
  };
};
