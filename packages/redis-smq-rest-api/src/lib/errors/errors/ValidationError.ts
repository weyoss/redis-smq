/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ErrorObject } from 'ajv';
import { RedisSmqRestApiError } from './RedisSmqRestApiError.js';

export class ValidationError extends RedisSmqRestApiError {
  readonly errorObjects;

  constructor(errorObjects: Partial<ErrorObject>[]) {
    super();
    this.errorObjects = errorObjects;
  }
}
