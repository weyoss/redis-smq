import { ClassConstructor } from 'class-transformer';
import { validateDTO } from '../utils/validate-dto';
import { ERouteControllerActionPayload } from '../lib/routing';
import { TMiddleware } from '../types/common';

export function RequestValidator(
  dto: ClassConstructor<any>,
  payload: ERouteControllerActionPayload[],
): TMiddleware {
  return async (ctx, next) => {
    let plain: Record<string, any> = {};
    payload.forEach((i) => {
      if (i === ERouteControllerActionPayload.PATH) {
        plain = {
          ...plain,
          ...ctx.params,
        };
      } else if (i === ERouteControllerActionPayload.QUERY) {
        plain = {
          ...plain,
          ...ctx.query,
        };
      } else if (i === ERouteControllerActionPayload.BODY) {
        plain = {
          ...plain,
          ...ctx.request.body,
        };
      }
    });
    ctx.state.dto = await validateDTO(dto, plain);
    await next();
  };
}
