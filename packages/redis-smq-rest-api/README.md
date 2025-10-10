# RedisSMQ REST API

> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.  
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api
> - Latest release notes/tags: https://github.com/weyoss/redis-smq/releases/latest
> - Install stable packages with @latest; pre-release with @next.

[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq-rest-api/next?style=flat-square&label=redis-smq-rest-api%40next)](https://www.npmjs.com/package/redis-smq-rest-api?activeTab=versions)
[![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq?flag=redis-smq-rest-api&branch=next&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-rest-api)

RedisSMQ REST API provides an HTTP interface enabling any web-capable application to interact with the RedisSMQ message
queue using a RESTful API.

## Features

- 🚀 Clean and efficient implementation
- ✅ Strict request/response validation using [JSON Schema](https://json-schema.org/)
- 📚 Native [OpenAPI v3](https://www.openapis.org/) support and [Swagger UI](https://swagger.io/)
- 🧪 90%+ code coverage with extensive testing
- 📦 Support for both ESM & CJS modules

## Installation

```bash
# Using npm
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next --save
```

Don't forget to install a Redis client. Choose either node-redis or ioredis:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

## Version Compatibility

⚠️ Important: Always install matching versions of RedisSMQ packages to ensure compatibility.

```bash
npm install redis-smq@x.x.x redis-smq-rest-api@x.x.x redis-smq-common@x.x.x
```

See [version compatibility](/packages/redis-smq/docs/version-compatibility.md) for details.

## Configuration

The REST API configuration extends the base [RedisSMQ configuration](/packages/redis-smq/docs/configuration.md) with additional API server settings.

### Configuration Options

```typescript
export interface IRedisSMQHttpApiConfig extends IRedisSMQConfig {
  apiServer?: {
    // Port to run the REST API on. Default: 7210
    port?: number;

    // Base path to mount the REST API and docs under. Default: '/'
    basePath?: string;
  };
}
```

### Configuration Examples

```typescript
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

const config = {
  apiServer: {
    port: 7210,
    basePath: '/', // API at '/', Swagger at '/docs'
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

The RedisSMQRestApi class can be used as a standalone server or embedded as middleware in an existing Express application.

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

### Embedded Middleware

To integrate into an existing Express app, instantiate RedisSMQRestApi with false as the second argument to prevent it
from starting its own listener. Then, use getApplication() to get the middleware.

```javascript
import express from 'express';
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient } from 'redis-smq-common';

const app = express();
const api = new RedisSMQRestApi(
  {
    apiServer: { basePath: '/api' }, // port is ignored
    redis: { client: ERedisConfigClient.IOREDIS },
  },
  false, // <-- disable listener
);

const restApiMiddleware = await api.getApplication();
app.use(restApiMiddleware);

app.listen(3000, () =>
  console.log('Host app listening on http://localhost:3000'),
);
```

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
http://<HOSTNAME>:<PORT>/docs
```

### OpenAPI Specification

Download the OpenAPI specification at:

```text
http://<HOSTNAME>:<PORT>/assets/openapi-specs.json
```

## Available Endpoints

For detailed endpoint documentation, refer to the Swagger UI.

## License

This project is licensed under is released under the [MIT License](/LICENSE).
