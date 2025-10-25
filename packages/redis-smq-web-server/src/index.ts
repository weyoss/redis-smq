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
      API_URL: '/',
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
        limit: 250, // max 250 requests per windowMs
      }),
    );

    // Static file serving with caching headers
    this.app.use(
      // type-coverage:ignore-next-line
      express.static(this.webUIPath, {
        etag: true,
        lastModified: true,
        index: false,
        setHeaders: (res: express.Response<unknown>, filePath) => {
          // Set caching headers based on file type
          if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            // Cache assets for 1 day
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else {
            // No caching for HTML files
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
  }

  private async setupApi(): Promise<void> {
    const target = this.config.webServer.apiProxyTarget;
    if (target) {
      const proxyOptions = {
        target,
        changeOrigin: true,
        ws: true,
        logLevel: 'warn' as const,
      };
      // Proxy REST API endpoints and docs/assets served by REST API
      this.app.use('/api', createProxyMiddleware(proxyOptions));
      this.app.use('/docs', createProxyMiddleware(proxyOptions));
      this.app.use('/assets', createProxyMiddleware(proxyOptions));
      return;
    }

    // No proxy target is provided, mount the embedded REST API server as middleware (covers /api, /docs, /assets)
    // The `false` argument prevents the REST API server from starting its own listener
    this.restApi = new RedisSMQRestApi(this.config, false);
    const restApiCallback = await this.restApi.getApplication();
    this.app.use(restApiCallback);
  }

  private async setupRoutes(): Promise<void> {
    await this.setupApi();

    // All non-API/Docs/Assets GET requests are handled by the web UI
    this.app.get(
      /^\/(?!api|docs|assets).*/,
      (
        _: express.Request<Record<string, unknown>, unknown, unknown>,
        res: express.Response<unknown>,
      ) => {
        // Read the index.html file
        const indexPath = path.join(this.webUIPath, 'index.html');
        fs.readFile(indexPath, 'utf8', (err, data) => {
          if (err) {
            this.logger.error('Error reading index.html:', err);
            return res.status(500).send('Error loading application');
          }

          // Inject the configuration into the HTML
          const configScript = `<script>window.configs = ${JSON.stringify(
            this.webUIConfig,
          )};</script>`;

          // Insert the config script before the closing </head> tag
          const modifiedHtml = data.replace(
            '</head>',
            `${configScript}</head>`,
          );

          // Send the modified HTML
          res.send(modifiedHtml);
        });
      },
    );
  }

  private async bootstrap(): Promise<void> {
    if (!this.bootstrapped) {
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
