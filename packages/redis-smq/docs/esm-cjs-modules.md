[RedisSMQ](../README.md) / [Documentation](README.md) / ESM & CJS Modules

# ESM & CJS Modules

RedisSMQ packages ship with both ES Module (ESM) and CommonJS (CJS) builds. Use whichever module system your project requires.

## How the Package Resolves

`redis-smq`'s `package.json` exposes both builds through the `exports` map:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/cjs/index.d.ts",
        "default": "./dist/cjs/index.js"
      }
    }
  }
}
```

Node resolves `import` against the ESM build and `require` against the CJS build. The consumer does not need to configure anything — the correct build is selected based on which syntax the calling file uses.

Both builds expose the same public API. There is no difference in available methods, types, or runtime behavior — only the import syntax differs.

## ESM (ES Modules)

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});

const producer = RedisSMQ.createProducer();
await producer.run();

const msg = RedisSMQ.newProducibleMessage()
  .setQueue('orders')
  .setBody({ orderId: 123 });
await producer.produce(msg);
```

The example uses top-level `await`, which requires ESM. If your environment does not support it, wrap the calls in an `async` function and invoke it.

Use ESM when:

- Your project uses `"type": "module"` in `package.json`
- You're using modern bundlers (Vite, esbuild, Webpack 5+)
- You want static analysis and tree-shaking

## CJS (CommonJS)

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) return console.error(err);

    const producer = RedisSMQ.createProducer();
    producer.run((err) => {
      if (err) return console.error(err);

      const msg = RedisSMQ.newProducibleMessage()
        .setQueue('orders')
        .setBody({ orderId: 123 });

      producer.produce(msg, (err, ids) => {
        if (err) return console.error(err);
        console.log('Sent:', ids[0]);
      });
    });
  },
);
```

The example uses the callback form, which is the traditional CJS style. Every async method also supports promise form — the same `await`-based code shown above works in CJS via async functions, since Node's `.then()` machinery is not ESM-specific.

Use CJS when:

- Your project does not use `"type": "module"`
- You're using older Node.js versions or tooling
- You need synchronous `require()` for dynamic imports

## TypeScript

Both builds include their own type declarations, so TypeScript resolves the correct `.d.ts` file based on your `moduleResolution` setting:

- `"moduleResolution": "node16"` or `"nodenext"` — TypeScript reads the `exports` map and picks the right types for `import` vs `require`.
- `"moduleResolution": "node"` (the legacy resolver) — TypeScript falls back to the top-level `types` field, which points at the ESM build. This is fine for the vast majority of projects; use `"nodenext"` if you need the resolver to match Node's runtime behavior exactly.

Import syntax is the same regardless of build target:

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import type {
  IQueueParams,
  IMessageTransferable,
  IConsumerOptions,
} from 'redis-smq';

const consumer = RedisSMQ.createConsumer({ enableMultiplexing: true });
```

Type definitions are bundled with the package. No additional `@types/` packages needed.

## Peer Dependencies

`redis-smq` lists `redis-smq-common`, `ioredis`, and `@redis/client` as peer dependencies. Install at least one Redis client:

```bash
# With ioredis
npm install redis-smq redis-smq-common ioredis

# Or with @redis/client
npm install redis-smq redis-smq-common @redis/client
```

The Redis client is imported internally by `redis-smq-common` and selected via `ERedisConfigClient` when you call `RedisSMQ.initialize()`.

## Related

- [Installation](installation.md) — Package setup and Redis client selection
- [Quick Start](quick-start.md) — End-to-end example
- [Dual Callback & Promise Support](dual-callback-and-promise-support.md) — Choosing between the two API styles
