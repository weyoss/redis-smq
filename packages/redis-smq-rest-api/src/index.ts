/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import { asValue } from 'awilix';
import bluebird from 'bluebird';
import * as http from 'http';
import Koa from 'koa';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import { join } from 'path';
import { RedisSMQ } from 'redis-smq';
import { createLogger, ILogger } from 'redis-smq-common';
import { getAbsoluteFSPath as swaggerUiDistPath } from 'swagger-ui-dist';
import tmp from 'tmp';
import { constants } from './config/constants.js';
import {
  IRedisSMQRestApiConfig,
  IRedisSMQRestApiParsedConfig,
  parseConfig,
} from './config/index.js';
import { Container } from './container/Container.js';
import { buildSwaggerUiHtml } from './helpers/swagger-ui.js';
import {
  IApplicationMiddlewareContext,
  IApplicationMiddlewareState,
} from './lib/application/types/index.js';
import { errorHandlerMiddleware } from './lib/errors/middlewares/errorHandlerMiddleware.js';
import {
  generateOpenApiDocument,
  saveOpenApiDocument,
} from './lib/openapi-spec/builder.js';
import { registerResources } from './lib/router/index.js';
import { routing } from './router/routing.js';

// Promisify external async APIs
const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);
const tmpAsync = bluebird.promisifyAll(tmp);

export class RedisSMQRestApi {
  protected app: Koa<
    IApplicationMiddlewareState,
    IApplicationMiddlewareContext
  >;
  protected config: IRedisSMQRestApiParsedConfig;
  protected runHttpServer: boolean;
  protected logger: ILogger;
  protected httpServer: http.Server;
  protected bootstrapped = false;

  constructor(config: IRedisSMQRestApiConfig = {}, runHttpServer = true) {
    this.app = new Koa<
      IApplicationMiddlewareState,
      IApplicationMiddlewareContext
    >();
    this.runHttpServer = runHttpServer;
    this.config = parseConfig(config);

    Container.registerServices();
    const container = Container.getInstance();
    container.register({ config: asValue(this.config) });

    this.logger = createLogger(this.config.logger, 'RedisSMQRestApi');
    this.httpServer = http.createServer(this.app.callback());
  }

  protected async initApplicationMiddlewares() {
    // Per-request scope for DI
    this.app.use<IApplicationMiddlewareState, IApplicationMiddlewareContext>(
      (ctx, next) => {
        ctx.scope = Container.getInstance().createScope();
        return next();
      },
    );

    // Global middlewares
    this.app.use(errorHandlerMiddleware);
    this.app.use(bodyParser());
    this.app.use(
      cors({
        origin: '*',
      }),
    );
  }

  protected async initOpenApi() {
    const { basePath } = this.config.apiServer;
    const openApiFilename = constants.openApiDocumentFilename;

    this.logger.info('Initializing OpenAPI...');
    const spec = await generateOpenApiDocument(routing, basePath);

    // Create a temporary directory to store the OpenAPI spec file
    const tmpDir = await tmpAsync.dirAsync();
    await saveOpenApiDocument(spec, tmpDir);

    // Mount middleware in order from most specific to least specific path
    // to avoid route conflicts.

    // 1. Serve Swagger UI assets from /swagger/ui
    const uiAssetsFsPath = swaggerUiDistPath();
    this.app.use(
      mount(join(basePath, '/swagger/ui'), koaStatic(uiAssetsFsPath)),
    );

    // 2. Serve the OpenAPI spec from /swagger/assets/<filename>
    this.app.use(mount(join(basePath, '/swagger/assets'), koaStatic(tmpDir)));

    // Prepare URLs for the HTML template
    const specUrl = join(basePath, '/swagger/assets', openApiFilename);
    const uiAssetsUrl = join(basePath, '/swagger/ui');
    const html = buildSwaggerUiHtml(specUrl, uiAssetsUrl);

    // 3. Serve the Swagger UI HTML at /swagger
    this.app.use(
      mount(join(basePath, '/swagger'), (ctx: Koa.Context) => {
        // Only serve HTML for the root of the mount path (e.g., /swagger or /swagger/)
        if (ctx.path === '/' || ctx.path === '') {
          ctx.type = 'text/html; charset=utf-8';
          ctx.body = html;
        }
        // Requests for other sub-paths will fall through and result in a 404
      }),
    );
  }

  protected async initRouting() {
    this.logger.info('Registering routes...');
    const appRouter = await registerResources(routing);
    this.app.use(appRouter.routes());
    this.app.use(appRouter.allowedMethods());
  }

  protected async bootstrap() {
    if (this.bootstrapped) return;

    await RedisSMQAsync.initializeAsync(this.config.redis);
    await this.initApplicationMiddlewares();
    await this.initRouting();
    await this.initOpenApi();

    this.bootstrapped = true;
  }

  async run() {
    await this.bootstrap();
    if (!this.runHttpServer) return;

    const { port, basePath } = this.config.apiServer;
    await new Promise<void>((resolve) =>
      this.httpServer.listen(port, () => resolve()),
    );
    this.logger.info(
      `RedisSMQ REST API server is running on http://localhost:${port}...`,
    );
    const baseURL = `http://127.0.0.1:${port}${basePath === '/' ? '' : basePath}`;
    this.logger.info(
      `OpenAPI specs are available at ${baseURL}/swagger/assets/${constants.openApiDocumentFilename}`,
    );
    this.logger.info(`SWAGGER UI is accessible from ${baseURL}/swagger`);
  }

  async getApplication() {
    await this.bootstrap();
    return this.app.callback();
  }

  async shutdown() {
    if (this.httpServer.listening) {
      await new Promise((resolve) => this.httpServer.close(resolve));
    }
    await Container.getInstance().dispose();
    await RedisSMQAsync.shutdownAsync();
    this.logger.info('RedisSMQ HTTP API has been shutdown.');
  }
}
