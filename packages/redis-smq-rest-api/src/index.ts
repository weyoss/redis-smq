import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import { asValue } from 'awilix';
import bluebird from 'bluebird';
import * as http from 'http';
import Koa from 'koa';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import { join } from 'path';
import { Configuration } from 'redis-smq';
import tmp from 'tmp';
import { getAbsoluteFSPath as swaggerUiDistPath } from 'swagger-ui-dist';
import { Container } from './container/Container.js';
import { routing } from './router/routing.js';
import { constants } from './config/constants.js';
import { parseConfig } from './config/parseConfig.js';
import {
  IRedisSMQRestApiConfig,
  IRedisSMQRestApiParsedConfig,
} from './config/types/index.js';
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
import { buildSwaggerUiHtml } from './helpers/swagger-ui.js';

// Promisify tmp
const tmpAsync = bluebird.promisifyAll(tmp);

export class RedisSMQRestApi {
  protected app: Koa<
    IApplicationMiddlewareState,
    IApplicationMiddlewareContext
  >;
  protected config: IRedisSMQRestApiParsedConfig;
  protected httpServer: http.Server;
  protected logger;
  protected bootstrapped = false;
  protected runHttpServer: boolean;

  constructor(config: IRedisSMQRestApiConfig = {}, runHttpServer = true) {
    this.app = new Koa<
      IApplicationMiddlewareState,
      IApplicationMiddlewareContext
    >();
    this.runHttpServer = runHttpServer;
    this.config = parseConfig(config);
    Configuration.getSetConfig(this.config);

    Container.registerServices();
    const container = Container.getInstance();
    container.register({ config: asValue(this.config) });

    this.logger = container.resolve('logger');
    this.httpServer = http.createServer(this.app.callback());
  }

  protected async initApplicationMiddlewares() {
    this.app.use<IApplicationMiddlewareState, IApplicationMiddlewareContext>(
      (ctx, next) => {
        ctx.scope = Container.getInstance().createScope();
        return next();
      },
    );
    this.app.use(errorHandlerMiddleware);
    this.app.use(bodyParser());
    this.app.use(
      cors({
        origin: '*',
      }),
    );
  }

  protected async initOpenApi() {
    this.logger.info(`Initializing OpenAPI...`);
    const spec = await generateOpenApiDocument(
      routing,
      this.config.apiServer.basePath,
    );

    // Save OpenAPI document to a temp dir and mount it under <basePath>/assets
    const tmpDir = await tmpAsync.dirAsync();
    await saveOpenApiDocument(spec, tmpDir);

    const { basePath } = this.config.apiServer;
    this.app.use(mount(join(basePath, '/assets'), koaStatic(tmpDir)));

    // Serve Swagger UI assets locally from swagger-ui-dist
    const uiAssetsFsPath = swaggerUiDistPath();
    this.app.use(
      mount(join(basePath, '/docs/assets'), koaStatic(uiAssetsFsPath)),
    );

    // Serve a local HTML page that references the local UI assets and the generated spec
    const specsBasePath = `/assets/${constants.openApiDocumentFilename}`;
    const assetsPublicBase = join(basePath, '/docs/assets');
    const html = buildSwaggerUiHtml(
      join(basePath, specsBasePath),
      assetsPublicBase,
    );

    this.app.use(
      mount(
        join(basePath, '/docs'),
        async (ctx: { type: string; body: string }) => {
          ctx.type = 'text/html; charset=utf-8';
          ctx.body = html;
        },
      ),
    );
  }

  protected logOpenApiUrls() {
    const { port, basePath } = this.config.apiServer;
    const hostname = 'localhost'; // For logging convenience
    const baseURL = `http://${hostname}:${port}${
      basePath === '/' ? '' : basePath
    }`;
    const specsURL = `${baseURL}/assets/${constants.openApiDocumentFilename}`;
    this.logger.info(`OpenAPI specs are available at ${specsURL}`);
    const docsURL = `${baseURL}/docs`;
    this.logger.info(`SWAGGER UI is accessible from ${docsURL}`);
  }

  protected async initRouting() {
    this.logger.info(`Registering routes...`);
    const appRouter = await registerResources(routing);
    this.app.use(appRouter.routes());
    this.app.use(appRouter.allowedMethods());
  }

  protected async bootstrap() {
    if (!this.bootstrapped) {
      await this.initApplicationMiddlewares();
      await this.initRouting();
      await this.initOpenApi();
      this.bootstrapped = true;
    }
  }

  async run() {
    await this.bootstrap();
    if (this.runHttpServer) {
      const { port } = this.config.apiServer;
      await new Promise<void>((resolve) =>
        this.httpServer.listen(port, () => resolve()),
      );
      this.logger.info(
        `RedisSMQ REST API server is running on http://localhost:${port}...`,
      );
      this.logOpenApiUrls();
    }
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
    this.logger.info(`RedisSMQ HTTP API has been shutdown.`);
  }
}
