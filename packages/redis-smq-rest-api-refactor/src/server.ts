/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import * as http from 'node:http';
import Koa from 'koa';
import { RedisSMQ } from 'redis-smq';
import {
  constants,
  parseConfig,
  type IParsedConfig,
  type IRedisSMQRestApiConfig,
} from './config/index.js';
import { createDeps, type Deps } from './deps/index.js';
import { routes } from './features/routes.js';
import { buildRouter, errorHandler } from './http/index.js';
import { serveSwagger } from './openapi/index.js';
import { OPENAPI_SCHEMA_FILENAME } from './config/constants.js';

/**
 * Node request handler shape returned by `Koa#callback()`.
 *
 * A Koa middleware is `(ctx, next) => Promise<void>`; the *callback*
 * is what `http.createServer()` and Express `app.use()` accept. Both
 * types are called "handlers", which makes them easy to confuse — the
 * alias below names the one this class returns.
 *
 * The union with HTTP/2 types matches Koa's own `callback()` signature
 * exactly, so the return value assigns without a cast.
 */
type NodeRequestHandler = (
  req: http.IncomingMessage | import('node:http2').Http2ServerRequest,
  res: http.ServerResponse | import('node:http2').Http2ServerResponse,
) => void;

/**
 * The package's public entry point.
 *
 * ## Usage
 *
 *   const api = new RedisSMQRestApi(config);
 *   await api.run();          // starts an HTTP listener
 *   // ... later
 *   await api.shutdown();
 *
 * For embedded mode — mounting the API inside an existing host app —
 * pass `false` as the second argument and use `getApplication()` to
 * obtain the Node request handler:
 *
 *   // Express host:
 *   const api = new RedisSMQRestApi(config, false);
 *   hostExpress.use(await api.getApplication());
 *
 *   // Koa host — mount the app itself, not the callback:
 *   const api = new RedisSMQRestApi(config, false);
 *   hostKoa.use(mount('/api', api.getKoaApp()));
 *
 * ## Lifecycle
 *
 * Construction is cheap and side-effect free: config is parsed, the
 * Koa app object is created, an HTTP server is constructed (but does
 * not listen). Nothing touches Redis until `run()`,
 * `getApplication()`, or `getKoaApp()` triggers `bootstrap()`.
 *
 * Bootstrap:
 *
 *   1. Initializes the RedisSMQ runtime against the configured Redis.
 *   2. Constructs the dependency bag (`createDeps`) — every manager
 *      the HTTP layer can reach.
 *   3. Installs the middleware stack: error handler, body parser,
 *      CORS, router, Swagger UI.
 *
 * Bootstrap is idempotent; subsequent calls return the cached deps.
 */
export class RedisSMQRestApi {
  private readonly app: Koa;
  private readonly httpServer: http.Server;
  private readonly config: IParsedConfig;
  private readonly runHttpServer: boolean;

  /**
   * Null until bootstrap completes; non-null thereafter. TypeScript
   * can't know this without a flag, so methods that need it either
   * call `bootstrap()` (which returns the value) or read it after
   * checking. It's cleared by `shutdown()` so a second bootstrap
   * would rebuild from scratch.
   */
  private deps: Deps | null = null;

  constructor(config: IRedisSMQRestApiConfig = {}, runHttpServer = true) {
    this.config = parseConfig(config);
    this.runHttpServer = runHttpServer;
    this.app = new Koa();
    this.httpServer = http.createServer(this.app.callback());
  }

  /**
   * Initializes the runtime and installs the middleware stack.
   *
   * Idempotent: a second call returns the cached `Deps` without
   * re-running `RedisSMQ.initialize` or re-installing middlewares.
   *
   * Errors from `RedisSMQ.initialize` propagate to the caller of
   * `run()` or `getApplication()`. There is no logging here — the
   * logger is created by `createDeps`, which runs *after*
   * initialization succeeds, so it isn't available if Redis is
   * unreachable. The stack trace from the thrown error is the
   * diagnostic.
   */
  private async bootstrap(): Promise<Deps> {
    if (this.deps) return this.deps;

    await RedisSMQ.initialize(this.config.redis);

    const deps = createDeps(this.config);

    // Order matters. Koa runs middlewares in registration order, so
    // the error handler must be first (outermost) to catch anything
    // the later middlewares or the router throw.
    this.installCoreMiddleware();
    this.installRouter(deps);
    this.installSwagger();

    this.deps = deps;
    return deps;
  }

