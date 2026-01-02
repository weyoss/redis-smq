/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';
import { getErrorResponseParams } from '../../../errors/getErrorResponseParams.js';
import { TApplicationMiddleware } from '../../application/types/index.js';
import { RequestValidationError } from '../../router/errors/RequestValidationError.js';

export const errorHandlerMiddleware: TApplicationMiddleware = async (
  ctx,
  next,
) => {
  try {
    await next();
  } catch (e: unknown) {
    // @todo retrieve logger from the di container
    console.error(e);
    if (e instanceof RedisSMQError) {
      // type-coverage:ignore-next-line
      const [code, message] = getErrorResponseParams(e.name);
      const validationErrors =
        // type-coverage:ignore-next-line
        e instanceof RequestValidationError
          ? e.getMetadata()?.errorObjects
          : null;
      ctx.status = code;
      ctx.body = {
        error: {
          code,
          message,
          details: validationErrors ?? {},
        },
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        error: {
          code: ctx.status,
          message: 'Internal server error',
          details:
            (e instanceof Error && {
              message: e.message,
              name: e.name,
              stack: e.stack,
            }) ||
            {},
        },
      };
    }
  }
};
