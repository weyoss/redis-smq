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
 * Same shape as `RequestValidationMetadata` — AJV's diagnostic array,
 * passed through verbatim. Kept as a distinct interface (rather than
 * aliasing the request-side one) because the two are conceptually
 * different failures: a bad request means the client sent something
 * wrong; a bad response means the *handler* produced something wrong.
 * They just happen to share AJV's output format.
 */
export interface ResponseValidationMetadata extends Record<string, unknown> {
  errorObjects: Partial<ErrorObject>[];
}

/**
 * Thrown by `validateOutput()` when a handler's response body does not
 * conform to the route's declared response schema for that status.
 *
 * **This is a bug in the handler, not in the caller's request.**
 *
 * That distinction matters for how the error surfaces:
 *
 *   - The HTTP `errorHandler` maps it to **500 Internal Server Error**,
 *     not 4xx. A schema mismatch means the server's own contract is
 *     broken; the caller did nothing wrong.
 *   - Response validation is disabled by default in production. When
 *     enabled, it catches handler bugs during tests and staging before
 *     they ship — the same way assertions do.
 *
 * When this is thrown, the response schema (from the DTO) and the
 * handler's actual return value disagree. The fix is almost always one
 * of:
 *
 *   1. The handler returns the wrong shape.
 *   2. The DTO was changed but the handler wasn't.
 *   3. The DTO was changed but `pnpm gen:json-schema` wasn't re-run.
 *
 * All three are caught at the HTTP test tier — the error surfaces
 * there because tests run with `validateResponses: true`.
 */
export class ResponseValidationError extends RedisSMQRestApiError<ResponseValidationMetadata> {
  static override readonly code =
    'RedisSMQRestApi.ResponseDTO.ValidationFailed';
  static override readonly defaultMessage = 'Response validation failed.';
}
