/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Express } from 'express';

/**
 * Configures Express to trust the `X-Forwarded-*` headers set by a
 * reverse proxy.
 *
 * The web server is designed to sit behind a reverse proxy (nginx,
 * Caddy, an ingress controller). The proxy terminates TLS, sets
 * `X-Forwarded-Proto` and `X-Forwarded-For`, and forwards the request
 * over plain HTTP to the server.
 *
 * Without `trust proxy`, Express reads `req.protocol` and `req.ip`
 * from the raw connection — `http` and `127.0.0.1` in a proxied
 * deployment. Two behaviors break:
 *
 *   - **The `/` → `<basePath>` redirect** (when a custom base path is
 *     set) emits an `http://` Location header, causing a redirect loop
 *     for HTTPS clients that get bounced back to HTTP.
 *
 *   - **Rate limiting and request logging** key on `req.ip`, which is
 *     the proxy's address for every request, so all clients appear
 *     identical.
 */
export function trustProxy() {
  return (app: Express): void => {
    app.set('trust proxy', true);
  };
}
