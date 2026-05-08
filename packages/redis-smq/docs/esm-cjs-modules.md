# ESM & CJS Modules

RedisSMQ packages are available in both ES Module (ESM) and CommonJS (CJS) formats. Use whichever module system your project requires.

## ESM (ES Modules)

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { ProducibleMessage } from 'redis-smq';

await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});
```

Use ESM when:

- Your project uses `"type": "module"` in `package.json`
- You're using modern bundlers (Vite, esbuild, Webpack 5+)
- You want static analysis and tree-shaking

## CJS (CommonJS)

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');
const { ProducibleMessage } = require('redis-smq');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    // ...
  },
);
```

Use CJS when:

- Your project does not use `"type": "module"`
- You're using older Node.js versions or tooling
- You need synchronous `require()` for dynamic imports

## TypeScript

Both ESM and CJS work with TypeScript. Import syntax is the same for both:

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { ProducibleMessage } from 'redis-smq';
import type { IQueueParams, IMessageTransferable } from 'redis-smq';
```

Type definitions are included in the package. No additional `@types/` packages needed.

## Package Exports

Each package exports the same API regardless of module format. There is no difference in functionality or available methods — only the import syntax differs.
