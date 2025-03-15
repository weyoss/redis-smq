/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import KoaRouter from '@koa/router';
import { RedisSMQError } from 'redis-smq-common';
import { Container } from '../../app/container/Container.js';
import { getErrorResponseParams } from '../../app/errors/getErrorResponseParams.js';
import {
  IApplicationMiddlewareContext,
  IApplicationMiddlewareState,
} from '../application/types/index.js';
import {
  EControllerRequestMethod,
  EControllerRequestPayload,
  TControllerRequestHandlerGeneric,
} from '../controller/types/index.js';
import { SchemaGenerator } from '../validator/schema-generator.js';
import { ValidateRequestMiddleware } from './middlewares/ValidateRequestMiddleware.js';
import { ValidateResponseMiddleware } from './middlewares/ValidateResponseMiddleware.js';
import { parseRoutingMap } from './parser.js';
import { TRouter, TRouterResourceMap } from './types/index.js';

type TSchema = ReturnType<typeof SchemaGenerator>;

async function registerRoute(
  appRouter: TRouter,
  controller: TControllerRequestHandlerGeneric,
  controllerName: string,
  method: EControllerRequestMethod,
  payload: EControllerRequestPayload[],
  routePath: string,
  schema: TSchema,
) {
  // Request validation
  const requestSchema = schema.getRequestSchemas(controllerName, payload);
  const requestValidatorMap = schema.getRequestValidators(requestSchema);

  // Response validation
  const responseSchema = schema.getResponseSchemas(controllerName);
  const responseValidatorMap = schema.getResponseValidators(responseSchema);

  // Add koa route
  appRouter[method](
    routePath,
    ValidateRequestMiddleware(requestValidatorMap),
    async (ctx, next) => {
      try {
        const [status, payload] = await controller(ctx, next);
        const data = payload ?? null;
        ctx.status = status;
        ctx.body = data === null && status === 204 ? null : { data };
        ctx.state.responseSchemaKey = 'OK';
      } catch (e: unknown) {
        if (e instanceof RedisSMQError) {
          const reply = getErrorResponseParams(e);
          const [code, message] = reply;
          ctx.state.responseSchemaKey = message;
          ctx.status = code;
          ctx.body = {
            error: {
              code: code,
              message: message,
              details: {},
            },
          };
        } else throw e;
      }
      return next();
    },
    ValidateResponseMiddleware(responseValidatorMap),
  );
}

export async function registerResources(routingMap: TRouterResourceMap) {
  const { apiServer } = Container.getInstance().resolve('config');
  const { basePath } = apiServer;
  const appRouter = new KoaRouter<
    IApplicationMiddlewareState,
    IApplicationMiddlewareContext
  >({ prefix: basePath.length > 1 ? basePath : undefined });
  const schema = SchemaGenerator();
  await parseRoutingMap(
    routingMap,
    async (
      controller: TControllerRequestHandlerGeneric,
      controllerName: string,
      method: EControllerRequestMethod,
      payload: EControllerRequestPayload[],
      path: string,
    ) => {
      await registerRoute(
        appRouter,
        controller,
        controllerName,
        method,
        payload,
        path,
        schema,
      );
    },
  );
  return appRouter;
}
