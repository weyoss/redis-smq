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
import { Container } from '../../container/Container.js';
import { getErrorResponseParams } from '../../errors/getErrorResponseParams.js';
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

type TSchemaGenerator = ReturnType<typeof SchemaGenerator>;

// Cache for schema validators to avoid redundant compilation
const validatorCacheByController = new Map<
  string,
  {
    requestValidators: ReturnType<TSchemaGenerator['getRequestValidators']>;
    responseValidators: ReturnType<TSchemaGenerator['getResponseValidators']>;
  }
>();

/**
 * Gets or creates validators for a controller
 *
 * @param schemaGenerator - Schema generator instance
 * @param controllerName - Name of the controller
 * @param payloadSources - Payload sources for validation
 * @returns Object containing request and response validators
 */
function getOrCreateValidatorsForController(
  schemaGenerator: TSchemaGenerator,
  controllerName: string,
  payloadSources: EControllerRequestPayload[],
) {
  const cacheKey = `${controllerName}:${payloadSources.join(',')}`;
  let cachedValidators = validatorCacheByController.get(cacheKey);

  if (!cachedValidators) {
    // Request validation
    const requestSchemas = schemaGenerator.getRequestSchemas(
      controllerName,
      payloadSources,
    );
    const requestValidators =
      schemaGenerator.getRequestValidators(requestSchemas);

    // Response validation
    const responseSchemas = schemaGenerator.getResponseSchemas(controllerName);
    const responseValidators =
      schemaGenerator.getResponseValidators(responseSchemas);

    cachedValidators = {
      requestValidators,
      responseValidators,
    };
    validatorCacheByController.set(cacheKey, cachedValidators);
  }

  return cachedValidators;
}

/**
 * Registers a route with validation middleware
 */
async function registerRouteWithValidation(
  router: TRouter,
  controllerHandler: TControllerRequestHandlerGeneric,
  controllerName: string,
  httpMethod: EControllerRequestMethod,
  payloadSources: EControllerRequestPayload[],
  routePath: string,
  schemaGenerator: TSchemaGenerator,
) {
  const { requestValidators, responseValidators } =
    getOrCreateValidatorsForController(
      schemaGenerator,
      controllerName,
      payloadSources,
    );

  // Add koa route with optimized middleware chain
  router[httpMethod](
    routePath,
    ValidateRequestMiddleware(requestValidators),
    async (ctx, next) => {
      try {
        const [statusCode, responseData] = await controllerHandler(ctx, next);
        const responseBody = responseData ?? null;
        ctx.status = statusCode;
        ctx.body =
          responseBody === null && statusCode === 204
            ? null
            : { data: responseBody };
        ctx.state.responseSchemaKey = 'OK';
      } catch (error: unknown) {
        if (error instanceof RedisSMQError) {
          const [errorCode, errorMessage] = getErrorResponseParams(error);
          ctx.state.responseSchemaKey = errorMessage;
          ctx.status = errorCode;
          ctx.body = {
            error: {
              code: errorCode,
              message: errorMessage,
              details: {},
            },
          };
        } else throw error;
      }
      return next();
    },
    ValidateResponseMiddleware(responseValidators),
  );
}

/**
 * Registers all resources from the routing map
 *
 * @param routingMap - The routing resource map
 * @returns Configured Koa router
 */
export async function registerResources(
  routingMap: TRouterResourceMap,
): Promise<TRouter> {
  const { apiServer } = Container.getInstance().resolve('config');
  const { basePath } = apiServer;

  // Create router with optional prefix
  const apiRouter = new KoaRouter<
    IApplicationMiddlewareState,
    IApplicationMiddlewareContext
  >({
    prefix: basePath && basePath.length > 1 ? basePath : undefined,
  });

  // Create schema generator once
  const schemaGenerator = SchemaGenerator();

  // Parse routing map and register each route
  await parseRoutingMap(
    routingMap,
    async (
      controllerHandler: TControllerRequestHandlerGeneric,
      controllerName: string,
      httpMethod: EControllerRequestMethod,
      payloadSources: EControllerRequestPayload[],
      routePath: string,
    ) => {
      await registerRouteWithValidation(
        apiRouter,
        controllerHandler,
        controllerName,
        httpMethod,
        payloadSources,
        routePath,
        schemaGenerator,
      );
    },
  );

  return apiRouter;
}
