[RedisSMQ REST API](../README.md) / Documentation

# RedisSMQ REST API — Documentation

RedisSMQ REST API exposes a validated HTTP interface for managing queues, exchanges, producers/consumers, and message
audit data. You can run it as a standalone service, via CLI, or embed it into an existing Node.js application.

- JSON over HTTP with strict request/response validation (JSON Schema)
- OpenAPI v3 + Swagger UI
- ESM and CJS compatible
- End-to-end tested against a real Redis instance

## Configuration

```typescript
import type { IRedisConfig, ILoggerConfig } from 'redis-smq-common';

export interface TRestApiConfig {
  // Port to run the REST API on. Default: 7210
  // Must be an integer between 1 and 65535.
  port?: number;

  // Base path for mounting the REST API and Swagger UI. Default: '/'
  // Example: basePath: '/redis-smq' -> API at '/redis-smq', Swagger at '/redis-smq/swagger'
  basePath?: string;
}

export interface IRedisSMQRestApiConfig {
  apiServer?: TRestApiConfig;
  redis?: IRedisConfig;
  logger?: ILoggerConfig;
}
```

The constructor validates `apiServer.port` and `apiServer.basePath` before
touching Redis. An out-of-range port or a non-string base path throws
`InvalidApiServerParamsError` synchronously, with metadata naming the
offending field. Redis configuration errors surface later, when the runtime
initializes.

### Configuration Examples

```typescript
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

const config = {
  apiServer: {
    port: 7210,
    basePath: '/', // API at '/api', Swagger at '/swagger'
  },
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
    },
  },
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.INFO, // or 'INFO'
    },
  },
};
```

## Programmatic Usage

`RedisSMQRestApi` can be used as a standalone server, embedded as a Node
request handler (Express, raw `http.createServer`), or mounted as a Koa
application inside a larger Koa host.

### Standalone Server

This mode starts an HTTP server that listens on the configured port.

```typescript
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient } from 'redis-smq-common';

const api = new RedisSMQRestApi({
  apiServer: { port: 7210 },
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
});

await api.run();
```

### Embedded — Express or raw Node HTTP

Instantiate `RedisSMQRestApi` with `false` as the second argument to
prevent it from starting its own listener. `getApplication()` returns a
Node request handler `(req, res) => void` — the shape `Express.use()` and
`http.createServer()` accept.

```javascript
import express from 'express';
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient } from 'redis-smq-common';

const app = express();
const api = new RedisSMQRestApi(
  {
    apiServer: { basePath: '/' }, // port is ignored
    redis: { client: ERedisConfigClient.IOREDIS },
  },
  false, // <-- disable internal listener
);

app.use(await api.getApplication());

app.listen(3000, () => {
  console.log('Host app listening on http://localhost:3000');
  console.log('REST API at http://localhost:3000/api');
  console.log('Swagger UI at http://localhost:3000/swagger');
});
```

### Embedded — Koa

Koa's `use()` expects a Koa middleware, not a Node request handler. For a
Koa host, use `getKoaApp()` to obtain the inner Koa application and mount
it with `koa-mount`:

```javascript
import Koa from 'koa';
import mount from 'koa-mount';
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient } from 'redis-smq-common';

const host = new Koa();
const api = new RedisSMQRestApi(
  {
    apiServer: { basePath: '/' },
    redis: { client: ERedisConfigClient.IOREDIS },
  },
  false,
);

const inner = await api.getKoaApp();
host.use(mount('/', inner));

host.listen(3000, () => {
  console.log('Koa host listening on http://localhost:3000');
});
```

Note: in embedded mode, the host app controls the port/TLS; the REST API
respects `basePath` when mounted.

## Usage from CLI

The REST API server can be started directly from your terminal after installation.

```shell
npx redis-smq-rest-api
```

### CLI Options

You can override the default configuration using the following command-line arguments:

```shell
-p, --port <number>                 Port to run the REST API on (default: "7210")
-b, --base-path <string>            Base path to mount the REST API under (default: "/")
-c, --redis-client <ioredis|redis>  Redis client. Valid options are: ioredis, redis. (default: "ioredis")
-r, --redis-host <string>           Redis server host (default: "127.0.0.1")
-o, --redis-port <number>           Redis server port (default: "6379")
-d, --redis-db <number>             Redis database number (default: "0")
-e, --enable-log <0|1>              Enable console logging: 0 (disabled), 1 (enabled) (default: "0")
-v, --log-level <0|1|2|3>           Log level. Numbers: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR (default: "1")
-h, --help                          Display help for command
```

### CLI Examples

Starting the server on a specific port and connecting to a different Redis instance:

```shell
npx redis-smq-rest-api --port 8000 --redis-host 10.0.0.5 --redis-port 6380
```

## API Documentation

### Swagger UI

Access the interactive API documentation at:

```text
http://<HOSTNAME>:<PORT>/<basePath>/swagger
# Default (basePath = '/'): http://<HOSTNAME>:<PORT>/swagger
```

### OpenAPI Specification

Download the OpenAPI specification at:

```text
http://<HOSTNAME>:<PORT>/<basePath>/swagger/assets/openapi-specs.json
# Default: http://<HOSTNAME>:<PORT>/swagger/assets/openapi-specs.json
```

The spec declares `servers[0].url: '/'`. This is deliberate: the
operation paths in the spec (`/api/queues`, `/api/config`, …) are
absolute from the origin root, so a client that generates from the spec
composes `{its-base-url}/api/...`. Where the server is actually deployed
— root or a sub-path — is handled by the client's base-URL
configuration, not by the spec.

If you deploy the server at `<basePath: '/tenant/foo'>` and want your own
clients to hit that path, configure their base URL to
`https://your-host/tenant/foo`. The spec's operation paths remain `/api/...`,
and the composition works without the spec needing to know about the
deployment prefix.

## Available Endpoints

Refer to the Swagger UI for the full list of endpoints, parameters, and
response schemas. The spec is generated from the same route table the HTTP
server uses, so it cannot drift from what the server actually serves.

### Diagnostic endpoints

- `GET /api/ping` — returns `{ ok: true, uptime }`. Useful for liveness
  probes in containerized deployments; it does not touch Redis and does not
  require the runtime to be initialized.
