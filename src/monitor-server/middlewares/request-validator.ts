import { ClassConstructor } from 'class-transformer';
import { validateDTO } from '../utils/validate-dto';
import { ERouteControllerActionPayload } from '../lib/routing';
import { TMiddleware } from '../types/common';

type TContext = {
  query: Record<string, any>;
  request: { body?: Record<string, any> };
  state: { dto: Record<string, any> };
};

export function RequestValidator(
  dto: ClassConstructor<any>,
  payload: ERouteControllerActionPayload,
): TMiddleware {
  return async (ctx: TContext, next) => {
    const plain: Record<string, any> =
      (payload === 'query' ? ctx.query : ctx.request.body) ?? {};
    ctx.state.dto = await validateDTO(dto, plain);
    await next();
  };
}
