/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { WebServerError } from './WebServerError.js';

/**
 * Thrown by `parseConfig` when the `webServer` section of the user's
 * config fails validation.
 *
 * The three fields it validates today:
 *
 *   - `port` — must be an integer in [1, 65535].
 *   - `basePath` — must be a string.
 *   - `apiProxyTarget` — if present, must be a valid `http:` or
 *     `https:` URL.
 */
export class InvalidWebServerParamsError extends WebServerError<{
  field: string;
  value: unknown;
  reason: string;
}> {
  static override readonly defaultMessage = 'Invalid web server parameters.';
}
