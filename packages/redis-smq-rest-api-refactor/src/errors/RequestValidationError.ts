/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { ErrorObject } from 'ajv';
import { RedisSMQRestApiError } from './RedisSMQRestApiError.js';

/**
 * Metadata carried by every instance.
 *
 * `errorObjects` is the array AJV produces when a schema fails to
 * validate. It is passed through verbatim so the HTTP response can
 * expose the same diagnostics a caller would see if they ran AJV
 * themselves.
 */
export interface RequestValidationMetadata extends Record<string, unknown> {
  errorObjects: Partial<ErrorObject>[];
}

/**
 * Thrown by `validateInput()` when a request's path, query, or body
 * does not conform to the route's declared schema.
 *
 * The HTTP error handler detects this class specifically and inlines
 * `metadata.errorObjects` into the response body, so clients get
 * precise field-level errors instead of an opaque 400.
 */
export class RequestValidationError extends RedisSMQRestApiError<RequestValidationMetadata> {
  static override readonly code = 'RedisSMQRestApi.RequestDTO.ValidationFailed';
  static override readonly defaultMessage = 'Request validation failed.';
}
