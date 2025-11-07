[RedisSMQ](../README.md) / [Docs](README.md) / ESM & CJS Modules

# ESM & CJS Modules

JavaScript has evolved significantly, and today, ES modules (ESM) are recognized as the official standard packaging
format for both backend and frontend applications. However, CommonJS modules (CJS) continue to enjoy popularity and
are widely utilized by numerous NPM packages.

To accommodate a diverse range of developer preferences and use cases, RedisSMQ packages are available in both ESM and
CJS formats. This flexibility enables developers to choose the appropriate module system that best fits their
application's architecture.

## ESM

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init error:', err);
    // ...
  },
);
```

## CJS

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init error:', err);
    // ...
  },
);
```
