# RedisSMQ Web Server

> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.  
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-server
> - Latest release notes/tags: https://github.com/weyoss/redis-smq/releases/latest
> - Install stable packages with @latest; pre-release with @next.

A lightweight, configurable HTTP server that hosts the RedisSMQ Web UI and exposes the RedisSMQ HTTP API in the same process — or proxies it to an external API service.

- Serves the SPA (Single Page Application) for monitoring and managing RedisSMQ.
- Mounts the HTTP API under a configurable base path.
- Can run the HTTP API in-process, or proxy API/docs/assets to an external `redis-smq-rest-api`.
- Requires only Redis connection details when hosting the API in-process; with proxying, Redis is managed by the upstream API service.

## Features

- Static SPA hosting with history fallback (client-side routing supported).
- One binary to serve both UI and HTTP API (or proxy to an existing API instance).
- Optional upstream proxy for API/docs/assets via a single flag.
- Simple, explicit configuration via CLI or programmatic config.
- Sensible defaults; easily deployable behind reverse proxies.

## Installation

```bash
# Using npm
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next --save
```

Don't forget to install a Redis client. Choose either node-redis or ioredis:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

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

When `--api-proxy-target` is provided, requests to `<basePath>/api`, `<basePath>/docs`, and `<basePath>/assets` are forwarded
to the upstream. In this mode, Redis connection options on the web server are not used; the upstream API service manages Redis.

### Programmatically (optional)

If you prefer embedding the server in your app, you can pass the same configuration programmatically.

```typescript
import { RedisSMQWebServer } from 'redis-smq-web-server';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

// Run with the embedded REST API (in-process)
const server = new RedisSMQWebServer({
  webServer: {
    port: 8080,
    basePath: '/', // UI at '/', API at '/api', docs at '/docs'
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
      level: EConsoleLoggerLevel.INFO,
    },
  },
});

await server.run();
// await server.shutdown();

// Or proxy API/docs/assets to an external service
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

## Routes

- UI: served from the configured base path
  - Example: basePath = / → UI at /
  - Example: basePath = /redis-smq → UI at /redis-smq
- HTTP API: mounted under <basePath>/api

  - Example: basePath = / → API at /api
  - Example: basePath = /redis-smq → API at /redis-smq/api

- Swagger UI: mounted under <basePath>/docs
  - Example: basePath = / → Swagger UI at /docs
  - Example: basePath = /redis-smq → Swagger UI at /redis-smq/docs

Proxying behavior:

- When apiProxyTarget is set, the server forwards:
  - <basePath>/api → ${apiProxyTarget}
  - <basePath>/docs → ${apiProxyTarget}
  - <basePath>/assets → ${apiProxyTarget}
- When apiProxyTarget is not set, the server hosts the embedded REST API in-process.

## Configuration

Configuration can be provided programmatically or via CLI arguments. The core interface is:

```typescript
import type { IRedisSMQRestApiConfig } from 'redis-smq-rest-api';

interface IRedisSMQWebServerConfig extends IRedisSMQRestApiConfig {
  webServer?: {
    /**
     * HTTP port to run the web server on.
     * Default: 8080
     */
    port?: number;

    /**
     * Base public path for the RedisSMQ Web UI and the local API/docs when embedded.
     * Default: '/'
     */
    basePath?: string;

    /**
     * Optional target for proxying (/api, /docs, /assets).
     * If provided, the embedded REST API is not mounted and requests are forwarded to the target.
     * Example: 'http://127.0.0.1:7210'
     */
    apiProxyTarget?: string;
  };
}
```

Notes:

- When `webServer.apiProxyTarget` is set, the server proxies `<basePath>/api`, `<basePath>/docs`, and
  `<basePath>/assets` to the target. In this mode, redis and logger options are not used by the web server (they are
  handled by the upstream API service).

- When `webServer.apiProxyTarget` is not set, the web server mounts the embedded `redis-smq-rest-api` using the provided
  `IRedisSMQRestApiConfig` (redis, logger, etc.).

### ClI flags

```shell
-p, --port <number>                 Port to run the server on (default: "8080")
-b, --base-path <string>            Base public path for the RedisSMQ Web UI SPA (default: "/")
-t, --api-proxy-target <string>     Proxy target for API (/api, /docs, /assets). Example: http://127.0.0.1:6000
-c, --redis-client <ioredis|redis>  Redis client. Valid options are: ioredis, redis. (default: "ioredis")
-r, --redis-host <string>           Redis server host (default: "127.0.0.1")
-o, --redis-port <number>           Redis server port (default: "6379")
-d, --redis-db <number>             Redis database number (default: "0")
-e, --enable-log <0|1>              Enable console logging. Valid options are: 0, 1 (default: "0")
-v, --log-level <0|1|2|3>           Log level. Numbers: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR (default: "1")
-h, --help                          display help for command
```

## Deploying behind a reverse proxy

- Set --base-path to the public sub-path you expose (e.g., /redis-smq).
- Ensure your proxy forwards both the UI and API prefixes:
  - /redis-smq → web server
- If you terminate TLS at the proxy, no additional config is needed here.
- If you also proxy the API to an external service, combine with `--api-proxy-target`:
  - Client → reverse proxy → web server (/redis-smq)
  - Web server proxies /redis-smq/api, /redis-smq/docs, /redis-smq/assets → external API

## License

RedisSMQ Web Server is licensed under is released under the [MIT License](/LICENSE).
