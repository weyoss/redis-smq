import { ClassConstructor } from 'class-transformer';
import { validateDTO } from '../utils/validate-dto';
import { TMiddleware } from '../types/common';

export function ResponseValidator(
  dto: ClassConstructor<Record<any, any>>,
): TMiddleware {
  return async (ctx, next) => {
    const context = await validateDTO(dto, {
      status: ctx.status,
      body: ctx.body,
    });
    Object.assign(ctx, context);
    await next();
  };
}
