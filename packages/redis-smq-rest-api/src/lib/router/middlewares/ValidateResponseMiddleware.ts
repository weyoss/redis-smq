/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TApplicationMiddleware } from '../../application/types/index.js';
import { ResponseValidatorNotFoundError } from '../errors/ResponseValidatorNotFoundError.js';

export function ValidateResponseMiddleware(
  validatorMap: Map<string, (data: unknown) => void>,
): TApplicationMiddleware {
  return async (ctx, next) => {
    const key = ctx.state.responseSchemaKey;
    const validator = validatorMap.get(key);
    if (validator) {
      validator(ctx.body);
      return next();
    }
    throw new ResponseValidatorNotFoundError();
  };
}
