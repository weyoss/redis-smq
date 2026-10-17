/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQRestApiError } from './RedisSMQRestApiError.js';

/**
 * Metadata carried by every instance. Every field is optional because
 * different validation failures surface different information:
 *
 *   - port out of range      → { field: 'port', value: 99999, reason: '...' }
 *   - basePath wrong type    → { field: 'basePath', value: 42, reason: '...' }
 *
 * Keeping `value` typed as `unknown` (rather than `string | number`)
 * means the caller can attach any offending value without the compiler
 * fighting it — the error is diagnostic, not a control-flow signal.
 */
export interface InvalidApiServerParamsMetadata extends Record<
  string,
  unknown
> {
  field?: string;
  value?: unknown;
  reason?: string;
}

/**
 * Thrown by `parseConfig()` when the `apiServer` section of the user's
 * config fails validation — invalid port, malformed basePath, etc.
 *
 * Not thrown for Redis config problems: those are validated later by
 * `RedisSMQ.initialize` and surface as redis-smq errors.
 */
export class InvalidApiServerParamsError extends RedisSMQRestApiError<InvalidApiServerParamsMetadata> {
  static override readonly code =
    'RedisSMQRestApi.Configuration.InvalidApiServerParams';
  static override readonly defaultMessage = 'Invalid API server parameters.';
}
