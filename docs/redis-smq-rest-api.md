[RedisSMQ](../README.md) / [Docs](README.md) / RedisSMQ REST API

# RedisSMQ REST API

The RedisSMQ REST API provides a robust HTTP interface for interacting with the RedisSMQ message queue system. This guide will help you set up and start using the RedisSMQ REST API effectively.

## Prerequisites

Before you start, ensure you have the following installed and configured on your machine:

- **Node.js**: Version 18 or higher.
- **Redis Server**: Version 4 or higher, running and accessible.
- **RedisSMQ**: The latest [RedisSMQ V8 Release Candidate](https://github.com/weyoss/redis-smq) installed.

## Installation

To install the RedisSMQ REST API package, use npm:

```bash
npm install redis-smq-rest-api@rc --save
```

## Configuration

The configuration for the RedisSMQ REST API builds upon the [RedisSMQ Configuration](configuration.md) and includes additional settings for the API server.

### Configuration Types

```typescript
export type THttpApiConfig = {
  port?: number;  // The port the API server listens on.
  host?: string;  // The address the API server binds to.
  basePath?: string;  // Optional base path for API endpoints.
};

export interface IRedisSMQHttpApiConfig extends IRedisSMQConfig {
  apiServer?: THttpApiConfig;  // Configuration for the API server.
}
```

### Example Configuration File

Create a configuration file at the specified path (e.g., './path/to/configuration.js'):

```typescript
import { IRedisSMQHttpApiConfig } from 'redis-smq-rest-api';
import { ERedisConfigClient } from 'redis-smq-common';

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

export default config;  // Don't forget to export your configuration.
```

## Running the API Server

Create a server file (e.g., './path/to/server.js') to run the API server:

```typescript
import { RedisSmqRestApi } from 'redis-smq-rest-api';
import config from './path/to/configuration.js';

const apiServer = new RedisSmqRestApi(config);
apiServer.run();
```

### Start the Server

To start your API server, execute the following command in your terminal:

```bash
node ./path/to/server.js
```

Once started, the API server will be accessible via `http://<HOST>:<PORT>`.

## Accessing API Documentation

The RedisSMQ REST API includes a built-in Swagger UI for exploring and testing the API endpoints. To access it, navigate to:

```
http://<HOST>:<PORT>/docs
```

## OpenAPI Specification

For programmatic access or integration with other systems, the OpenAPI specification can be found at:

```
http://<HOST>:<PORT>/assets/openapi-specs.json
```

## Additional Resources

This guide has provided a foundational overview of setting up and using the RedisSMQ REST API. For comprehensive details, refer to the official [RedisSMQ REST API documentation](https://github.com/weyoss/redis-smq-rest-api).
