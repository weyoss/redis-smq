# RedisSMQ REST API

[![Latest Release](https://img.shields.io/github/v/release/weyoss/redis-smq?include_prereleases&label=release&color=green&style=flat-square)](https://github.com/weyoss/redis-smq/releases)
[![Code Coverage](https://img.shields.io/codecov/c/github/weyoss/redis-smq?flag=redis-smq-rest-api&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api)

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
npm install redis-smq-rest-api --save

# Using yarn
yarn add redis-smq-rest-api

# Using pnpm
pnpm add redis-smq-rest-api
```

## Version Compatibility

⚠️ Important: Always install matching versions of RedisSMQ packages to ensure compatibility.

```bash
npm install redis-smq@x.x.x redis-smq-rest-api@x.x.x redis-smq-common@x.x.x
```

See [version compatibility](https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/version-compatibility.md) for details.

## Configuration

The REST API configuration extends the base [RedisSMQ configuration](https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/configuration.md) with additional API server settings.

### Configuration Options

```typescript
export type THttpApiConfig = {
  port?: number;
  host?: string;
  basePath?: string;
};

export interface IRedisSMQHttpApiConfig extends IRedisSMQConfig {
  apiServer?: THttpApiConfig;
}
```

### Configuration Examples

```typescript
import { RedisSmqRestApi } from 'redis-smq-rest-api';

// Basic configuration
const basicConfig: IRedisSMQHttpApiConfig = {
  redis: {
    client: 'ioredis',
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  apiServer: {
    host: '127.0.0.1',
    port: 7210,
  },
};
```

## Programmatic Usage

```typescript
import { RedisSmqRestApi } from 'redis-smq-rest-api';

const config: IRedisSMQHttpApiConfig = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  apiServer: {
    host: '127.0.0.1',
    port: 7210,
  },
};

const apiServer = new RedisSmqRestApi(config);
apiServer.run();
```

## Usage from CLI

The REST API server can be started directly from your terminal after installation.

```shell
npx redis-smq-rest-api
```

### CLI Options

You can override the default configuration using the following command-line arguments:

```shell
-p, --port <port>             Port to run the API server on (default: "7210")
-B, --base-path <basePath>    Base public path for the Swagger UI (default: "/")
-H, --redis-host <redisHost>  Redis server host (default: "127.0.0.1")
-P, --redis-port <redisPort>  Redis server port (default: "6379")
-D, --redis-db <redisDB>      Redis database number (default: "0")
-h, --help                    display help for command
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

This project is licensed under is released under the [MIT License](https://github.com/weyoss/redis-smq/blob/master/LICENSE).
