import { ClassConstructor } from 'class-transformer';
import { validateDTO } from '../utils/validate-dto';
import { TMiddleware } from '../types/common';

export function ResponseValidator(
  dto: ClassConstructor<Record<any, any>>,
): TMiddleware {
  return async (ctx, next) => {
    if (ctx.status !== 204) {
      const plain: Record<string, any> = ctx.body?.data ?? {};
      const data = await validateDTO(dto, plain);
      ctx.body = { data };
    } else {
      if (ctx.body) {
        throw new Error(
          `Expected empty body for a response with 204 status code`,
        );
      }
    }
    await next();
  };
}
