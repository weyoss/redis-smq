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
 * Thrown by `createDeps` when the `redis-smq-web-ui` static bundle
 * cannot be loaded.
 *
 * `redis-smq-web-ui` exports `getDistPath()` which returns the absolute
 * path to its built bundle directory. The web server reads `index.html`
 * from that directory once, at bootstrap, to pre-render the SPA
 * template. This error is thrown if:
 *
 *   - The directory returned by `getDistPath()` does not exist.
 *   - The directory exists but `index.html` is missing.
 *   - `index.html` exists but does not contain a `</head>` tag — which
 *     would mean the bundle is corrupted or is not the file the web
 *     server expects.
 */
export class WebUIBundleNotFoundError extends WebServerError<{
  path: string;
  reason?: string;
}> {
  static override readonly defaultMessage =
    'RedisSMQ Web UI bundle could not be loaded.';
}
