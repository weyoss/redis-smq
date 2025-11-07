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

### Programmatically (optional)

If you prefer embedding the server in your app, you can pass the same configuration programmatically.

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
      level: EConsoleLoggerLevel.INFO,
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

## Configuration

Configuration can be provided programmatically or via CLI arguments. The core interface is:

```typescript
import type { IRedisSMQRestApiConfig } from 'redis-smq-rest-api';

interface IRedisSMQWebServerConfig
  extends Omit<IRedisSMQRestApiConfig, 'apiServer'> {
  webServer?: {
    /**
     * HTTP port for the web server (serves UI and embedded/proxied API).
     * Default: 8080
     */
    port?: number;

    /**
     * Base public path for the Web UI and API/Swagger mounts.
     * UI at <basePath>, API at <basePath>/api, Swagger at <basePath>/swagger.
     * Default: '/'
     */
    basePath?: string;

    /**
     * Optional target for proxying API.
     * If provided, the embedded REST API is not mounted and requests are forwarded to the target.
     * Example: 'http://127.0.0.1:7210'
     */
    apiProxyTarget?: string;
  };
}
```

Notes:

- The web server always embeds the REST API unless `apiProxyTarget` is set. It does not use a separate `apiServer` section.
  The embedded API is mounted at `/api` and Swagger at `/swagger`.

- When `webServer.apiProxyTarget` is set, the server proxies `<basePath>/api` and `<basePath>/swagger` to the target.
  In this mode, `redis` and `logger` options are not used by the web server (they are handled by the upstream API service).

- When `webServer.apiProxyTarget` is not set, the web server mounts the embedded `redis-smq-rest-api` using the provided
  `IRedisSMQWebServerConfig`.

### ClI flags

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

## Deploying behind a reverse proxy

See [Deploying behind a reverse proxy](deploying-behind-a-reverse-proxy.md).
