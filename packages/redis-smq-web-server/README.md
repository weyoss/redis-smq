# RedisSMQ Web Server

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
npm redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-server --save
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

#### ESM / TypeScript

```typescript
import { RedisSMQWebServer } from 'redis-smq-web-server';

const redisSMQWebServer = new RedisSMQWebServer();

await redisSMQWebServer.run({
  port: 8080,
  basePath: '/',
  redisHost: '127.0.0.1',
  redisPort: 6379,
  redisDB: '1',
});

// Or proxy API/docs/assets to an external service
await redisSMQWebServer.run({
  port: 8080,
  apiProxyTarget: 'http://127.0.0.1:7210',
});

// Optional: stop later
// await redisSMQWebServer.shutdown();
```

#### CommonJS

```javascript
const { startWebServer } = require('redis-smq-web-server');

const redisSMQWebServer = new RedisSMQWebServer();

redisSMQWebServer.run({
  port: 8080,
  basePath: '/',
  redisHost: '127.0.0.1',
  redisPort: 6379,
  redisDB: '1',
});

// Or proxy to external API
redisSMQWebServer.run({
  port: 8080,
  apiProxyTarget: 'http://127.0.0.1:7210',
});
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
interface IRedisSMQWebServerConfig {
  port: number;
  basePath: string;
  redisPort: number;
  redisHost: string;
  redisDB: string;
  /**
   * Optional: forward <basePath>/api, <basePath>/docs and <basePath>/assets
   * to an external redis-smq-rest-api service. Example: "http://127.0.0.1:7210"
   */
  apiProxyTarget?: string;
}
```

### Options
- port: HTTP port the web server listens on.
- basePath: Public base path where the UI and API are mounted (e.g., / or /redis-smq).
- redisPort: Redis server port (default 6379).
- redisHost: Redis server host (default 127.0.0.1).
- redisDB: Redis database index used by RedisSMQ (e.g., "1").
- apiProxyTarget: If provided, the web server proxies API/docs/assets to this upstream instead of hosting the API in-process.

### ClI flags

```shell
  -p, --port <port>             Port to run the server on (default: "8080")
  -B, --base-path <basePath>    base public path for the RedisSMQ Web UI SPA (default: "/")
  -H, --redis-host <redisHost>  Redis server host (default: "127.0.0.1")
  -P, --redis-port <redisPort>  Redis server port (default: "6379")
  -D, --redis-db <redisDB>      Redis database number (default: "1")
  -x, --api-proxy-target <url>  Proxy target for API (/api, /docs, /assets). Example: http://127.0.0.1:7210
  -h, --help                    display help for command

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

RedisSMQ Web Server is licensed under is released under the [MIT License](https://github.com/weyoss/redis-smq/blob/master/LICENSE).

