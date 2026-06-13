[RedisSMQ](../README.md) / [Documentation](README.md) / Installation

# Installation

## Requirements

- Node.js 20+
- Redis 4+
- A Redis client: [ioredis](https://github.com/redis/ioredis) or [@redis/client](https://github.com/redis/node-redis)

## Install Packages

```bash
# Core packages (for next releases use tag "@next")
npm install redis-smq redis-smq-common --save

# Redis client (choose one)
npm install ioredis --save
# or
npm install @redis/client --save
```

## Initialize the System

RedisSMQ must be initialized once per process before any queue operations:

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// With ioredis
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      password: 'optional',
      db: 0,
    },
  },
  (err) => {
    if (err) console.error('Failed to initialize:', err);
    else console.log('RedisSMQ ready');
  },
);

// With @redis/client
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.REDIS_CLIENT,
    options: {
      url: 'redis://127.0.0.1:6379',
    },
  },
  callback,
);
```

## What Initialization Does

1. Connects to Redis
2. Loads Lua scripts into Redis (for atomic operations)
3. Loads system configuration from Redis (or creates defaults)
4. Bootstraps the system

## Next Steps

- [Quick Start](quick-start.md) — Send and receive your first message
- [Configuration](https://github.com/weyoss/redis-smq-docs) — System settings
