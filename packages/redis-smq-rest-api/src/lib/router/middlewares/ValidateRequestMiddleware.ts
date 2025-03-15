/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { asValue } from 'awilix';
import { TApplicationMiddleware } from '../../application/types/index.js';
import { EControllerRequestPayload } from '../../controller/types/index.js';

export function ValidateRequestMiddleware(
  requestValidationFn: Map<EControllerRequestPayload, (data: unknown) => void>,
): TApplicationMiddleware {
  return async (ctx, next) => {
    for (const [src, validator] of requestValidationFn.entries()) {
      if (src === EControllerRequestPayload.PATH) {
        const params = ctx.params;
        validator(params);
        ctx.scope.register({
          requestPathDTO: asValue(params),
        });
      }
      if (src === EControllerRequestPayload.QUERY) {
        const query = ctx.query;
        validator(query);
        ctx.scope.register({
          requestQueryDTO: asValue(query),
        });
      }
      if (src === EControllerRequestPayload.BODY) {
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
