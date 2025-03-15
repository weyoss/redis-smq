/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { JSONSchema7 } from 'json-schema';
import {
  EControllerRequestMethod,
  EControllerRequestPayload,
  TControllerRequestHandlerGeneric,
} from '../controller/types/index.js';
import { parseRoutingMap } from '../router/parser.js';
import { TRouterResourceMap } from '../router/types/index.js';
import { SchemaGenerator } from '../validator/schema-generator.js';
import { IOpenApiRouteParams } from './types/index.js';

type TSchema = ReturnType<typeof SchemaGenerator>;

let openApiRoutes: IOpenApiRouteParams[] | null = null;

async function handleResource(
  controllerName: string,
  method: EControllerRequestMethod,
  payload: EControllerRequestPayload[],
  routePath: string,
  schema: TSchema,
  description?: string,
  tags?: string[],
) {
  // Request
  const requestParametersSchema = schema.getRequestSchemas(
    controllerName,
    payload,
  );

  // Response
  const responseSchema: [number, JSONSchema7][] = [
    ...schema.getResponseSchemas(controllerName).values(),
  ].map((i) => [i.responseCode, i.schema]);

  //
  return {
    path: routePath
      .split('/')
      .map((i) => (i.startsWith(':') ? `{${i.slice(1)}}` : i))
      .join('/'),
    method,
    requestParamsSchemas: requestParametersSchema,
    response: responseSchema,
    description,
    tags,
  };
}

export async function getOpenApiRoutes(
  routingMap: TRouterResourceMap,
  schema: TSchema,
) {
  if (!openApiRoutes) {
    openApiRoutes = [];
    await parseRoutingMap(
      routingMap,
      async (
        controller: TControllerRequestHandlerGeneric,
        controllerName: string,
        method: EControllerRequestMethod,
        payload: EControllerRequestPayload[],
        path: string,
        description?: string,
        tags?: string[],
      ) => {
        const i = await handleResource(
          controllerName,
          method,
          payload,
          path,
          schema,
          description,
          tags,
        );
        openApiRoutes?.push(i);
      },
    );
  }
  return openApiRoutes;
}
