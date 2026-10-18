/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Express, Request, Response } from 'express';

/**
 * Redirects `GET /` to `<basePath>` when the server is mounted under a
 * non-root base path.
 */
export function rootRedirect(basePath: string) {
  return (app: Express): void => {
    // No redirect when the SPA is served at the origin root.
    if (basePath === '/') return;

    app.get('/', (req: Request, res: Response): void => {
      // Preserve the query string if the request had one. `req.url` at
      // a top-level route handler is the path plus the query — for
      // `GET /?foo=bar` it is `/?foo=bar`, so `slice(1)` yields
      // `?foo=bar`. Concatenating to `basePath` produces
      // `/smq?foo=bar`.
      const queryIndex = req.url.indexOf('?');
      const query = queryIndex === -1 ? '' : req.url.slice(queryIndex);
      res.redirect(basePath + query);
    });
  };
}
