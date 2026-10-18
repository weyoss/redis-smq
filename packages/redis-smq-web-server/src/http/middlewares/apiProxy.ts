/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Express, NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { posix } from 'node:path';
import type { Deps } from '../../deps/index.js';

/**
 * Forwards `<basePath>/api/*` and `<basePath>/swagger/*` requests to an
 * upstream `redis-smq-rest-api` instance.
 *
 * ## Request flow
 *
 * A client requests `GET http://web-host:8080/smq/api/queues`. The
 * middleware:
 *
 *   1. Matches the path against `<basePath>/api` and `<basePath>/swagger`
 *      prefixes. A non-match falls through to `next()` — the SPA
 *      fallback or the static handler will handle it.
 *   2. Delegates to the proxy, which forwards the full path to
 *      `<proxyTarget>/smq/api/queues` with `Host` rewritten to the
 *      target's host.
 *
 * The path is **preserved**, not stripped. The upstream must be
 * configured with the same `apiServer.basePath` the web server uses
 * (`/smq` in the example above), or the target must be at `basePath:
 * '/'` — which is the same thing when the web server is also at `/`.
 * See `docs/README.md` for the deployment patterns.
 */
export function apiProxy(deps: Deps, basePath: string) {
  if (!deps.proxyTarget) {
    throw new Error(
      'apiProxy middleware invoked in embed mode. buildApp should only ' +
        'install it when deps.mode is "proxy".',
    );
  }

  const apiPrefix = posix.join(basePath, 'api');
  const swaggerPrefix = posix.join(basePath, 'swagger');

  const isApiRequest = (path: string): boolean =>
    path === apiPrefix ||
    path.startsWith(`${apiPrefix}/`) ||
    path === swaggerPrefix ||
    path.startsWith(`${swaggerPrefix}/`);

  const proxy = createProxyMiddleware({
    target: deps.proxyTarget,
    changeOrigin: true,
    ws: true,
    on: {
      error: (err, _req, res) => {
        deps.logger.error(
          `API proxy error (target: ${deps.proxyTarget}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );

        if (res && 'writeHead' in res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: { code: 502, message: 'BadGateway' },
            }),
          );
        }
      },
    },
  });

  return (app: Express): void => {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      if (isApiRequest(req.path)) {
        proxy(req, res, next);
        return;
      }
      next();
    });
  };
}
