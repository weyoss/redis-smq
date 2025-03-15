[RedisSMQ Common Library](../README.md) / Redis Client Setup and Usage Guide

# Redis Client Setup and Usage Guide

## Table of Contents

- [Supported Clients](#supported-clients)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

---

## Supported Clients

The `redis-smq-common` library supports two Redis clients:

- **node-redis**: A popular Redis client for Node.js.
- **ioredis**: A robust and feature-rich Redis client for Node.js.

You can specify which client to use via the `client` property in the configuration object (`ERedisConfigClient.REDIS` or
`ERedisConfigClient.IOREDIS`).

## Prerequisites

Before setting up the Redis client, ensure that you have the following:

- Node.js installed (version 14 or higher).
- Redis server running and accessible.

## Installation

To install the necessary dependencies for using the Redis client, follow these steps:

1. **Install `redis-smq-common`:**

   ```bash
   npm install redis-smq-common
   ```

2. **Install the desired Redis client:**

- For `node-redis`:

  ```bash
  npm install node-redis
  ```

- For `ioredis`:
  ```bash
  npm install ioredis
  ```

## Configuration

The Redis client can be configured using an `IRedisConfig` object. Below is an example configuration:

```typescript
import { IRedisConfig, ERedisConfigClient } from 'redis-smq-common';

const config: IRedisConfig = {
  client: ERedisConfigClient.REDIS, // or ERedisConfigClient.IOREDIS
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your_redis_password', // if required
    db: 0, // specify the database number
  },
};
```

## Usage

### Example Usage

```typescript
import {
  createRedisClient,
  IRedisConfig,
  ERedisConfigClient,
} from 'redis-smq-common';
import {
  CallbackEmptyReplyError,
  RedisClientError,
} from 'redis-smq-common/errors';

const config: IRedisConfig = {
  client: ERedisConfigClient.REDIS, // or ERedisConfigClient.IOREDIS
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your_redis_password', // if required
    db: 0, // specify the database number
  },
};

createRedisClient(config, (err, client) => {
  if (err) {
    console.error('Failed to create Redis client:', err);
    return;
  }

  // Use the Redis client
  client.set('key', 'value', {}, (err, reply) => {
    if (err) {
      console.error('Failed to set key:', err);
      return;
    }
    console.log('Set key successfully:', reply);
  });

  client.get('key', (err, reply) => {
    if (err) {
      console.error('Failed to get key:', err);
      return;
    }
    console.log('Get key value:', reply);
  });

  // Close the connection when done
  client.end(true);
});
```

### Error Handling

The `createRedisClient` function handles errors gracefully. If there's an issue creating the client or connecting to
Redis, it will call the callback with an appropriate error.
