/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import Router from '@koa/router';
import type { RouterContext, RouterMiddleware } from '@koa/router';
import type { Deps } from '../deps/index.js';
import type { HttpMethod, RouteDefinition } from './RouteDefinition.js';
import {
  compileRequestValidators,
  compileResponseValidators,
  createRequestAjv,
  createResponseAjv,
  validateInput,
  validateOutput,
} from './validate.js';

export interface BuildRouterOptions {
  /**
   * Mount point for the router. `'/'` (the default) mounts routes at
   * their declared path. Any other value is used as a Koa Router
   * `prefix` — e.g. `'/tenant/foo'` turns `/api/queues` into
   * `/tenant/foo/api/queues`.
   *
   * The value is expected to be pre-normalized by `parseConfig` — it
   * either equals `'/'` or starts with `'/'` and has no trailing slash.
   */
  basePath?: string;

  /**
   * Whether to validate handler responses against their declared
   * schemas on every request. Off by default.
   *
   * - **Production:** leave off. Response validation duplicates the
   *   work of the handler and the cost is paid on every request.
   * - **Tests:** turn on. The `tests/http` tier enables this so that a
   *   handler returning the wrong shape fails immediately with a
   *   `ResponseValidationError` pointing at the offending route.
   */
  validateResponses?: boolean;
}

/**
 * Register one route on a Koa router.
 *
 * `@koa/router` exposes `get`, `post`, … as separate methods with
 * identical signatures. Dispatching over `router[method]` directly
 * produces a union of method overloads TypeScript cannot call. This
 * table makes the dispatch explicit and type-checked: each entry
 * invokes a real method, exhaustiveness over `HttpMethod` is enforced
 * by the `Record` type, and no cast appears anywhere.
 */
function makeRegister(
  router: Router,
): Record<HttpMethod, (path: string, mw: RouterMiddleware) => void> {
  return {
    get: (path, mw) => {
      router.get(path, mw);
    },
    post: (path, mw) => {
      router.post(path, mw);
    },
    put: (path, mw) => {
      router.put(path, mw);
    },
    patch: (path, mw) => {
      router.patch(path, mw);
    },
    delete: (path, mw) => {
      router.delete(path, mw);
    },
    head: (path, mw) => {
      router.head(path, mw);
    },
  };
}

/**
 * Builds a Koa router from the route table.
 *
 * ## Compilation timing
 *
 * Both AJV instances and every per-route validator are created here —
 * **once**, at router construction. The per-request handler closes
 * over the compiled validators, so no compilation happens on the hot
 * path.
 *
 * ## Response envelope
 *
 * The handler returns `[status, body]`. This function writes:
 *
 *   - `204` → `ctx.body = null` (no envelope, no content).
 *   - `2xx` → `ctx.body = { data: body }`.
 *
 * 4xx and 5xx responses never reach this code — a handler that needs
 * to signal failure throws a `RedisSMQRestApiError` subclass, and the
 * `errorHandler` middleware (installed outermost) writes the error
 * envelope. The router only writes success responses.
 *
 * ## Response validation
 *
 * When `validateResponses` is on, response validators are compiled
 * *once* and applied to the enveloped body after it's written to
 * `ctx.body`. A mismatch throws `ResponseValidationError`, which the
 * error handler maps to a 500.
 */
export function buildRouter(
  routes: RouteDefinition[],
  deps: Deps,
  opts: BuildRouterOptions = {},
): Router {
  const basePath = opts.basePath ?? '/';
  const validateResponses = opts.validateResponses ?? false;

  const router = new Router({
    prefix: basePath === '/' ? undefined : basePath,
  });
  const register = makeRegister(router);

  // Created once, shared across all routes. See validate.ts for why
  // request and response use separate AJV instances.
  const requestAjv = createRequestAjv();
  const responseAjv = createResponseAjv();

  for (const route of routes) {
    const requestValidators = compileRequestValidators(route, requestAjv);
    const responseValidators = validateResponses
      ? compileResponseValidators(route, responseAjv)
      : null;

    const boundHandler = async (ctx: RouterContext): Promise<void> => {
      // `ctx.request.body` is injected by @koa/bodyparser and typed
      // via the ambient declaration in koa-body.d.ts.
      const input = {
        path: ctx.params as Record<string, string>,
        query: ctx.query as Record<string, unknown>,
        body: ctx.request.body,
      };

      // Throws RequestValidationError on failure. The error handler
      // catches it, inlines AJV diagnostics, and writes a 400.
      validateInput(requestValidators, input);

      // Handler runs with validated input. It returns a tuple; the
      // body has not yet been enveloped.
      const [status, body] = await route.handler(deps, input);

      // Write the response. 204 carries no body; every other success
      // status is enveloped in `{ data }`.
      ctx.status = status;
      ctx.body = status === 204 ? null : { data: body };

      // Response validation runs against the *enveloped* body — the
      // same shape the client receives and the same shape the response
      // schema declares.
      if (responseValidators) {
        validateOutput(responseValidators, status, ctx.body);
      }
    };

    register[route.method](route.path, boundHandler);
  }

  return router;
}
