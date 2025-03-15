/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';
import { getErrorResponseParams } from '../../../app/errors/getErrorResponseParams.js';
import { TApplicationMiddleware } from '../../application/types/index.js';
import { ValidationError } from '../errors/ValidationError.js';

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
      const [code, message] = getErrorResponseParams(e);
      ctx.body = {
        error: {
          code,
          message,
          details: e instanceof ValidationError ? e.errorObjects : {},
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
