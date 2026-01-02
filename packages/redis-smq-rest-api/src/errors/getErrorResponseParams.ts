/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from './errors.js';

export function getErrorResponseParams(className: string) {
  const errs: Record<string, readonly [number, string]> = errors;
  return errs[className] ?? [500, 'InternalServerError'];
}
