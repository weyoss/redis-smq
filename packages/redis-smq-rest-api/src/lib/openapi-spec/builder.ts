/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { writeFile } from 'fs/promises';
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import { readFile } from 'node:fs/promises';
import { OpenAPIV3 } from 'openapi-types';
import { join, resolve } from 'path';
import { env } from 'redis-smq-common';
import { constants } from '../../config/constants.js';
import { EControllerRequestPayload } from '../controller/types/index.js';
import { TRouterResourceMap } from '../router/types/index.js';
import { SchemaGenerator } from '../validator/schema-generator.js';
import { getOpenApiRoutes } from './adaptor.js';
import { IOpenApiRouteParams } from './types/index.js';

/**
 * Gets the package version from package.json
 * @returns The version string from package.json
 */
async function getPackageVersion(): Promise<string> {
  // Navigate to the package.json file
  const currentDir = env.getCurrentDir();
  const packagePath = join(currentDir, '../../../../../package.json');

  // Read and parse the package.json file
  const fileContent = await readFile(packagePath, 'utf-8');
  const packageJson: { version: string } = JSON.parse(fileContent);
  return packageJson.version;
}

// Using dynamic import instead of 'import ... from ...' to fix CJS module error:
// TypeError: json_schema_to_openapi_schema_1.default.default is not a function
async function toOpenAPISchema<T extends object = JSONSchema4>(
  schema: T,
): Promise<OpenAPIV3.Document> {
  const { default: toOpenApiSchema } = await import(
    '@openapi-contrib/json-schema-to-openapi-schema'
  );
  return toOpenApiSchema(schema);
}

async function getRequestParameters(
  schema: JSONSchema7,
  payloadSource: EControllerRequestPayload,
) {
  if (schema.$ref) {
    const def = (schema.definitions || {})[schema.$ref];
    if (typeof def !== 'object')
      throw new Error(`Schema ${schema.$ref} not found.`);
    schema = def;
  }
  if (schema.definitions) delete schema.definitions;
  if (
    payloadSource === EControllerRequestPayload.PATH ||
    payloadSource === EControllerRequestPayload.QUERY
  ) {
    const parameters: OpenAPIV3.ParameterObject[] = [];
    for (const property in schema.properties) {
      const prop = schema.properties[property];
      if (typeof prop !== 'boolean') {
        const { description = '', ...propSchema } = prop;
        const param: OpenAPIV3.ParameterObject = {
          name: property,
          in:
            payloadSource === EControllerRequestPayload.PATH ? 'path' : 'query',
          required: schema.required?.includes(property) || false,
          schema: await toOpenAPISchema(propSchema),
          description,
        };
        parameters.push(param);
      }
    }
    return parameters;
  }
  return [];
}

async function getRequestBody(
  schema: JSONSchema7,
  payloadSource: EControllerRequestPayload,
  contentType = 'application/json',
) {
  if (
    payloadSource === EControllerRequestPayload.BODY &&
    schema.properties &&
    Object.keys(schema.properties).length
  ) {
    if (schema.definitions) delete schema.definitions;
    return {
      required: true,
      content: {
        [contentType]: { schema: await toOpenAPISchema(schema) },
      },
    };
  }
  return null;
}

async function getResponses(schemaMap: [number, JSONSchema7][]) {
  const responses: OpenAPIV3.ResponsesObject = {};
  for (const [status, schema] of schemaMap) {
    if (schema.definitions) delete schema.definitions;
    responses[status] = {
      description: '',
      content: {
        'application/json': {
          schema: await toOpenAPISchema(schema),
        },
      },
    };
  }
  return responses;
}

async function buildOpenApiDocument(
  routes: IOpenApiRouteParams[],
  basePath: string = '/',
) {
  const restAPIVersion = await getPackageVersion();
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: 'RedisSMQ HTTP API specification',
      version: restAPIVersion,
    },
    components: { schemas: {} },
    servers: [
      {
        url: basePath,
      },
    ],
    paths: {},
  };
  for (const route of routes) {
    const { path, method, description, tags } = route;
    const operation: OpenAPIV3.OperationObject = {
      responses: {},
      description,
      tags,
    };

    // parameters
    operation.parameters = [];
    for (const [payloadSource, schema] of route.requestParamsSchemas) {
      operation.parameters.push(
        ...(await getRequestParameters(schema, payloadSource)),
      );

      // requestBody
      const requestBody = await getRequestBody(schema, payloadSource);
      if (requestBody) operation.requestBody = requestBody;
    }

    if (!operation.parameters.length) delete operation.parameters;

    // responses
    operation.responses = await getResponses(route.response);

    //
    spec.paths[path] = {
      ...spec.paths[path],
      [method]: operation,
    };
  }
  return spec;
}

export async function generateOpenApiDocument(
  routingMap: TRouterResourceMap,
  basePath: string = '/',
) {
  const schema = SchemaGenerator();
  const openApiRoutes = await getOpenApiRoutes(routingMap, schema);
  return buildOpenApiDocument(openApiRoutes, basePath);
}

export async function saveOpenApiDocument(
  spec: OpenAPIV3.Document,
  dir: string,
) {
  const { openApiDocumentFilename } = constants;
  const openApiDocumentPath = resolve(dir, openApiDocumentFilename);
  await writeFile(openApiDocumentPath, JSON.stringify(spec));
  return openApiDocumentPath;
}