  /**
   * Framework-level middlewares that apply to every request.
   *
   * `errorHandler()` writes the error envelope and terminates the
   * response on failure. `bodyParser()` populates `ctx.request.body`
   * for JSON payloads. `cors({ origin: '*' })` opens the API to
   * cross-origin requests — matches the original package's behavior;
   * a future version may expose this as a config option.
   */
  private installCoreMiddleware(): void {
    this.app.use(errorHandler());
    this.app.use(bodyParser());
    this.app.use(cors({ origin: '*' }));
  }

  /**
   * Installs the Koa router. The route table (`routes`) is the same
   * array consumed by the OpenAPI builder in
   * `src/scripts/gen-openapi.ts`, so the running server and the
   * generated spec cannot diverge.
   *
   * The router carries the API's `basePath` as its prefix; each
   * route's `path` is the remainder (e.g. `/api/ping`).
   */
  private installRouter(deps: Deps): void {
    const router = buildRouter(routes, deps, {
      basePath: this.config.apiServer.basePath,
    });
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  /**
   * Installs the Swagger UI mount, the static spec assets, and the
   * HTML entry point under `<basePath>/swagger`.
   *
   * Runs after `installRouter` so that a route explicitly declared
   * under `/swagger` in the future would take precedence. Today no
   * such route exists; the ordering is defensive.
   */
  private installSwagger(): void {
    serveSwagger(this.app, {
      basePath: this.config.apiServer.basePath,
      assetsDir: constants.assetsDir,
      specFilename: OPENAPI_SCHEMA_FILENAME,
    });
  }

  /**
   * Boots the server and starts listening.
   *
   * When `runHttpServer` was `false` (embedded mode), this method
   * bootstraps the runtime and returns without opening a socket.
   * That's the intended path for callers who use `getApplication()`
   * or `getKoaApp()`.
   *
   * When `runHttpServer` was `true` (default), the promise resolves
   * once the listener is bound and accepting connections.
   */
  async run(): Promise<void> {
    const deps = await this.bootstrap();
    if (!this.runHttpServer) return;

    const { port, basePath } = this.config.apiServer;

    await new Promise<void>((resolve) => {
      this.httpServer.listen(port, () => resolve());
    });

    const suffix = basePath === '/' ? '' : basePath;
    const origin = `http://localhost:${port}${suffix}`;

    deps.logger.info(`RedisSMQ REST API listening on ${origin}`);
    deps.logger.info(`Swagger UI available at ${origin}/swagger`);
  }

  /**
   * Returns the Node request handler for embedding in an Express app
   * or a raw `http.createServer()` call.
   *
   * The returned function has the `(req, res) => void` signature that
   * Express's `app.use()` and Node's `http.createServer()` accept.
   * For a Koa host, use `getKoaApp()` instead — Koa's `app.use()`
   * expects a Koa middleware, not a Node handler.
   *
   * Boots the runtime on first call; subsequent calls reuse the
   * already-installed middleware stack.
   */
  async getApplication(): Promise<NodeRequestHandler> {
    await this.bootstrap();
    return this.app.callback();
  }

  /**
   * Returns the underlying Koa application.
   *
   * Use this when mounting into another Koa app via `koa-mount`, or
   * when attaching event listeners (`app.on('error', ...)`) that need
   * to be registered on the inner app rather than on a host wrapper.
   *
   * Boots the runtime on first call; subsequent calls reuse the
   * already-installed middleware stack.
   */
  async getKoaApp(): Promise<Koa> {
    await this.bootstrap();
    return this.app;
  }

  /**
   * Closes the HTTP listener (if any) and shuts down the RedisSMQ
   * runtime.
   *
   * Order is load-bearing:
   *
   *   1. `httpServer.close()` stops accepting new connections and
   *      waits for in-flight requests to drain. Without this step,
   *      `RedisSMQ.shutdown()` could cut off a handler mid-execution.
   *
   *   2. `RedisSMQ.shutdown()` disposes every manager created by
   *      `createDeps` — the producer, the config manager, the message
   *      browsers. This is the single teardown call; there is no
   *      per-dependency shutdown beyond this.
   *
   * After shutdown the instance is inert. The class is designed for a
   * single construct / run / shutdown cycle. A second `run()` would
   * rebuild the runtime but the Koa app would still carry middlewares
   * from the first install, producing duplicate handlers.
   */
  async shutdown(): Promise<void> {
    if (this.httpServer.listening) {
      await new Promise<void>((resolve) => {
        this.httpServer.close(() => resolve());
      });
    }

    await RedisSMQ.shutdown();
    this.deps = null;
  }
}
