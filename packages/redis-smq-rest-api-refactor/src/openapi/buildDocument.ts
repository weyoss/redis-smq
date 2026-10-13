/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { OpenAPIV3_1 } from '@scalar/openapi-types';
import type { RouteDefinition } from '../http/index.js';

export interface BuildDocumentOptions {
  /** Value of `servers[0].url`. Typically the server's `apiServer.basePath`. */
  basePath: string;

  /** Value of `info.version`. Read from `package.json` by the caller. */
  version: string;

  /**
   * The `definitions` map produced by `ts-json-schema-generator`.
   * Converted to `components.schemas` with `#/definitions/` refs
   * rewritten to `#/components/schemas/`.
   */
  definitions: Record<string, JSONSchema7Definition>;

  /** Value of `info.title`. */
  title?: string;

  /** Value of `info.description`. */
  description?: string;
}

const DEFAULT_TITLE = 'RedisSMQ HTTP API';
const DEFAULT_DESCRIPTION = 'HTTP adapter for RedisSMQ';

/**
 * Human-readable descriptions for the HTTP statuses our routes declare.
 * Anything not in this map falls back to `'Response'`, which is valid
 * but less useful in Swagger UI.
 */
const STATUS_DESCRIPTIONS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  412: 'Precondition Failed',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

/**
 * Projects a route table into an OpenAPI 3.1 document.
 *
 * Pure function: given the same `routes` and options, it produces the
 * same document. No filesystem access, no Redis, no environment reads,
 * no module-level state. It can therefore run at build time (from
 * `scripts/gen-openapi.ts`) without booting the server, and it can be
 * unit-tested with hand-written route arrays.
 *
 * The contract is bidirectional:
 *
 *   - The Koa router consumes `RouteDefinition[]` to register handlers.
 *   - This function consumes the *same* `RouteDefinition[]` to describe
 *     those handlers.
 *
 * There is exactly one array. The spec cannot describe endpoints the
 * server does not serve, and the server cannot serve endpoints the
 * spec does not describe.
 *
 * @throws {Error} when two routes declare the same `operationId`.
 *   OpenAPI requires unique operation IDs; failing here — at build
 *   time, before any spec is written — is preferable to shipping an
 *   invalid document.
 */
export function buildDocument(
  routes: RouteDefinition[],
  opts: BuildDocumentOptions,
): OpenAPIV3_1.Document {
  const seenOperationIds = new Set<string>();
  const paths: Record<string, OpenAPIV3_1.PathItemObject> = {};

  for (const route of routes) {
    if (seenOperationIds.has(route.operationId)) {
      throw new Error(
        `Duplicate operationId '${route.operationId}' in route table. ` +
          `OpenAPI requires every operation to have a unique ID.`,
      );
    }
    seenOperationIds.add(route.operationId);

    const openApiPath = convertPath(route.path);
    const pathItem = paths[openApiPath] ?? {};
    pathItem[route.method] = buildOperation(route);
    paths[openApiPath] = pathItem;
  }

  return {
    openapi: '3.1.0',
    info: {
      title: opts.title ?? DEFAULT_TITLE,
      version: opts.version,
      description: opts.description ?? DEFAULT_DESCRIPTION,
    },
    servers: [{ url: opts.basePath, description: 'API server' }],
    components: {
      schemas: convertDefinitions(opts.definitions),
    },
    paths,
  };
}

/**
 * `:param` (Express-style, used by `@koa/router`) →
 * `{param}`  (OpenAPI-style).
 */
function convertPath(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      segment.startsWith(':') ? `{${segment.slice(1)}}` : segment,
    )
    .join('/');
}

function buildOperation(route: RouteDefinition): OpenAPIV3_1.OperationObject {
  const operation: OpenAPIV3_1.OperationObject = {
    operationId: route.operationId,
    tags: route.tags,
    responses: buildResponses(route.response),
  };

  const parameters = buildParameters(route);
  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  if (route.request.body) {
    operation.requestBody = buildRequestBody(route.request.body);
  }

  return operation;
}

/**
 * Flattens path and query schemas into OpenAPI `parameters`.
 *
 * Both schemas are shaped `{ type: 'object', properties: { … }, required?: [ … ] }`.
 * Path parameters are always marked required — OpenAPI mandates this,
 * and the router already enforces it by the route matching.
 */
