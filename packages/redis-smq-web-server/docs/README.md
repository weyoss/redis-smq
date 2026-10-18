[RedisSMQ Web Server](../README.md) / Documentation

# RedisSMQ Web Server - Documentation

## Quick Start

### From the Command Line

Start the server with defaults:

```shell
npx redis-smq-web-server
```

Customize host/port, UI base path, and Redis connection:

```shell
npx redis-smq-web-server \
  --port 8080 \
  --base-path / \
  --redis-host 127.0.0.1 \
  --redis-port 6379 \
  --redis-db 1
```

**Common scenarios:**

- Serve under a sub-path (behind a reverse proxy):

```shell
npx redis-smq-web-server --base-path /redis-smq
```

UI will be available at http://localhost:8080/redis-smq and the HTTP API under http://localhost:8080/redis-smq/api.

- Use an external API (proxy mode) — useful if you run redis-smq-rest-api separately:

```shell
npx redis-smq-web-server \
  --port 8080 \
  --api-proxy-target http://127.0.0.1:7210
```

When `--api-proxy-target` is provided, requests to `<basePath>/api` and `<basePath>/swagger` are forwarded
to the upstream. In this mode, Redis connection options on the web server are not used; the upstream API service manages Redis.

### Programmatically

The `RedisSMQWebServer` class can be used in three ways.

#### Standalone server

Start an HTTP listener that serves the UI and either embeds or proxies the API, depending on the config:

```typescript
import { RedisSMQWebServer } from 'redis-smq-web-server';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

// Run with the embedded REST API (in-process)
const server = new RedisSMQWebServer({
  webServer: {
    port: 8080,
    basePath: '/', // UI at '/', API at '/api', swagger at '/swagger'
  },
  // The following options are used only when apiProxyTarget is NOT set
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      db: 1,
      showFriendlyErrorStack: true,
    },
  },
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.INFO,
    },
  },
});

await server.run();
// await server.shutdown();

// Or proxy API to an external service
const srv = new RedisSMQWebServer({
  webServer: {
    port: 8080,
    basePath: '/', // or '/redis-smq'
    apiProxyTarget: 'http://127.0.0.1:7210',
  },
  // No redis/logger config required in proxy mode
});

await srv.run();
```

#### Embedded in a larger Express app

Pass `false` as the second constructor argument to skip the internal listener, then mount the composed Express
application into your host:

```typescript
import express from 'express';
import { RedisSMQWebServer } from 'redis-smq-web-server';
import { ERedisConfigClient } from 'redis-smq-common';

const host = express();

const webServer = new RedisSMQWebServer(
  {
    webServer: { basePath: '/redis-smq' },
    redis: { client: ERedisConfigClient.IOREDIS },
  },
  false, // <-- disable internal listener
);

const inner = await webServer.getApplication();
host.use(inner);

host.listen(3000, () => {
  console.log('Host app on http://localhost:3000');
  console.log('Web UI at http://localhost:3000/redis-smq');
  console.log('API at http://localhost:3000/redis-smq/api');
});
```

`getApplication()` returns an Express app that already has every middleware installed — the trust-proxy setting,
static-file serving, API routing (embed or proxy), the root redirect, and the SPA fallback. Mount it wherever your host
needs it. Your host owns the listening socket; the web server owns its own runtime and disposes it when you call
`webServer.shutdown()`.

This is symmetric with `RedisSMQRestApi.getApplication()` in `redis-smq-rest-api`. A host that embeds both should mount
them at different base paths — typically the web server's base path for the SPA, and the REST API's base path for the
raw API.

#### Custom configuration errors

Config validation happens in the constructor. A malformed config throws one of two typed errors before any I/O:

```typescript
import {
  RedisSMQWebServer,
  InvalidWebServerParamsError,
  WebUIBundleNotFoundError,
} from 'redis-smq-web-server';

try {
  const server = new RedisSMQWebServer({
    webServer: { port: 99999, basePath: '/' },
  });
  await server.run();
} catch (err) {
  if (err instanceof InvalidWebServerParamsError) {
    // `err.metadata` carries { field, value, reason }
    console.error(`Bad ${err.metadata?.field}: ${err.metadata?.reason}`);
  } else if (err instanceof WebUIBundleNotFoundError) {
    // `err.metadata` carries { path, reason? }
    console.error(`Web UI bundle missing at ${err.metadata?.path}`);
  } else {
    throw err;
  }
}
```

- `InvalidWebServerParamsError` — thrown synchronously by the constructor for an out-of-range port, a malformed
  `apiProxyTarget`, or a `basePath` that isn't a string. The `metadata` field names the offending field and value.
- `WebUIBundleNotFoundError` — thrown asynchronously by `run()` (and `getApplication()`) when the `redis-smq-web-ui`
  bundle is missing or malformed. The `metadata.path` names the file the server tried to read.

## Routes

