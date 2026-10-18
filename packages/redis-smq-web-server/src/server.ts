/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type express from 'express';
import * as http from 'node:http';
import {
  parseConfig,
  type IParsedWebServerConfig,
  type IWebServerConfig,
} from './config/index.js';
import { createDeps, type Deps } from './deps/index.js';
import { buildApp } from './http/index.js';

/**
 * The package's public entry point.
 *
 * ## Usage
 *
 *   const server = new RedisSMQWebServer(config);
 *   await server.run();       // starts an HTTP listener
 *   // ... later
 *   await server.shutdown();
 *
 * For embedding in a larger Express host, pass `false` as the second
 * argument and use `getApplication()`:
 *
 *   const server = new RedisSMQWebServer(config, false);
 *   const inner = await server.getApplication();
 *   hostExpress.use('/ui', inner);
 *
 * ## Lifecycle
 *
 * Construction is cheap and side-effect free: config is parsed, nothing
 * else happens. The first `run()` or `getApplication()` triggers
 * `bootstrap()`, which:
 *
 *   1. Resolves the Web UI bundle and pre-renders the SPA HTML
 *      (`createDeps`).
 *   2. Starts the embedded REST API (embed mode only) and resolves its
 *      request handler (`createDeps`).
 *   3. Builds the Express application from the resolved dependencies
 *      (`buildApp` — synchronous).
 *   4. Creates the Node `http.Server` (does not listen yet).
 *
 * Bootstrap is idempotent; subsequent `run()` or `getApplication()`
 * calls reuse the cached `Deps`, Express app, and HTTP server.
 *
 * ## Shutdown ordering
 *
 * `shutdown()` closes the HTTP listener first, then stops the embedded
 * REST API (if any). This ordering matters: `http.Server.close()` waits
 * for in-flight requests to complete, which may include requests still
 * in the embedded REST API's handler. Stopping the REST API first would
 * cut those off mid-response.
 *
 * After shutdown the instance is inert. A second `run()` would rebuild
 * everything from scratch — the class is designed for a single
 * construct / run / shutdown cycle per instance.
 */
export class RedisSMQWebServer {
  private readonly config: IParsedWebServerConfig;
  private readonly runHttpServer: boolean;

  /**
   * Fields populated in `bootstrap()`. `null` before and after the
   * instance's active lifetime. The `deps` check is the idempotency
   * guard for `bootstrap`.
   */
  private deps: Deps | null = null;
  private app: express.Express | null = null;
  private httpServer: http.Server | null = null;

  constructor(config: IWebServerConfig = {}, runHttpServer = true) {
    // `parseConfig` throws `InvalidWebServerParamsError` synchronously
    // for an invalid port, base path, or proxy target. Nothing else
    // happens in the constructor — the first side effect (loading the
    // Web UI bundle) is deferred to bootstrap.
    this.config = parseConfig(config);
    this.runHttpServer = runHttpServer;
  }

  /**
   * Resolves dependencies, starts the embedded REST API if in embed
   * mode, builds the Express app, and creates (but does not start) the
   * HTTP server.
   *
   * Idempotent. The `this.deps` check is the idempotency guard —
   * a second call returns the cached `Deps` without re-running any of
   * the work.
   *
   * Errors propagate to the caller of `run()` or `getApplication()`:
   *
   *   - `WebUIBundleNotFoundError` — the `redis-smq-web-ui` bundle is
   *     missing or malformed.
   *   - `RedisSMQ` initialization errors from the embedded REST API's
   *     bootstrap — Redis is unreachable, config is invalid, etc.
   *   - Any error from `buildApp`'s middleware factories (unlikely, but
   *     possible if a middleware's guard fires).
   *
   * There is no logging here. The logger is created *by* `createDeps`,
   * so it isn't available if `createDeps` itself fails. The stack trace
   * of the thrown error is the diagnostic. Once `createDeps` succeeds,
   * `deps.logger` is available for `run()`'s informational logs.
   */
  private async bootstrap(): Promise<Deps> {
    if (this.deps) return this.deps;

    const deps = await createDeps(this.config);
    this.app = buildApp(deps, { basePath: this.config.webServer.basePath });
    this.httpServer = http.createServer(this.app);
    this.deps = deps;
    return deps;
  }