function buildParameters(
  route: RouteDefinition,
): OpenAPIV3_1.ParameterObject[] {
  const parameters: OpenAPIV3_1.ParameterObject[] = [];

  if (route.request.path) {
    parameters.push(...parametersFrom(route.request.path, 'path'));
  }
  if (route.request.query) {
    parameters.push(...parametersFrom(route.request.query, 'query'));
  }

  return parameters;
}

function parametersFrom(
  schema: JSONSchema7,
  location: 'path' | 'query',
): OpenAPIV3_1.ParameterObject[] {
  const properties = schema.properties;
  if (!properties) return [];

  const required = new Set(schema.required ?? []);
  const parameters: OpenAPIV3_1.ParameterObject[] = [];

  for (const [name, property] of Object.entries(properties)) {
    if (typeof property === 'boolean') continue;

    const { description, ...propertySchema } = property;
    parameters.push({
      name,
      in: location,
      required: location === 'path' ? true : required.has(name),
      schema: rewriteSchema(propertySchema as JSONSchema7),
      ...(description ? { description } : {}),
    });
  }

  return parameters;
}

function buildRequestBody(
  bodySchema: JSONSchema7,
): OpenAPIV3_1.RequestBodyObject {
  return {
    required: true,
    content: {
      'application/json': {
        schema: rewriteSchema(bodySchema),
      },
    },
  };
}

/**
 * Builds the `responses` map for one operation.
 *
 * `route.response` values are the *envelope-applied* schemas produced
 * by `getResponseSchemas` — `{ data: … }` for 2xx, `{ error: … }` for
 * 4xx/5xx. This function does not re-wrap; it only maps them into
 * OpenAPI's `{ description, content }` shape and rewrites refs.
 *
 * 204 has no body, so it emits `{ description }` without a `content`
 * block. Every other status emits a JSON content block.
 */
function buildResponses(
  response: Record<number, JSONSchema7>,
): OpenAPIV3_1.ResponsesObject {
  const responses: OpenAPIV3_1.ResponsesObject = {};

  for (const [statusStr, schema] of Object.entries(response)) {
    const status = Number(statusStr);
    const description = STATUS_DESCRIPTIONS[status] ?? 'Response';

    responses[statusStr] =
      status === 204
        ? { description }
        : {
            description,
            content: {
              'application/json': {
                schema: rewriteSchema(schema),
              },
            },
          };
  }

  return responses;
}

/**
 * Converts the `definitions` map into `components.schemas`, rewriting
 * each schema's internal refs so they point at `#/components/schemas/…`.
 */
function convertDefinitions(
  definitions: Record<string, JSONSchema7Definition>,
): Record<string, OpenAPIV3_1.SchemaObject> {
  const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {};

  for (const [name, schema] of Object.entries(definitions)) {
    if (typeof schema === 'boolean') continue;
    schemas[sanitize(name)] = rewriteSchema(schema);
  }

  return schemas;
}

/**
 * Recursively rewrites every `$ref: '#/definitions/X'` to
 * `$ref: '#/components/schemas/X'`.
 *
 * The only transformation between the runtime schema format produced
 * by `ts-json-schema-generator` and the format OpenAPI expects.
 *
 * Cast to `unknown` at entry so the walker can traverse arbitrary
 * JSON structures (schemas nest via `properties`, `items`, `anyOf`,
 * `oneOf`, `allOf`, `not`, `additionalProperties`, `$defs`, and any
 * future keyword `json-schema` or the OpenAPI spec adds). The return
 * value is cast back to the input type — the walker preserves shape.
 */
function rewriteRefs(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(rewriteRefs);
  }

  if (node !== null && typeof node === 'object') {
    const source = node as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (key === '$ref' && typeof value === 'string') {
        result[key] = rewriteRef(value);
      } else {
        result[key] = rewriteRefs(value);
      }
    }

    return result;
  }

  return node;
}

function rewriteRef(ref: string): string {
  const prefix = '#/definitions/';
  if (!ref.startsWith(prefix)) return ref;

  const name = ref.slice(prefix.length);
  return `#/components/schemas/${sanitize(name)}`;
}

function rewriteSchema(schema: JSONSchema7): OpenAPIV3_1.SchemaObject {
  return rewriteRefs(schema) as OpenAPIV3_1.SchemaObject;
}

/**
 * Component names must match `^[a-zA-Z0-9._-]+$` per OpenAPI 3.1.
 * `ts-json-schema-generator` can emit names with characters that
 * don't qualify (e.g. `Pick<Foo, "bar">` becomes `Pick_Foo,_bar_`),
 * so any character outside the allowed set is replaced with `_`.
 */
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
