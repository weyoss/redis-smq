/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type Koa from 'koa';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import { getAbsoluteFSPath as swaggerUiDistDir } from 'swagger-ui-dist';
import { buildSwaggerHtml } from './swaggerHtml.js';

export interface ServeSwaggerOptions {
  /**
   * The server's base path — the same value the router uses as its
   * Koa `prefix`. Either `'/'` or a normalized path such as `'/foo'`.
   */
  basePath: string;

  /**
   * Absolute path to the directory containing the generated OpenAPI
   * document. Typically `constants.assetsDir` (`dist/assets/`).
   */
  assetsDir: string;

  /**
   * Filename of the OpenAPI document within `assetsDir`.
   * Typically `constants.openapiSchemaFilename`.
   */
  specFilename: string;
}

/**
 * Mounts the Swagger UI, its static assets, and the generated OpenAPI
 * document onto the Koa app.
 *
 * Three mounts are installed under `basePath`:
 *
 *   - `<basePath>/swagger/ui/*`      — Swagger UI assets, served from
 *                                       `swagger-ui-dist`'s directory.
 *   - `<basePath>/swagger/assets/*`  — the generated OpenAPI document
 *                                       and any other files in
 *                                       `assetsDir`.
 *   - `<basePath>/swagger`           — the HTML entry point that wires
 *                                       the two together.
 *
 * ## Path composition
 *
 * `basePath` and the Swagger sub-paths are composed with a small
 * helper rather than `path.join`. `path.join` normalizes `'/'` and
 * collapses doubled slashes in ways that are correct for filesystem
 * paths but wrong for URLs — `join('/', '/swagger/ui')` returns
 * `'/swagger/ui'`, and `join('/foo/', '/swagger')` returns
 * `'/foo/swagger'` only by luck of POSIX normalization. The helper
 * makes the composition rule explicit: one leading slash, one slash
 * between segments, no trailing slash.
 *
 * ## Why the HTML handler is a bare function
 *
 * `koa-mount` accepts either a Koa app or a middleware. A middleware
 * is enough here: the HTML is a static string that depends on the
 * two asset paths, both of which are known at mount time. There is no
 * per-request branching.
 *
 * The handler only responds when the request path is exactly the
 * mount root. Requests to `<basePath>/swagger/anything-else` fall
 * through unhandled, which Koa turns into a 404. That's the desired
 * behavior — Swagger UI serves everything else under `/swagger/ui/*`.
 */
export function serveSwagger(app: Koa, opts: ServeSwaggerOptions): void {
  const uiPath = joinUrl(opts.basePath, 'swagger', 'ui');
  const assetsPath = joinUrl(opts.basePath, 'swagger', 'assets');
  const rootPath = joinUrl(opts.basePath, 'swagger');

  // 1. Swagger UI's own distribution directory — swagger-ui.css,
  //    swagger-ui-bundle.js, favicons, etc.
  app.use(mount(uiPath, koaStatic(swaggerUiDistDir())));

  // 2. Generated assets — openapi-specs.json lives here.
  app.use(mount(assetsPath, koaStatic(opts.assetsDir)));

  // 3. The HTML entry point. `specUrl` and `uiAssetsUrl` are absolute
  //    paths (leading slash) because Swagger UI resolves them from the
  //    browser's origin, not from the HTML's location.
  const specUrl = joinUrl(assetsPath, opts.specFilename);
  const html = buildSwaggerHtml(specUrl, uiPath);

  app.use(
    mount(rootPath, (ctx: Koa.Context) => {
      // `mount` strips the mount prefix from `ctx.path` before invoking
      // the handler, so the root of the mount appears as `'/'` here.
      if (ctx.path === '/' || ctx.path === '') {
        ctx.type = 'text/html; charset=utf-8';
        ctx.body = html;
      }
      // Non-root sub-paths fall through to Koa's 404.
    }),
  );
}

/**
 * Composes URL path segments into a single absolute path.
 *
 *   joinUrl('/', 'swagger')                → '/swagger'
 *   joinUrl('/foo', 'swagger', 'ui')       → '/foo/swagger/ui'
 *   joinUrl('/foo/', '/swagger/', '/ui')   → '/foo/swagger/ui'
 *
 * Every returned path begins with `/` and contains no doubled or
 * trailing slashes.
 */
function joinUrl(...segments: string[]): string {
  const parts = segments
    .flatMap((segment) => segment.split('/'))
    .filter((part) => part.length > 0);
  return `/${parts.join('/')}`;
}
