/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { writeFile } from 'fs/promises';
import { JSONSchema7 } from 'json-schema';
import { readFile } from 'node:fs/promises';
import type { OpenAPIV3_1 } from '@scalar/openapi-types';
import { join, resolve } from 'path';
import { env } from 'redis-smq-common';
import { constants } from '../../config/constants.js';
import { ERequestPayload } from '../controller/types/index.js';
import { TRouterResourceMap } from '../router/types/index.js';
import { SchemaGenerator } from '../validator/schema-generator.js';
import { getOpenApiRoutes } from './adaptor.js';
import { IOpenApiRouteParams } from './types/index.js';

/**
 * Gets the package version from package.json
 * @returns The version string from package.json
 */
async function getPackageVersion(): Promise<string> {
  const currentDir = env.getCurrentDir();
  const packagePath = join(currentDir, '../../../../../package.json');
  const fileContent = await readFile(packagePath, 'utf-8');
  const packageJson: { version: string } = JSON.parse(fileContent);
  return packageJson.version;
}

/**
 * Extracts all schema definitions and stores them in a map for later reference
 */
function extractDefinitions(schema: JSONSchema7): Map<string, JSONSchema7> {
  const definitions = new Map<string, JSONSchema7>();

  if (schema.definitions) {
    Object.entries(schema.definitions).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        definitions.set(key, value as JSONSchema7);
      }
    });
  }

  return definitions;
}

/**
 * Sanitizes a schema name to be used as a valid OpenAPI component name
 */
