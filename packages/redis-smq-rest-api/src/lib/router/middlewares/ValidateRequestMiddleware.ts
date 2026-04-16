/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { asValue } from 'awilix';
import { TApplicationMiddleware } from '../../types/application.js';
import { ERequestPayload } from '../../types/controller.js';

export function ValidateRequestMiddleware(
  requestValidationFn: Map<ERequestPayload, (data: unknown) => void>,
): TApplicationMiddleware {
  return async (ctx, next) => {
    for (const [src, validator] of requestValidationFn.entries()) {
      if (src === ERequestPayload.PATH) {
        const params = ctx.params;
        validator(params);
        ctx.scope.register({
          requestPathDTO: asValue(params),
        });
      }
      if (src === ERequestPayload.QUERY) {
        const query = ctx.query;
        validator(query);
        ctx.scope.register({
          requestQueryDTO: asValue(query),
        });
      }
      if (src === ERequestPayload.BODY) {
        const body: Record<string, unknown> = ctx.request['body'] ?? {};
        validator(body);
        ctx.scope.register({
          requestBodyDTO: asValue(body),
        });
      }
    }
    return next();
  };
}
