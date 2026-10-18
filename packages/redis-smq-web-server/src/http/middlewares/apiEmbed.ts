/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Express, NextFunction, Request, Response } from 'express';
import { posix } from 'node:path';
import type { Deps } from '../../deps/index.js';

/**
 * Routes `<basePath>/api/*` and `<basePath>/swagger/*` requests to the
 * embedded REST API's request handler.
 *
 * Synchronous by contract. The handler was resolved in `createDeps` and
 * is available as `deps.embeddedApiHandler`. That's what lets
 * `buildApp` compose middlewares with a plain `apiEmbed(deps, basePath)(app)`
 * call — no `await` at the composition site, no async middleware
 * installation.
 *
 * The guard on `deps.embeddedApiHandler` is a defensive assertion
 * against a caller that invokes `apiEmbed` while in proxy mode. In the
 * composition inside `buildApp`, this branch is unreachable — the
 * `else` arm installs `apiProxy` instead.
 */
export function apiEmbed(deps: Deps, basePath: string) {
  if (!deps.embeddedApiHandler) {
    throw new Error(
      'apiEmbed invoked without an embedded API handler. ' +
        'createDeps must resolve getApplication() when mode is "embed".',
    );
  }

  const handler = deps.embeddedApiHandler;
  const apiPrefix = posix.join(basePath, 'api');
  const swaggerPrefix = posix.join(basePath, 'swagger');

  const isApiRequest = (path: string): boolean =>
    path === apiPrefix ||
    path.startsWith(`${apiPrefix}/`) ||
    path === swaggerPrefix ||
    path.startsWith(`${swaggerPrefix}/`);

  return (app: Express): void => {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      if (isApiRequest(req.path)) {
        handler(req, res);
        return;
      }
      next();
    });
  };
}