function sanitizeComponentName(name: string): string {
  const decoded = decodeURIComponent(name);
  return decoded.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Recursively converts all $ref values from #/definitions/ to #/components/schemas/
 */
function convertRefs(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertRefs(item));
  }

  const result: Record<string, unknown> = {};
  const objectMap = obj as Record<string, unknown>;

  for (const [key, value] of Object.entries(objectMap)) {
    if (key === '$ref' && typeof value === 'string') {
      const decodedValue = decodeURIComponent(value);
      if (decodedValue.startsWith('#/definitions/')) {
        const defName = decodedValue.replace('#/definitions/', '');
        const sanitizedName = sanitizeComponentName(defName);
        result[key] = `#/components/schemas/${sanitizedName}`;
      } else {
        result[key] = decodedValue;
      }
    } else if (value && typeof value === 'object') {
      result[key] = convertRefs(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Converts a JSONSchema7 to an OpenAPI schema object
 */
function convertSchemaWithRefs(
  schema: JSONSchema7 | undefined,
): OpenAPIV3_1.SchemaObject | undefined {
  if (!schema || typeof schema !== 'object') {
    return undefined;
  }

  const deepCopy = JSON.parse(JSON.stringify(schema));
  return convertRefs(deepCopy) as OpenAPIV3_1.SchemaObject;
}

/**
 * Safely converts a schema to OpenAPI format, filtering out undefined
 */
function safeConvertSchema(
  schema: JSONSchema7 | undefined,
): OpenAPIV3_1.SchemaObject | null {
  if (!schema) return null;
  const converted = convertSchemaWithRefs(schema);
  return converted || null;
}

/**
 * Converts all definitions to OpenAPI components
 */
function convertDefinitionsToComponents(
  definitions: Map<string, JSONSchema7>,
): Record<string, OpenAPIV3_1.SchemaObject> {
  const components: Record<string, OpenAPIV3_1.SchemaObject> = {};

  definitions.forEach((defSchema, name) => {
    const sanitizedName = sanitizeComponentName(name);
    const converted = safeConvertSchema(defSchema);
    if (converted) {
      components[sanitizedName] = converted;
    }
  });

  return components;
}

async function getRequestParameters(
  schema: JSONSchema7,
  payloadSource: ERequestPayload,
): Promise<OpenAPIV3_1.ParameterObject[]> {
  const parameters: OpenAPIV3_1.ParameterObject[] = [];

  if (schema.properties) {
    for (const property in schema.properties) {
      const prop = schema.properties[property];
      if (typeof prop !== 'boolean') {
        const { description = '', ...propSchema } = prop;
        const convertedSchema = safeConvertSchema(propSchema as JSONSchema7);

        if (convertedSchema) {
          const param: OpenAPIV3_1.ParameterObject = {
            name: property,
            in: payloadSource === ERequestPayload.PATH ? 'path' : 'query',
            required: schema.required?.includes(property) || false,
            schema: convertedSchema,
            description,
          };
          parameters.push(param);
        }
      }
    }
  }

  return parameters;
}

async function getRequestBody(
  schema: JSONSchema7,
  payloadSource: ERequestPayload,
  contentType = 'application/json',
): Promise<OpenAPIV3_1.RequestBodyObject | null> {
  if (payloadSource === ERequestPayload.BODY) {
    if (schema.properties && Object.keys(schema.properties).length) {
      const convertedSchema = safeConvertSchema(schema);
      if (convertedSchema) {
        return {
          required: true,
          content: {
            [contentType]: {
              schema: convertedSchema,
            },
          },
        };
      }
    }
  }
  return null;
}

/**
 * Groups responses by status code
 */
function groupResponsesByStatus(
  responseMap: [number, JSONSchema7][],
): Map<number, JSONSchema7[]> {
  const grouped = new Map<number, JSONSchema7[]>();

  responseMap.forEach(([status, schema]) => {
    if (!grouped.has(status)) {
      grouped.set(status, []);
    }
    grouped.get(status)!.push(schema);
  });

  return grouped;
}

/**
 * Creates a response object for a status code with multiple possible schemas
 */
function createResponseForStatus(
  status: number,
  schemas: JSONSchema7[],
): OpenAPIV3_1.ResponseObject | null {
  if (schemas.length === 0) return null;

  const description = getStatusDescription(status);

  // Convert all schemas
  const convertedSchemas = schemas
    .map((schema) => safeConvertSchema(schema))
    .filter((s): s is OpenAPIV3_1.SchemaObject => s !== null);

  if (convertedSchemas.length === 0) return null;

  if (convertedSchemas.length === 1) {
    // Single schema for this status
    return {
      description,
      content: {
        'application/json': {
          schema: convertedSchemas[0],
        },
      },
    };
  } else {
    // Multiple schemas - use oneOf
    return {
      description,
      content: {
        'application/json': {
          schema: {
            oneOf: convertedSchemas,
          },
        },
      },
    };
  }
}

async function getResponses(
  responseMap: [number, JSONSchema7][],
): Promise<OpenAPIV3_1.ResponsesObject> {
  const responses: OpenAPIV3_1.ResponsesObject = {};

  if (responseMap.length === 0) {
    return responses;
  }

  // Group by status code
  const groupedByStatus = groupResponsesByStatus(responseMap);

  // Create response for each status code
  groupedByStatus.forEach((schemas, status) => {
    const response = createResponseForStatus(status, schemas);
    if (response) {
      responses[status.toString()] = response;
    }
  });

  return responses;
}

function getStatusDescription(status: number): string {
  const descriptions: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
  };
  return descriptions[status] || 'Unknown Status';
}

function generateOperationId(path: string, method: string): string {
  const parts = path.split('/').filter((p) => p && !p.startsWith(':'));
  const methodPrefix = method.toLowerCase();
  const camelCase = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  return `${methodPrefix}${camelCase}`;
}

async function buildOpenApiDocument(
  routes: IOpenApiRouteParams[],
  basePath: string = '/',
  allDefinitions: Map<string, JSONSchema7>,
): Promise<OpenAPIV3_1.Document> {
  const restAPIVersion = await getPackageVersion();

  // Convert main definitions
  const mainSchemas = convertDefinitionsToComponents(allDefinitions);

  const spec: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'RedisSMQ HTTP API specification',
      version: restAPIVersion,
      description:
        'HTTP API for RedisSMQ - A high-performance Redis message queue',
    },
    components: {
      schemas: mainSchemas,
    },
    servers: [
      {
        url: basePath,
        description: 'RedisSMQ API server',
      },
    ],
    paths: {},
  };

  for (const route of routes) {
    const { path, method, description, tags, response } = route;

    spec.paths = spec.paths || {};
    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    const operation: OpenAPIV3_1.OperationObject = {
      responses: {},
      description,
      tags,
      operationId: generateOperationId(path, method),
    };

    // parameters
    const parameters: OpenAPIV3_1.ParameterObject[] = [];
    for (const [payloadSource, schema] of route.requestParamsSchemas) {
      if (
        Object.keys(schema).length === 0 ||
        (schema.type === 'object' &&
          schema.additionalProperties === false &&
          !schema.properties)
      ) {
        continue;
      }

      if (
        payloadSource === ERequestPayload.PATH ||
        payloadSource === ERequestPayload.QUERY
      ) {
        parameters.push(...(await getRequestParameters(schema, payloadSource)));
      }

      if (payloadSource === ERequestPayload.BODY) {
        const requestBody = await getRequestBody(schema, payloadSource);
        if (requestBody) operation.requestBody = requestBody;
      }
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Generate responses directly from the response map
    operation.responses = await getResponses(response);

    const pathItem = spec.paths[path];
    if (pathItem) {
      pathItem[method] = operation;
    }
  }

  return spec;
}

export async function generateOpenApiDocument(
  routingMap: TRouterResourceMap,
  basePath: string = '/',
): Promise<OpenAPIV3_1.Document> {
  const schemaGenerator = SchemaGenerator();
  const definitions = schemaGenerator.getDefinitions();
  const openApiRoutes = await getOpenApiRoutes(routingMap, schemaGenerator);
  const allDefinitions = extractDefinitions({ definitions } as JSONSchema7);

  return buildOpenApiDocument(openApiRoutes, basePath, allDefinitions);
}

export async function saveOpenApiDocument(
  spec: OpenAPIV3_1.Document,
  dir: string,
): Promise<string> {
  const { openapiSchemaFilename } = constants;
  const openApiDocumentPath = resolve(dir, openapiSchemaFilename);
  await writeFile(openApiDocumentPath, JSON.stringify(spec, null, 2));
  return openApiDocumentPath;
}
