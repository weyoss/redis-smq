/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { ERedisConfigClient, net } from 'redis-smq-common';
import { RedisSMQRestApi } from '../../src/index.js';
import { routes } from '../../src/features/routes.js';
import { apiUrl, getRedisPort } from '../helpers/context.js';

/**
 * E2E tests for the OpenAPI document and Swagger UI serving.
 */

/**
 * Converts a `RouteDefinition` path (`:param` syntax) to the OpenAPI
 * path syntax (`{param}`).
 */
function routeToOpenApiPath(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      segment.startsWith(':') ? `{${segment.slice(1)}}` : segment,
    )
    .join('/');
}

interface OpenApiSpec {
  openapi: string;
  servers: Array<{ url: string }>;
  paths: Record<string, Record<string, { operationId?: string }>>;
}

async function fetchSpec(base: string = apiUrl()): Promise<OpenApiSpec> {
  const res = await fetch(`${base}/swagger/assets/openapi-specs.json`);
  if (res.status !== 200) {
    throw new Error(
      `Expected 200 from openapi-specs.json, got ${res.status}.\n` +
        `Did the build run? Is constants.assetsDir pointing at dist/assets/?`,
    );
  }
  return (await res.json()) as OpenApiSpec;
}

// ─────────────────────────────────────────────────────────────────────
// OpenAPI document
// ─────────────────────────────────────────────────────────────────────

describe('OpenAPI specification', () => {
  it('serves valid JSON with an OpenAPI version', async () => {
    const res = await fetch(`${apiUrl()}/swagger/assets/openapi-specs.json`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);

    const spec = (await res.json()) as { openapi?: unknown };
    expect(spec.openapi).toBeDefined();
  });

  it('declares OpenAPI 3.1.0', async () => {
    const spec = await fetchSpec();
    expect(spec.openapi).toBe('3.1.0');
  });

  it('lists every route from the route table', async () => {
    const spec = await fetchSpec();

    for (const route of routes) {
      const openApiPath = routeToOpenApiPath(route.path);
      const pathItem = spec.paths[openApiPath];

      if (!pathItem) {
        throw new Error(
          `Route '${route.method} ${route.path}' is not present in the ` +
            `OpenAPI spec under path '${openApiPath}'. ` +
            `Did you add the route to features/routes.ts but not rebuild ` +
            `the spec?`,
        );
      }

      if (!pathItem[route.method]) {
        throw new Error(
          `Route '${route.method} ${route.path}' is missing the ` +
            `'${route.method}' operation in the OpenAPI spec.`,
        );
      }
    }
  });

  it('has unique operationIds across every path and method', async () => {
    const spec = await fetchSpec();
    const seen = new Map<string, string>();

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        const id = op.operationId;
        if (!id) continue;

        const previous = seen.get(id);
        if (previous) {
          throw new Error(
            `Duplicate operationId '${id}' at '${method.toUpperCase()} ${path}' ` +
              `and '${previous}'. OpenAPI requires every operation to have a ` +
              `unique ID.`,
          );
        }
        seen.set(id, `${method.toUpperCase()} ${path}`);
      }
    }
  });

  it('uses the configured basePath in servers[0].url', async () => {
    // The test setup boots the API with basePath '/'.
    const spec = await fetchSpec();
    expect(spec.servers[0]?.url).toBe('/');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Swagger UI serving
// ─────────────────────────────────────────────────────────────────────

describe('Swagger UI', () => {
  it('serves the HTML page at /swagger', async () => {
    const res = await fetch(`${apiUrl()}/swagger`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);

    const html = await res.text();
    expect(html).toContain('swagger-ui');
    expect(html).toContain('SwaggerUIBundle');
  });

  it('references the spec URL from the HTML', async () => {
    const res = await fetch(`${apiUrl()}/swagger`);
    const html = await res.text();

    // The HTML must point Swagger UI at the same spec file the server
    // serves — otherwise the UI loads, but displays nothing.
    expect(html).toContain('/swagger/assets/openapi-specs.json');
  });

  it('serves swagger-ui.css from the static assets mount', async () => {
    const res = await fetch(`${apiUrl()}/swagger/ui/swagger-ui.css`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/css/);
  });

  it('serves swagger-ui-bundle.js from the static assets mount', async () => {
    const res = await fetch(`${apiUrl()}/swagger/ui/swagger-ui-bundle.js`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/javascript/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Base path handling
// ─────────────────────────────────────────────────────────────────────

describe('Swagger UI with a custom basePath', () => {
  it('serves the spec and UI under the custom basePath', async () => {
    const port = await net.getRandomPort();
    const api = new RedisSMQRestApi(
      {
        redis: {
          client: ERedisConfigClient.IOREDIS,
          options: { host: '127.0.0.1', port: getRedisPort() },
        },
        apiServer: { port, basePath: '/tenant/foo' },
      },
      true,
    );

    try {
      await api.run();
      const base = `http://127.0.0.1:${port}/tenant/foo`;

      // Spec is served under the custom base path.
      const spec = await fetchSpec(base);
      expect(spec.openapi).toBe('3.1.0');

      // The HTML entry point references the custom-base-path spec URL.
      const htmlRes = await fetch(`${base}/swagger`);
      expect(htmlRes.status).toBe(200);
      const html = await htmlRes.text();
      expect(html).toContain('/tenant/foo/swagger/assets/openapi-specs.json');

      // The same spec is *not* served at the default root.
      const defaultRoot = await fetch(
        `http://127.0.0.1:${port}/swagger/assets/openapi-specs.json`,
      );
      expect(defaultRoot.status).toBe(404);
    } finally {
      await api.shutdown();
    }
  });
});
