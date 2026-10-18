/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import express, { type Express, type Response } from 'express';
import type { Deps } from '../../deps/index.js';

/**
 * Extensions that receive the long-lived cache header.
 *
 * Matches the original package's list exactly. Files whose path ends in
 * one of these extensions are treated as immutable build output — the
 * Vite bundle for `redis-smq-web-ui` fingerprints its asset filenames
 * (`main.abc123.js`, `index-def456.css`), so a given URL always names
 * the same content. A 24-hour `Cache-Control: public, max-age=86400`
 * lets browsers and intermediate caches serve these without a
 * round-trip.
 *
 * Anything not in this list — `index.html` chiefly, but also any
 * unexpected file the SPA bundle ships — falls through to
 * `Cache-Control: no-cache`. The `no-cache` directive means "revalidate
 * before use": the browser still caches the file, but sends a
 * conditional request each time and reuses the cached copy only on a
 * `304 Not Modified`. That's the correct policy for `index.html`,
 * which changes on every deploy and points at new bundle hashes.
 */
const CACHEABLE_EXTENSIONS = /\.(png|jpg|jpeg|gif|ico|svg|css|js)$/;

/**
 * Mounts the `redis-smq-web-ui` static bundle at `<basePath>`.
 *
 * ## mount is at `basePath` and not `<basePath>/assets`
 *
 * The Vite bundle's layout is not confined to a single directory. The
 * typical build ships:
 *
 *   - `index.html`
 *   - `assets/main-<hash>.js`
 *   - `assets/main-<hash>.css`
 *   - `favicon.svg`, `favicon.ico`
 *   - `robots.txt`, if configured
 *
 * Serving under `basePath` (not `<basePath>/assets`) keeps every file
 * at the URL the bundle's HTML references. A `<base href="...">` or a
 * `src="/assets/foo.js"` in `index.html` works without rewriting.
 *
 * ## `index: false`
 *
 * `express.static` normally serves `index.html` when the request path
 * resolves to a directory. That would mean `GET /` returns the raw
 * template, before the SPA fallback has a chance to inject
 * `window.configs`. With `index: false`, directory requests fall
 * through to the next middleware in the chain, which is the SPA
 * fallback.
 *
 * The flip side is that a *direct* request for `/index.html` still
 * serves the file — `index: false` only affects directory resolution,
 * not file resolution. That's why the CLI test asserts cache headers
 * on `GET /index.html`: it exercises the static middleware, not the
 * SPA fallback.
 *
 * ## `etag` and `lastModified` are set explicitly
 *
 * Both are Express defaults (`true`). They're set here anyway so the
 * reader doesn't have to consult `serve-static`'s documentation to
 * know they're active. The SPA tests assert on `etag` being present in
 * the response headers, and if a future Express or `serve-static`
 * version ever changed the default, this file would keep the behavior
 * stable.
 *
 * ## Cache-Control and `setHeaders`
 *
 * `serve-static` sets a default `Cache-Control: public, max-age=0`
 * before calling `setHeaders`. The callback in this middleware
 * replaces that with an extension-dependent policy. Node's
 * `res.setHeader` is a replace, not an append, so the custom header
 * wins.
 */
export function staticFiles(deps: Deps, basePath: string) {
  return (app: Express): void => {
    app.use(
      basePath,
      express.static(deps.webUIStaticDir, {
        etag: true,
        lastModified: true,
        index: false,
        setHeaders: (res: Response, filePath: string) => {
          if (CACHEABLE_EXTENSIONS.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
  };
}
