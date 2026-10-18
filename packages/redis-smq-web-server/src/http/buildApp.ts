/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import express from 'express';
import type { Deps } from '../deps/index.js';
import {
  apiEmbed,
  apiProxy,
  rootRedirect,
  spaFallback,
  staticFiles,
  trustProxy,
} from './middlewares/index.js';

export interface BuildAppOptions {
  /**
   * The server's base path — either `'/'` or a normalized path such as
   * `'/smq'`. Passed separately from `Deps` because it configures *where*
   * the middlewares mount, not *what* they need to function. A test that
   * wants to exercise the composition against a different base path can
   * pass a different value without constructing a whole new `Deps`.
   */
  basePath: string;
}

/**
 * Composes the Express application from the middleware factories.
 *
 * All async work — loading the Web UI bundle, resolving the embedded
 * REST API's request handler — happens in `createDeps`. By the time this
 * function runs, `deps` is fully populated and this function is a pure
 * sequence of `install(app)` calls with no I/O. That's what allows
 * `buildApp` to be synchronous and makes it trivially testable: construct
 * a `Deps` by hand, call `buildApp`, inspect the resulting app.
 *
 * ## Ordering
 *
 * Koa's and Express's middleware chains both run in registration order.
 * Every position in this stack is load-bearing:
 *
 *   1. **`trustProxy`** — a configuration step, not a request handler.
 *      Must run before any middleware that reads `req.protocol` or
 *      `req.ip`. Today that's `rootRedirect` (which generates a
 *      `Location` header) and any future request-logging middleware.
 *
 *   2. **`staticFiles`** — mounted at `<basePath>`, serves anything the
 *      Web UI bundle ships at its natural URL. `index: false` means a
 *      request for `/` falls through to the SPA fallback instead of
 *      returning the raw HTML without `window.configs` injected.
 *
 *   3. **API routing** — one of `apiEmbed` or `apiProxy`, never both.
 *      Runs before static files conceptually, but it's installed after
 *      because a request for a static file happens to be more common
 *      than a request for the API, and Express's middleware chain is
 *      linear — putting the cheaper fall-through case first is a small
 *      optimization. The order here doesn't affect correctness, only
 *      the number of middlewares evaluated for a miss.
 *
 *   4. **`rootRedirect`** — only installs a handler if `basePath !== '/'`.
 *      Must run before the SPA fallback so that `GET /` under a custom
 *      base path redirects to `<basePath>` instead of returning the SPA
 *      HTML with an incorrect resource root.
 *
 *   5. **`spaFallback`** — the catch-all. Must be last. It responds to
 *      any `GET` that wasn't claimed by a static file, the API, or the
 *      redirect, and serves the SPA HTML. Running it earlier would
 *      shadow every subsequent middleware with an HTML response.
 */
export function buildApp(deps: Deps, opts: BuildAppOptions): express.Express {
  const app = express();
  const { basePath } = opts;

  trustProxy()(app);

  staticFiles(deps, basePath)(app);

  if (deps.mode === 'embed') {
    apiEmbed(deps, basePath)(app);
  } else {
    apiProxy(deps, basePath)(app);
  }

  rootRedirect(basePath)(app);

  spaFallback(deps, basePath)(app);

  return app;
}
