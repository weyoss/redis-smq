/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Express, NextFunction, Request, Response } from 'express';
import { extname, posix } from 'node:path';
import type { Deps } from '../../deps/index.js';

/**
 * Serves the SPA HTML for any GET request not claimed by a more
 * specific middleware.
 *
 * ## `app.use` and not `app.get('*', …)`
 *
 * Express 5 uses `path-to-regexp@8`, whose wildcard syntax requires a
 * name — `*` alone is a parameter with a missing identifier and throws
 * `Missing parameter name at index 1: *` at route registration. Even
 * the documented replacement, `/{*splat}`, does not match the bare
 * root `/` under Express 5's matcher in the current release, which is
 * exactly the request `spaFallback` needs to catch when
 * `express.static` is mounted with `index: false`.
 *
 * `app.use` sidesteps the path-matching API entirely. It runs for
 * every request regardless of path, and the guards below decide
 * whether to respond or fall through. The method check (`GET` only)
 * reproduces the one behavioral difference between `app.use` and
 * `app.get('*', …)` — a `POST` to a non-API path should not get an
 * HTML response.
 *
 * ## `deps.spaHtml` is pre-rendered
 *
 * The HTML contains a `window.configs` script tag the SPA reads at
 * startup to learn where its API lives. The values (`BASE_PATH`,
 * `API_URL`) both derive from `config.webServer.basePath` and are
 * fixed for the server's lifetime. `createDeps` renders the script
 * into the template once at bootstrap and stores the result as
 * `deps.spaHtml`. This middleware serves that string verbatim — no
 * per-request template substitution, no reconstruction of the config
 * script on the hot path.
 *
 * ## The three guards, and why they run in this order
 *
 * 1. **Method** — only `GET` continues. A non-GET request to a
 *    non-API path is a client bug (there's no handler for it) and
 *    should produce Express's default 404, not an HTML 200.
 *
 * 2. **API and Swagger prefixes** — anything under
 *    `<basePath>/api` or `<basePath>/swagger` belongs to the
 *    embedded or proxied API. In the composition installed by
 *    `buildApp`, those middlewares run before this one and have
 *    already responded; the guard exists so a future reordering
 *    cannot silently break the API by letting `spaFallback` intercept
 *    it.
 *
 * 3. **File extension** — a request for `/assets/main.js` either
 *    matched a static file (and was served by `staticFiles`) or did
 *    not (and should 404). It must not fall through to the SPA HTML,
 *    which would return HTML for a JavaScript URL.
 *
 * 4. **Accept header** — a programmatic client that sends
 *    `Accept: application/json` (or any non-HTML value) does not want
 *    HTML back. Only requests whose `Accept` header includes
 *    `text/html` (or that omit the header entirely, as `curl` and
 *    older `fetch` implementations sometimes do) reach the SPA
 *    response.
 *
 * The guards are cheap (string comparisons and one regex) and
 * cumulative — a request has to pass all four to receive the HTML.
 */
export function spaFallback(deps: Deps, basePath: string) {
  const apiPrefix = posix.join(basePath, 'api');
  const swaggerPrefix = posix.join(basePath, 'swagger');

  // Pre-rendered at bootstrap — no per-request work.
  const html = deps.spaHtml;

  return (app: Express): void => {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      if (req.method !== 'GET') {
        return next();
      }

      const path = req.path;

      if (
        path === apiPrefix ||
        path.startsWith(`${apiPrefix}/`) ||
        path === swaggerPrefix ||
        path.startsWith(`${swaggerPrefix}/`)
      ) {
        return next();
      }

      if (extname(path)) {
        return next();
      }

      if (req.headers.accept && !req.headers.accept.includes('text/html')) {
        return next();
      }

      res.type('html').send(html);
    });
  };
}
