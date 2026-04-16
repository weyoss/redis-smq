/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from './errors.js';

/**
 * Get HTTP status code and error message for a given error name
 * Falls back to 500 Internal Server Error for unknown errors
 */
export function getErrorResponseParams(
  errorName: string,
): readonly [number, string] {
  const mapping = errors[errorName as keyof typeof errors];
  return mapping ?? [500, 'InternalServerError'];
}