  /**
   * Boots the server and starts listening.
   *
   * When `runHttpServer` was `false` (embedding mode), this method
   * bootstraps the runtime and returns without opening a socket. That's
   * the intended path for callers who use `getApplication()`.
   *
   * When `runHttpServer` was `true` (default), the promise resolves
   * once the listener is bound and accepting connections.
   *
   * ## Why the log lines come after `listen` resolves
   *
   * `listen()` is asynchronous — the promise resolves once the OS has
   * bound the socket. Logging "listening on …" before the bind
   * completes would be a lie if the bind then failed with
   * `EADDRINUSE`. Logging after the promise resolves guarantees the
   * message is truthful.
   */
  async run(): Promise<void> {
    const deps = await this.bootstrap();
    if (!this.runHttpServer) return;

    const { port, basePath, apiProxyTarget } = this.config.webServer;

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, () => resolve());
    });

    deps.logger.info(`RedisSMQ Web Server listening on port ${port}`);
    deps.logger.info(`Base path: ${basePath}`);

    if (apiProxyTarget !== null) {
      deps.logger.info(`Proxying API requests to ${apiProxyTarget}`);
    } else {
      deps.logger.info('Embedded RedisSMQ REST API is mounted');
    }

    deps.logger.info(`Serving static assets from: ${deps.webUIStaticDir}`);
  }

  /**
   * Returns the underlying Express application for embedding in a
   * larger host.
   *
   * Boots the runtime on first call; subsequent calls reuse the cached
   * dependencies, Express app, and HTTP server. The returned app is
   * the fully composed one — every middleware `buildApp` installs is
   * present. The caller mounts it somewhere on their own app and owns
   * the listening socket.
   *
   * Symmetric with `RedisSMQRestApi.getApplication()`. A host that
   * embeds both should call each and mount them at different base
   * paths — typically the web server's base path for the SPA, and the
   * REST API's base path for the raw API.
   *
   * Note: in proxy mode, `getApplication()` returns an app whose API
   * routes forward to `apiProxyTarget`. In embed mode, they go to the
   * in-process REST API. The caller doesn't need to know which mode —
   * `getApplication()` returns the composed app either way.
   */
  async getApplication(): Promise<express.Express> {
    await this.bootstrap();
    return this.app!;
  }

  /**
   * Closes the HTTP listener (if any) and stops the embedded REST API.
   *
   * Order is load-bearing:
   *
   *   1. `httpServer.close()` stops accepting new connections and waits
   *      for in-flight requests to drain. Without this step, closing
   *      the REST API next would cut off in-flight requests mid-response.
   *
   *   2. `restApi.shutdown()` disposes the embedded REST API's runtime —
   *      Redis connections, background workers, and everything
   *      `RedisSMQ.initialize` started. In proxy mode, `restApi` is
   *      `null` and this step is a no-op — the web server doesn't own
   *      the upstream's lifecycle.
   *
   * After both steps, `this.deps`, `this.app`, and `this.httpServer`
   * are null. The instance can be constructed again to run a fresh
   * cycle, but not `run()`ed a second time (which would find stale
   * middlewares on the old app if `this.app` were reused).
   *
   * `shutdown()` is idempotent at the HTTP level (`close()` on a
   * non-listening server is a no-op). It doesn't track whether it was
   * called before — a second call finds `httpServer` as `null` and
   * does nothing.
   */
  async shutdown(): Promise<void> {
    if (this.httpServer?.listening) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }

    if (this.deps?.restApi) {
      await this.deps.restApi.shutdown();
    }

    this.deps = null;
    this.app = null;
    this.httpServer = null;
  }
}
