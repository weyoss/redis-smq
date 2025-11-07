[RedisSMQ Common Library](../README.md) / Redis Client

# Redis Client

## Table of Contents

- [Supported Clients](#supported-clients)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
    - [Basic Operations](#basic-operations)
    - [Shutdown](#shutdown)
- [Error Handling](#error-handling)

---

## Supported Clients

The `redis-smq-common` library supports two Redis clients:

- **node-redis**: A popular Redis client for Node.js.
- **ioredis**: A robust and feature-rich Redis client for Node.js.

You can specify which client to use via the `client` property in the configuration object (`ERedisConfigClient.REDIS` or
`ERedisConfigClient.IOREDIS`).

Note: `ERedisConfigClient.REDIS` maps to the `@redis/client` package.

## Prerequisites

Before setting up the Redis client, ensure that you have the following:

- Node.js installed (version 20 or higher).
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
  npm install @redis/client  ```

- For `ioredis`:

  ```bash
  npm install ioredis
  ```

## Configuration

The Redis client can be configured using an `IRedisConfig` object. Below is an example configuration:

```typescript
import { IRedisConfig, ERedisConfigClient } from 'redis-smq-common';

const config: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS, // or ERedisConfigClient.REDIS
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your_redis_password', // if required
    db: 0, // specify the database number
  },
};
```

## Usage

### Basic Operations

```typescript
import {
  RedisClientFactory,
  IRedisConfig,
  ERedisConfigClient,
  IRedisClient,
} from 'redis-smq-common';

const config: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS, // or ERedisConfigClient.REDIS
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your_redis_password', // optional
    db: 0,
  },
};

const redisClient = new RedisClientFactory(config);

// Listen for factory errors
redisClient.on('error', (err: Error) => {
  console.error('Redis client factory error:', err);
});

// Initialize the factory and get client instance
redisClient.init((err) => {
  if (err) {
    console.error('Failed to initialize Redis client factory:', err);
    return;
  }

  // Get the client instance
  const redisClient = factory.getInstance();

  // SET operation
  redisClient.set('mykey', 'myvalue', {}, (setErr, setReply) => {
    if (setErr) {
      console.error('Failed to set key:', setErr);
      return;
    }
    console.log('Set key successfully:', setReply);

    // GET operation
    redisClient.get('mykey', (getErr, reply) => {
      if (getErr) {
        console.error('Failed to get key:', getErr);
      } else {
        console.log('Get key value:', reply);
      }

      // Shutdown the factory when done
      redisClient.shutdown((shutdownErr) => {
        if (shutdownErr) console.error('Error during shutdown:', shutdownErr);
        console.log('Redis client factory shut down');
      });
    });
  });
});
```

### Alternative: Direct Instance Access

```typescript
import {
  RedisClientFactory,
  IRedisConfig,
  ERedisConfigClient,
} from 'redis-smq-common';

const config: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: { host: 'localhost', port: 6379, db: 0 },
};

const redisClient = new RedisClientFactory(config);

redisClient.on('error', (err: Error) => {
  console.error('Factory error:', err);
});

// Get or set instance (creates if not exists)
redisClient.getSetInstance((err, client) => {
  if (err) {
    console.error('Failed to get Redis client instance:', err);
    return;
  }

  console.log('Redis client ready');

  // Use the client for operations
  redisClient.set('testkey', 'testvalue', {}, (setErr, reply) => {
    if (setErr) {
      console.error('SET error:', setErr);
    } else {
      console.log('SET success:', reply);
    }

    // Shutdown when done
    redisClient.shutdown(() => {
      console.log('Factory shut down');
    });
  });
});
```

### Shutdown

Always properly shutdown the factory to close Redis connections:


```typescript
// Graceful shutdown
redisClient.shutdown((err) => {
  if (err) {
    console.error('Error during shutdown:', err);
  } else {
    console.log('Redis client factory shut down successfully');
  }
});
```

### Error Handling

The Redis client factory provides comprehensive error handling:

- Factory errors: The RedisClientFactory emits 'error' events for client-level issues.
- Initialization errors: The init() and getSetInstance() methods pass errors via callbacks.
- Instance lock errors: getSetInstance() throws InstanceLockError if called while locked.
- Panic errors: getInstance() throws PanicError if called before initialization.

```typescript
const redisClient = new RedisClientFactory(config);

// Handle factory-level errors
redisClient.on('error', (factoryErr: Error) => {
  console.error('Redis factory error:', factoryErr);
});

// Handle initialization errors
redisClient.init((initErr) => {
  if (initErr) {
    console.error('Initialization failed:', initErr);
    return;
  }

  try {
    // Get instance (throws PanicError if not initialized)
    const instance = factory.getInstance();
    
    // Handle command errors
    instance.get('somekey', (cmdErr, reply) => {
      if (cmdErr) {
        console.error('Command error:', cmdErr);
        return;
      }
      console.log('Success:', reply);
    });
  } catch (panicErr) {
    console.error('Panic error:', panicErr);
  }
});
```