- UI: served from the configured base path
  - Example: `basePath = /` → UI at `/`
  - Example: `basePath = /redis-smq` → UI at `/redis-smq`
- HTTP API: mounted under `<basePath>/api`
  - Example: `basePath = /` → API at `/api`
  - Example: `basePath = /redis-smq` → API at `/redis-smq/api`

- Swagger UI: mounted under `<basePath>/swagger`
  - Example: `basePath = /` → Swagger UI at `/swagger`
  - Example: `basePath = /redis-smq` → Swagger UI at `/redis-smq/swagger`

Proxying behavior:

- When `apiProxyTarget` is set, the server forwards:
  - `<basePath>/api` → `${apiProxyTarget}`
  - `<basePath>/swagger` → `${apiProxyTarget}`
- When `apiProxyTarget` is not set, the server hosts the embedded REST API in-process.

### Root redirect

When `basePath` is set to anything other than `/`, a request to the origin root (`/`) redirects to `basePath`. The
redirect is a `302` (temporary — you can change the base path on the next deploy without worrying about browser cache)
and preserves the request's query string. A user who lands on `https://example.com/` finds the UI at
`https://example.com/redis-smq`; a user who lands on `https://example.com/?campaign=xyz` finds the UI at
`https://example.com/redis-smq?campaign=xyz`.

## Configuration

Configuration can be provided programmatically or via CLI arguments. The core interface is:

```typescript
interface IRedisSMQWebServerConfig {
  webServer?: {
    /**
     * HTTP port for the web server (serves UI and embedded/proxied API).
     * Default: 8080. Must be an integer in [1, 65535].
     */
    port?: number;

    /**
     * Base public path for the Web UI and API/Swagger mounts.
     * UI at <basePath>, API at <basePath>/api, Swagger at <basePath>/swagger.
     * Default: '/'.
     */
    basePath?: string;

    /**
     * Optional target for proxying API.
     * If provided, the embedded REST API is not mounted and requests are forwarded to the target.
     * Must be a valid http: or https: URL. Example: 'http://127.0.0.1:7210'
     */
    apiProxyTarget?: string;
  };

  redis?: IRedisConfig;
  logger?: ILoggerConfig;
}
```

Notes:

- The web server always embeds the REST API unless `apiProxyTarget` is set. It does not use a separate `apiServer` section.
  The embedded API is mounted at `/api` and Swagger at `/swagger`.

- When `webServer.apiProxyTarget` is set, the server proxies `<basePath>/api` and `<basePath>/swagger` to the target.
  In this mode, `redis` and `logger` options are not used by the web server (they are handled by the upstream API service).

- When `webServer.apiProxyTarget` is not set, the web server mounts the embedded `redis-smq-rest-api` using the provided
  `IWebServerConfig`.

- The constructor validates `port`, `basePath`, and `apiProxyTarget`. Invalid values throw `InvalidWebServerParamsError`
  synchronously, with `metadata` naming the offending field and value.

### CLI flags

```shell
-p, --port <number>                 Port to run the server on (default: "8080")
-b, --base-path <string>            Base public path for the RedisSMQ Web UI SPA (default: "/")
-t, --api-proxy-target <string>     Proxy target for API (/api, /swagger). Example: http://127.0.0.1:6000
-c, --redis-client <ioredis|redis>  Redis client. Valid options are: ioredis, redis. (default: "ioredis")
-r, --redis-host <string>           Redis server host (default: "127.0.0.1")
-o, --redis-port <number>           Redis server port (default: "6379")
-d, --redis-db <number>             Redis database number (default: "0")
-e, --enable-log <0|1>              Enable console logging. Valid options are: 0, 1 (default: "0")
-v, --log-level <0|1|2|3>           Log level. Numbers: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR (default: "1")
-h, --help                          display help for command
```

On a config validation failure, the CLI prints the field name, the rejected value, and the reason — for example:

```text
Invalid configuration: port must be an integer between 1 and 65535 (got 99999)
```

The exit code is non-zero, matching the shell convention for a failed startup.

## Trusting the reverse proxy

The web server calls `app.set('trust proxy', true)`, which means Express reads `req.protocol` and `req.ip` from the
`X-Forwarded-Proto` and `X-Forwarded-For` headers the reverse proxy sets. This matters in two places:

- The root redirect (when `basePath !== '/'`) generates an `https://` `Location` header for HTTPS deployments. Without
  `trust proxy`, the redirect would go to `http://` and cause a redirect loop.
- Any future middleware that keys on `req.ip` (access logging, rate limiting) sees the client's address, not the
  proxy's.

A deployment that terminates TLS at the reverse proxy needs no additional configuration — the defaults are correct. A
deployment with more than one trusted proxy hop (a CDN in front of an nginx) would need to override the setting from
the host application if embedding.

## Deploying behind a reverse proxy

See [Deploying behind a reverse proxy](deploying-behind-a-reverse-proxy.md).
