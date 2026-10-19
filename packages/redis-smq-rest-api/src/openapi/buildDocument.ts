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
 * The fixed server URL declared in the generated document.
 *
 * `'/'` means: the operation paths in the spec (`/api/queues`,
 * `/api/config`, …) are absolute from the origin root. A client that
 * generates from the spec composes `{its-base-url}/api/…`, and where
 * the server is actually deployed — root or a sub-path — is the
 * client's base-URL concern.
 *
 * The `basePath` option controls where the server *mounts* its routes
 * and the Swagger UI — an internal routing concern. It is not part of
 * the API's contract, and baking it into `servers[0].url` would make
 * the spec describe one specific deployment rather than the API.
 *
 * Concretely, a server running with `apiServer.basePath: '/tenant/foo'`:
 *
 *   - Serves its spec at `/tenant/foo/swagger/assets/openapi-specs.json`
 *   - Serves endpoints at `/tenant/foo/api/…`
 *   - **Declares `servers[0].url: '/'` in the spec**
 *
 * A client that generates from the spec uses `{its-configured-base}/api/…`.
 * If the client is deployed behind the same proxy as the server, it
 * configures its base URL to the same external prefix — `/tenant/foo` —
 * and the composed URL works. If the client is on the same host, the
 * base is `/`. Either way, the composition is correct because the API
 * paths are stable and the deployment prefix is client-configured.
 *
 * A spec that declared `servers[0].url: '/tenant/foo'` would only be
 * correct for clients deployed at exactly that prefix on exactly that
 * host. It would silently break for clients reaching the API through a
 * different proxy path, a CDN, or the server's own localhost.
 *
 * The rule: the spec describes the API. Deployment paths are the
 * client's problem, handled by the client's base-URL configuration.
 */
const SERVER_URL = '/';

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
 * `scripts/gen-openapi.js`) without booting the server, and it can be
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
 *
 * @throws {Error} when a `$ref` in the produced document points at a
 *   component that was not emitted. The `assertNoDanglingRefs` guard
 *   at the end of this function catches the class of bugs that came
 *   from `sanitize` producing different names for the definition key
 *   and the `$ref` value, or from excluding a definition that some
 *   path still referenced.
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

  const document: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: opts.title ?? DEFAULT_TITLE,
      version: opts.version,
      description: opts.description ?? DEFAULT_DESCRIPTION,
    },
    servers: [{ url: SERVER_URL, description: 'API server' }],
    components: {
      schemas: convertDefinitions(opts.definitions),
    },
    paths,
  };

  // Guard against the class of bugs that produce a spec with dangling
  // `$ref`s. See `assertNoDanglingRefs` for the specific cases.
  assertNoDanglingRefs(document);

  return document;
}

/**
 * `:param` (Express-style, used by `@koa/router`) → `{param}` (OpenAPI-style).
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
 * Determines whether a definition is a controller DTO that should be
 * kept out of `components.schemas`.
 *
 * Response DTOs are `anyOf` unions of `[status, payload]` tuples. They
 * are a build-time intermediate: `getResponseSchemas` splits them into
 * per-status schemas with the envelope applied, and those split
 * schemas are embedded inline on each path's `responses` object. No
 * path `$ref`s a response DTO.
 *
 * Request DTOs (body, query, path) are similarly inlined: the request
 * body's schema is embedded directly on the operation, and path/query
 * DTOs are broken down into individual `parameters`. No path `$ref`s
 * a request DTO either.
 *
 * Emitting these in `components.schemas` produces dead weight and, for
 * the tuple-union response DTOs, an unusable shape (`unknown[]` in
 * generators that don't handle tuple unions). Client generation from
 * the OpenAPI document is cleaner without them: request types come
 * from the inline `requestBody`, response types from the inline
 * per-status schema — the shapes that paths actually reference.
 *
 * The naming convention is the contract: every DTO is
 * `*Controller{Request,Response}*DTO`, and no other schema in the
 * document follows that pattern. `redis-smq` types
 * (`IQueueParams`, `IExchangeParsedParams`, …) don't, so they stay in
 * `components.schemas` where paths do reference them.
 *
 * If a future change to `buildOperation` starts `$ref`-ing a controller
 * DTO instead of inlining it, `assertNoDanglingRefs` fails the build
 * rather than shipping a spec with a broken reference.
 */
function isControllerDTO(name: string): boolean {
  return /Controller(Request|Response).*DTO$/.test(name);
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
    if (isControllerDTO(name)) continue;
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
 * The walker traverses arbitrary JSON structures. Schemas nest via
 * `properties`, `items`, `anyOf`, `oneOf`, `allOf`, `not`,
 * `additionalProperties`, `$defs`, and any future keyword
 * `json-schema` or the OpenAPI spec adds. The `unknown` cast at entry
 * lets the walker handle all of them without a keyword-by-keyword
 * type.
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
 * Converts a schema name into a valid OpenAPI component identifier.
 *
 * `ts-json-schema-generator` stores generic type names in two forms
 * within the same file:
 *
 *   - **Definition keys** use the raw name: `IBrowserPage<Foo>`.
 *   - **`$ref` values** URL-encode the name per the JSON Pointer spec:
 *     `#/definitions/IBrowserPage%3CFoo%3E`.
 *
 * Both must map to the same component name. Without decoding, the raw
 * form becomes `IBrowserPage_Foo_` (via the sanitize regex replacing
 * `<`/`>`) and the encoded form becomes `IBrowserPage_3CFoo_3E` (via
 * the regex replacing `%`). Those are different keys, and the OpenAPI
 * document ends up with a reference to a component that was stored
 * under a different name — `Ref not found` in any validator.
 *
 * Decoding first normalizes both forms to `IBrowserPage<Foo>` before
 * the regex runs, so both produce `IBrowserPage_Foo_`.
 *
 * `decodeURIComponent` throws on a malformed percent-encoding — a
 * stray `%` followed by non-hex characters, or a `%` at end-of-string.
 * A schema name is generated code, not user input, so this should
 * never happen; but if `ts-json-schema-generator` ever changes its
 * encoding strategy in a way that produces a bare `%`, the correct
 * behavior is to fall back to the un-decoded form (which the sanitize
 * regex will still make safe) rather than crash the whole document
 * build.
 */
function sanitize(name: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    decoded = name;
  }
  return decoded.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Walks the document, collects every `$ref` into `components.schemas`,
 * and throws if any points at a component that wasn't emitted.
 */
function assertNoDanglingRefs(doc: OpenAPIV3_1.Document): void {
  const seen = new Set<string>();

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!node || typeof node !== 'object') return;

    const obj = node as Record<string, unknown>;
    const ref = obj.$ref;
    if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
      seen.add(ref.slice('#/components/schemas/'.length));
    }
    for (const value of Object.values(obj)) {
      walk(value);
    }
  };

  walk(doc);

  const missing: string[] = [];
  for (const ref of seen) {
    if (!doc.components?.schemas?.[ref]) {
      missing.push(ref);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `OpenAPI document has ${missing.length} dangling $ref(s):\n` +
        missing.map((m) => `  - #/components/schemas/${m}`).join('\n') +
        `\n\nThis usually means a schema was excluded from ` +
        `components.schemas (see isControllerDTO) that some path ` +
        `still references, or that sanitize() produced different ` +
        `names for a definition key and its $ref value.`,
    );
  }
}
