[RedisSMQ](../README.md) / [Documentation](README.md) / Installation

# Installation

## Requirements

- **Node.js 22+** — RedisSMQ 10.x requires Node 22 or later
- Redis 4+
- A Redis client: [ioredis](https://github.com/redis/ioredis) or [@redis/client](https://github.com/redis/node-redis)

## Install Packages

```bash
# Core packages
npm install redis-smq redis-smq-common --save

# Redis client (choose one)
npm install ioredis --save
# or
npm install @redis/client --save
```

`redis-smq-common` is a required peer dependency. It is not bundled with `redis-smq` and must be installed alongside it at the same version. See [Version Compatibility](version-compatibility.md).

## Initialize the System

RedisSMQ must be initialized once per process before any queue operations:

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

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

The promise form is also supported:

```javascript
await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});
```

Calling a factory method (`createProducer()`, `createConsumer()`, and so on) before `initialize()` completes throws `PanicError`. Await the initialization callback — or the returned promise — before constructing the rest of your application.

## What Initialization Does

1. **Connects to Redis** — opens the connection pool
2. **Loads Lua scripts** — every operation's script is loaded into Redis for atomic execution
3. **Loads system configuration** — reads it from Redis; if none exists, writes the defaults
4. **Starts the internal event bus and configuration sync** — the mechanisms that propagate config changes across processes
5. **Starts the background-worker cluster** — scheduled-message publisher, delayed requeuers, consumer reaper, orphaned-lock recovery

If any step fails, the entire initialization is rolled back — every resource acquired during the attempt is released and the state machine returns to `DOWN`. A subsequent `initialize()` call can retry from a clean slate.

## Idempotency

Calling `initialize()` when the library is already running resolves immediately. Calling it while a previous initialization is in flight queues the caller behind the in-flight one. Calling it during shutdown rejects with `PanicError`.

## Using Multiple Redis Clients

The `client` field selects which Redis client library the connection pool uses. `ioredis` and `@redis/client` are both supported; only one is needed per process.

```javascript
const { ERedisConfigClient } = require('redis-smq-common');

// ioredis
RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});

// @redis/client
RedisSMQ.initialize({
  client: ERedisConfigClient.REDIS_CLIENT,
  options: { url: 'redis://127.0.0.1:6379' },
});
```

The `options` object is passed through to the selected client's constructor, so any connection option the client supports — TLS, sentinel, cluster, ACL credentials — works here. Refer to the client's own documentation for the full option surface.

## Next Steps

- [Quick Start](quick-start.md) — Send and receive your first message
- [Configuration](configuration.md) — Namespace, logging, and message audit settings
- [ESM & CJS Modules](esm-cjs-modules.md) — Module systems and TypeScript resolution
- [Version Compatibility](version-compatibility.md) — Keeping RedisSMQ packages in sync
