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
import { koaSwagger } from 'koa2-swagger-ui';
import { join } from 'path';
import { Configuration } from 'redis-smq';
import tmp from 'tmp';
import { Container } from './src/app/container/Container.js';
import { resourceMap } from './src/app/router/resource-map.js';
import { constants } from './src/config/constants.js';
import { parseConfig } from './src/config/parseConfig.js';
import { IRedisSMQHttpApiConfig } from './src/config/types/index.js';
import {
  IApplicationMiddlewareContext,
  IApplicationMiddlewareState,
} from './src/lib/application/types/index.js';
import { errorHandlerMiddleware } from './src/lib/errors/middlewares/errorHandlerMiddleware.js';
import {
  generateOpenApiDocument,
  saveOpenApiDocument,
} from './src/lib/openapi-spec/builder.js';
import { registerResources } from './src/lib/router/index.js';

const tmpAsync = bluebird.promisifyAll(tmp);

export class RedisSmqRestApi {
  protected app;
  protected config;
  protected httpServer;
  protected logger;
  protected bootstrapped = false;

  constructor(config: IRedisSMQHttpApiConfig = {}) {
    this.app = new Koa<
      IApplicationMiddlewareState,
      IApplicationMiddlewareContext
    >();
    //
    this.config = parseConfig(config);
    Configuration.getSetConfig(this.config);

    //
    Container.registerServices();
    const container = Container.getInstance();
    container.register({ config: asValue(this.config) });

    //
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
      resourceMap,
      this.config.apiServer.basePath,
    );
    const { port, hostname, basePath } = this.config.apiServer;
    const tmpDir = await tmpAsync.dirAsync();
    await saveOpenApiDocument(spec, tmpDir);
    this.app.use(mount(join(basePath, '/assets'), koaStatic(tmpDir)));
    const baseURL = `http://${hostname}:${port}${
      basePath === '/' ? '' : basePath
    }`;
    const specsBasePath = join('/assets/', constants.openApiDocumentFilename);
    this.app.use(
      koaSwagger({
        swaggerOptions: { url: specsBasePath },
      }),
    );
    const specsURL = join(baseURL, specsBasePath);
    this.logger.info(`OpenAPI specs are available at ${specsURL}`);
    const docsURL = join(baseURL, '/docs');
    this.logger.info(`SWAGGER UI is accessible from ${docsURL}`);
  }

  protected async initRouting() {
    this.logger.info(`Registering routes...`);
    const appRouter = await registerResources(resourceMap);
    this.app.use(appRouter.routes());
    this.app.use(appRouter.allowedMethods());
    //console.log(appRouter.stack.map((i) => `${i.methods.join('/')} ${i.path}`));
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
    const { hostname, port } = this.config.apiServer;
    await new Promise<void>((resolve) =>
      this.httpServer.listen(port, hostname, () => resolve()),
    );
    this.logger.info(
      `RedisSMQ REST API server is running on http://${hostname}:${port}...`,
    );
  }

  async shutdown() {
    await new Promise((resolve) => this.httpServer.close(resolve));
    await Container.getInstance().dispose();
    this.logger.info(`RedisSMQ HTTP API has been shutdown.`);
  }
}
