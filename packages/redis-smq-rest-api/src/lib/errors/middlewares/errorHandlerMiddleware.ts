/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';
import { RequestValidationError } from '../../router/errors/RequestValidationError.js';
import { TApplicationMiddleware } from '../../types/application.js';
import { isRedisSMQError } from '../../../errors/isRedisSMQError.js';
import { getErrorResponseParams } from '../../../errors/getErrorResponseParams.js';

/**
 * Error handler middleware that transforms RedisSMQ errors into appropriate HTTP responses
 */
export const errorHandlerMiddleware: TApplicationMiddleware = async (
  ctx,
  next,
) => {
  try {
    await next();
  } catch (error: unknown) {
    // Log the error (consider using a proper logger from DI container)
    console.error('Request error:', error);

    // Handle RedisSMQ errors
    if (isRedisSMQError(error)) {
      handleRedisSMQError(ctx, error);
      return;
    }

    // Handle unknown errors
    handleUnknownError(ctx, error);
  }
};

/**
 * Handle RedisSMQ errors with proper HTTP status codes
 */
function handleRedisSMQError(
  ctx: Parameters<typeof errorHandlerMiddleware>[0],
  error: RedisSMQError,
): void {
  const [statusCode, message] = getErrorResponseParams(error.name);

  const details =
    error instanceof RequestValidationError
      ? error.getMetadata()?.errorObjects
      : undefined;

  ctx.status = statusCode;
  ctx.body = {
    error: {
      code: statusCode,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Handle unknown errors with a generic 500 response
 */
function handleUnknownError(
  ctx: Parameters<typeof errorHandlerMiddleware>[0],
  error: unknown,
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  ctx.status = 500;
  ctx.body = {
    error: {
      code: 500,
      message: 'InternalServerError',
      details:
        isDevelopment && error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : undefined,
    },
  };
}
