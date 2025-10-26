/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import * as http from 'http';
import { getDistPath } from 'redis-smq-web-ui';
import {
  IRedisSMQWebServerConfig,
  IRedisSMQWebServerParsedConfig,
} from './config/types/index.js';
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { parseConfig } from './config/parse-config.js';
import type { IRedisSMQWebUIConfig } from 'redis-smq-web-ui';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger, ILogger } from 'redis-smq-common';
import rateLimit from 'express-rate-limit';

type TRequest = express.Request<unknown, unknown, unknown>;
type TResponse = express.Response<unknown>;
type TNextFn = express.NextFunction;

export class RedisSMQWebServer {
  private readonly app = express();
  private readonly config: IRedisSMQWebServerParsedConfig;
  private readonly webUIPath: string;
  private readonly webUIConfig: IRedisSMQWebUIConfig;
  private readonly apiProxyTarget: string | null = null;
  private restApi: RedisSMQRestApi | null = null;
  private bootstrapped = false;
  private httpServer: http.Server | null = null;
  protected logger: ILogger;

  constructor(config: IRedisSMQWebServerConfig = {}) {
    // Default configuration
    this.config = parseConfig(config);
    this.webUIConfig = {
      BASE_PATH: this.config.webServer.basePath,
      API_URL: this.config.webServer.basePath,
    };
    this.apiProxyTarget = this.config.webServer.apiProxyTarget ?? null;
    this.webUIPath = getDistPath();
    this.logger = createLogger(this.config.logger, 'RedisSMQWebServer');
  }

  private async setupMiddleware(): Promise<void> {
    // prevent denial-of-service attacks
    this.app.use(
      rateLimit({
        windowMs: 60 * 1000, // 1 minutes
        limit: 1000, // max 1000 requests per windowMs
      }),
    );

    // Static file serving with caching headers. This handles UI assets from /assets/* etc.
    // It is placed before any API/SPA routing to ensure assets are served directly.
    this.app.use(
      // type-coverage:ignore-next-line
      express.static(this.webUIPath, {
        etag: true,
        lastModified: true,
        index: false, // We manually handle index.html serving for the SPA
        setHeaders: (res: express.Response<unknown>, filePath) => {
          if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
  }

  private async setupApi(): Promise<void> {
    const basePath = this.config.webServer.basePath;
    const apiPath = path.posix.join(basePath, 'api');
    const docsPath = path.posix.join(basePath, 'docs');

    const apiBasePaths = [apiPath, docsPath];
    const isApiRequest = (path: string) =>
      apiBasePaths.some((base) => path === base || path.startsWith(`${base}/`));

    const target = this.config.webServer.apiProxyTarget;

    if (target) {
      // Proxy Mode: Conditionally forward requests to the target without stripping prefixes.
      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
      });
      this.app.use(
        (req: TRequest, res: TResponse, next: express.NextFunction) => {
          if (isApiRequest(req.path)) {
            return proxy(req, res, next);
          }
          next();
        },
      );
      return;
    }

    // Embedded Mode: Conditionally delegate requests to the embedded REST API.
    this.restApi = new RedisSMQRestApi(this.config, false);
    const restApiCallback = await this.restApi.getApplication();
    this.app.use((req: TRequest, res: TResponse, next: TNextFn) => {
      if (isApiRequest(req.path)) {
        // The callback handles the request entirely and does not use next().
        return restApiCallback(req, res);
      }
      next();
    });
  }

  private sendIndexHtml(res: express.Response<unknown>) {
    const indexPath = path.join(this.webUIPath, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        this.logger.error('Error reading index.html:', err);
        return res.status(500).send('Error loading application');
      }
      const configScript = `<script>window.configs = ${JSON.stringify(
        this.webUIConfig,
      )};</script>`;
      const modifiedHtml = data.replace('</head>', `${configScript}</head>`);
      res.send(modifiedHtml);
    });
  }

  private async setupRoutes(): Promise<void> {
    // The API middleware is registered first. It will selectively handle API requests
    // or pass them through to the SPA routes.
    await this.setupApi();

    // Build basePath-aware routes for the SPA.
    const basePath = this.config.webServer.basePath || '/';

    // Optional: if basePath is not '/', redirect '/' to basePath.
    if (basePath !== '/') {
      this.app.get('/', (_req: TRequest, res: TResponse) =>
        res.redirect(basePath),
      );
    }

    // SPA catch-all route.
    // It serves index.html for any GET request that hasn't been handled by
    // the static middleware or the API middleware.
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizedBase = basePath.replace(/\/+$/, '') || '/';
    const anchor =
      normalizedBase === '/' ? '^/' : `^${escapeRegex(normalizedBase)}/?`;

    // This regex matches paths that are NOT api, docs, or assets, so they can be handled by the SPA.
    const nonApiOrAsset = new RegExp(`${anchor}(?!api/|docs/|assets/).*`);
    this.app.get(nonApiOrAsset, (_req: TRequest, res: TResponse) =>
      this.sendIndexHtml(res),
    );
  }

  private async bootstrap(): Promise<void> {
    if (!this.bootstrapped) {
      // Order is important:
      // 1. Static assets middleware to serve UI files directly.
      // 2. Main routing setup, which includes API handling and the SPA catch-all.
      await this.setupMiddleware();
      await this.setupRoutes();
      this.bootstrapped = true;
    }
  }

  public async run(): Promise<void> {
    await this.bootstrap();
    const port = this.config.webServer.port;
    this.httpServer = this.app.listen(port, () => {
      this.logger.info(`Redis SMQ Web Server running on port ${port}`);
      if (this.apiProxyTarget) {
        this.logger.info(`Proxying API requests to ${this.apiProxyTarget}`);
      } else {
        this.logger.info(`Embedded Redis SMQ REST API is mounted`);
      }
      this.logger.info(`Serving static assets from: ${this.webUIPath}`);
      this.logger.info(`Base path: ${this.config.webServer.basePath || '/'}`);
    });
  }

  public async shutdown(): Promise<void> {
    // Close HTTP server if running
    if (this.httpServer && this.httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer?.close((err?: Error) => {
          if (err) return reject(err);
          resolve();
        });
      });
      this.httpServer = null;
      this.logger.info('Redis SMQ Web Server has been shutdown.');
    }

    // Shutdown embedded REST API (ensures resources are disposed)
    if (this.restApi) {
      await this.restApi.shutdown();
      this.restApi = null;
    }
  }
}
