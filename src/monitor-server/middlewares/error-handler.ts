import { ValidationError } from 'class-validator';
import { TMiddleware } from '../types/common';

export const errorHandler: TMiddleware = async (ctx, next) => {
  try {
    await next();
  } catch (e: unknown) {
    console.log(e);
    ctx.logger.error(e);
    if (e instanceof ValidationError) {
      ctx.status = 422;
      ctx.body = {
        error: {
          code: 422,
          message: 'Validation error',
          details: e,
        },
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        error: {
          code: 500,
          message: 'Internal server error',
        },
      };
    }
  }
};
