/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Context, Middleware } from 'koa';
import { getHttpStatus, RequestValidationError } from '../errors/index.js';

/**
 * Terminates every failed request with a structured error body.
 *
 * Installed as the outermost middleware by the server, so a throw from
 * any downstream middleware or handler bubbles up to the single
 * `try/catch` below. Nothing escapes this handler.
 *
 * ## Response shape
 *
 * Success responses are `{ data: ... }` (written by the router).
 * Failed responses are:
 *
 *   { error: { code: <status>, message: <error name>, details?: <…> } }
 *
 *   - `code`    — the HTTP status, an integer.
 *   - `message` — `error.name` for known errors, or
 *                 `'InternalServerError'` for unrecognized throwables.
 *   - `details` — present only for `RequestValidationError`, whose
 *                 metadata carries AJV's field-level diagnostics.
 */
export function errorHandler(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      const status = getHttpStatus(error);

      if (status === null) {
        writeInternalError(ctx);
        return;
      }

      const details =
        error instanceof RequestValidationError
          ? error.metadata?.errorObjects
          : undefined;

      ctx.status = status;
      ctx.body = {
        error: {
          code: status,
          message: error instanceof Error ? error.name : 'InternalServerError',
          ...(details ? { details } : {}),
        },
      };
    }
  };
}

/**
 * Writes the response for an unrecognized error.
 *
 * Uses a fixed body — never the thrown error's `message`, `name`,
 * `stack`, or any other field — so an unexpected internal failure
 * cannot leak implementation details through the HTTP layer. The
 * underlying error still reaches `app.on('error', …)` listeners
 * installed by the composition root, where it can be logged and
 * inspected; only the *response* is opaque.
 */
function writeInternalError(ctx: Context): void {
  ctx.status = 500;
  ctx.body = {
    error: { code: 500, message: 'InternalServerError' },
  };
}
