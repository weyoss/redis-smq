# RedisSMQ REST API

[![Code Coverage](https://img.shields.io/codecov/c/github/weyoss/redis-smq-common?style=flat-square)](https://codecov.io/github/weyoss/redis-smq-common?flag=redis-smq-rest-api&style=flat-square)

---

This package offers an HTTP interface which allows any web capable application to interact with the RedisSMQ
message queue using a RESTful API.

Currently, RedisSMQ REST API is distributed as an RC release and is still in active development.

## Features

- A clean and simple implementation as always :).
- Strict Request/Response validation based on [JSON Schema](https://json-schema.org/).
- Native [OpenAPI v3](https://www.openapis.org/) support and [Swagger](https://swagger.io/) for developers.
- Rigorously tested codebase with code coverage no less than 90%.
- Both ESM & CJS modules are supported.

## Installation

```shell
npm i redis-smq-rest-api@rc --save
```

### Prerequisites

- [RedisSMQ V8](https://github.com/weyoss/redis-smq) latest RC release.

## Configuration

The REST API configuration extends [RedisSMQ Configuration](https://github.com/weyoss/redis-smq/blob/master/docs/configuration.md)
while adding the API server configuration.

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

## Usage

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

## API Reference

Once your RedisSMQ API server is up and running you may view the API Reference and try it directly from
the Swagger UI which is accessible via `http://<HOSTAME:PORT>/docs`.

## OpenAPI Specification

The OpenAPI specification is available at `http://<HOSTAME:PORT>/assets/openapi-specs.json`
