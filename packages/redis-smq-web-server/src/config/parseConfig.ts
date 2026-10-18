/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parseConfig as parseRestApiConfig } from 'redis-smq-rest-api';
import { InvalidWebServerParamsError } from '../errors/index.js';
import { DEFAULT_BASE_PATH, DEFAULT_PORT } from './constants.js';
import type { IParsedWebServerConfig, IWebServerConfig } from './types.js';

/**
 * Collapses a raw base path into a canonical form:
 *   'ui'          → '/ui'
 *   '/ui/'        → '/ui'
 *   '//foo//bar'  → '/foo/bar'
 *   ''            → '/'
 *   '/'           → '/'
 *
 * Idempotent — normalizing an already-normalized path is a no-op.
 */
function normalizeBasePath(raw: string): string {
  const cleaned = raw
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
  return `/${cleaned}`;
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvalidWebServerParamsError({
      metadata: {
        field: 'port',
        value: port,
        reason: 'port must be an integer between 1 and 65535',
      },
    });
  }
}

/**
 * Validates a proxy target and returns it unchanged.
 *
 * Uses the WHATWG `URL` constructor rather than a regex. `new URL()`
 * enforces everything the standard requires — scheme, authority, port
 * range — and rejects inputs that a hand-written regex inevitably
 * misses (IPv6 literals, percent-encoded paths, internationalized
 * domain names). It's also the same parser the proxy will use at
 * request time, so anything that passes here will parse there.
 *
 * Only `http:` and `https:` are accepted. An `ftp://` or `file://`
 * target would be silently accepted by `new URL()` but would fail
 * at proxy time with an unhelpful error — catching it at config time
 * surfaces the misconfiguration to the operator before the server
 * starts.
 */
function validateProxyTarget(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InvalidWebServerParamsError({
      metadata: {
        field: 'apiProxyTarget',
        value: raw,
        reason: 'must be a valid URL',
      },
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new InvalidWebServerParamsError({
      metadata: {
        field: 'apiProxyTarget',
        value: raw,
        reason: 'must use http or https',
      },
    });
  }

  return raw;
}

/**
 * Turns a user-supplied configuration into a fully-populated, validated
 * config. The only place in the package where defaults are applied and
 * where `IWebServerConfig` invariants are enforced.
 *
 * @throws {InvalidWebServerParamsError} on invalid port, basePath, or
 *   apiProxyTarget.
 */
export function parseConfig(
  config: IWebServerConfig = {},
): IParsedWebServerConfig {
  const port = config.webServer?.port ?? DEFAULT_PORT;
  validatePort(port);

  const rawBasePath = config.webServer?.basePath ?? DEFAULT_BASE_PATH;
  if (typeof rawBasePath !== 'string') {
    throw new InvalidWebServerParamsError({
      metadata: {
        field: 'basePath',
        value: rawBasePath,
        reason: 'basePath must be a string',
      },
    });
  }

  const rawTarget = config.webServer?.apiProxyTarget;
  const apiProxyTarget =
    rawTarget !== undefined ? validateProxyTarget(String(rawTarget)) : null;

  // Delegate redis/logger parsing to the REST API's parseConfig so that
  // defaults stay in one place. The `apiServer` returned by that call is
  // discarded — the web server constructs its own `webServer` section
  // below, and when it embeds a REST API it passes `{ redis, logger }`
  // from this parsed config to the API's constructor.
  const restApi = parseRestApiConfig({
    redis: config.redis,
    logger: config.logger,
  });

  return {
    webServer: {
      port,
      basePath: normalizeBasePath(rawBasePath),
      apiProxyTarget,
    },
    redis: restApi.redis,
    logger: restApi.logger,
  };
}
