[RedisSMQ](../README.md) / [Documentation](README.md) / Message Handler Worker Threads

# Message Handler Worker Threads

Run CPU-intensive message handlers in separate Node.js worker threads to keep the main event loop responsive.

## When to Use Worker Threads

|               | Main Thread Handler     | Worker Thread Handler              |
| ------------- | ----------------------- | ---------------------------------- |
| **CPU tasks** | Blocks event loop       | Runs in separate thread            |
| **I/O tasks** | Fine (async)            | No benefit                         |
| **Use when**  | Simple, fast processing | Heavy calculations, CPU-bound work |

Worker threads only help with CPU-bound work. For I/O-bound tasks (database queries, API calls, file reads), use regular async handlers in the main thread.

## Setup

### 1. Create the Handler File

The handler file must export a function as its **default export**. It can be written as ESM (`.js` in a `"type": "module"` project) or CJS (`.cjs`, or `.js` in a project without `"type": "module"`). The validator accepts only the extensions `.js` and `.cjs`.

**ESM (`handlers/image-processor.js`, in a `"type": "module"` project):**

```javascript
// handlers/image-processor.js
export default function imageProcessor(message, done) {
  // CPU-intensive work here
  const result = heavyCalculation(message.body);
  done(); // Acknowledge
}

function heavyCalculation(data) {
  // Example: image processing, data transformation, etc.
  let total = 0;
  for (let i = 0; i < 10000000; i++) {
    total += Math.sqrt(i);
  }
  return total;
}
```

**CJS (`handlers/image-processor.cjs`):**

```javascript
// handlers/image-processor.cjs
module.exports = function imageProcessor(message, done) {
  const result = heavyCalculation(message.body);
  done();
};
```

A file with no default export — for example, one that only defines named functions — is loaded successfully but fails on the first message with cause `UNACKNOWLEDGED`, which flows through the normal retry or dead-letter resolution.

The handler can also be written in promise style:

```javascript
// handlers/data-processor.js
export default async function dataProcessor(message) {
  // async function; returning = ack, throwing = unack
  const result = await heavyAsyncCalculation(message.body);
}
```

### 2. Register the Handler

Provide the absolute path to the handler file:

```javascript
const path = require('path');
const { RedisSMQ } = require('redis-smq');

const consumer = RedisSMQ.createConsumer();

const handlerPath = path.resolve(__dirname, 'handlers/image-processor.js');

await consumer.consume('image-queue', handlerPath);
await consumer.run();
```

The worker is created lazily — the first time a message is delivered to this handler, the file is imported into a dedicated worker thread. Subsequent messages reuse the same worker.

## File Requirements

- **Absolute path** — use `path.resolve(__dirname, ...)` or `import.meta.url`-based resolution, not a relative path
- **Default export** — the file must export a function as its default export
- **Extension** — `.js` or `.cjs` only; any other extension rejects at registration with `MessageHandlerFilenameExtensionError`
- **Existence** — the file must exist at registration time or `consume` rejects with `MessageHandlerFileError`
- **Handler signature** — the exported function receives `(message, done)`; it can also be `(message) => Promise<void>` or `async (message) => void`

The file is **not** parsed for its exports at registration time — only its extension and existence are checked. A `.js` file that exists but has no default export will register successfully and fail on the first delivery.

## TypeScript Handlers

TypeScript handler files must be compiled to JavaScript before use:

```typescript
// handlers/data-processor.ts
import type { IMessageTransferable, ICallback } from 'redis-smq';

export default function dataProcessor(
  message: IMessageTransferable,
  done: ICallback,
) {
  const processed = processData(message.body);
  done();
}
```

Register the compiled `.js` file:

```javascript
const handlerPath = path.resolve(__dirname, 'dist/handlers/data-processor.js');
await consumer.consume('data-queue', handlerPath);
```

## Multiple Worker Threads

Each registered handler with a file path gets its own worker. Multiple queues each with their own file path run in separate workers:

```javascript
const path = require('path');

// CPU-intensive queue — dedicated worker
await consumer.consume(
  'image-processing',
  path.resolve(__dirname, 'handlers/image-processor.js'),
);

// Another CPU-intensive queue — separate worker
await consumer.consume(
  'data-analysis',
  path.resolve(__dirname, 'handlers/data-analyzer.js'),
);

// I/O queue — main thread (no worker needed)
await consumer.consume('email-sending', async (message) => {
  await sendEmail(message.body);
});
```

Workers are per registration, not per queue name. Registering the same file path for two queues creates two independent workers, each with its own module instance.

## Performance

Worker threads add overhead for:

- **Thread creation** — one worker per registered file path, created lazily on first delivery
- **Message serialization** — the `IMessageTransferable` is structured-cloned between threads on every call
- **Scheduling** — the event loop manages thread communication, including the round-trip per message

Only use worker threads when the CPU work outweighs this overhead. For handlers that finish in a few milliseconds, the main thread is faster.

## Error Handling

When a worker handler fails, the outcome is one of:

- **Handler throws or calls `done(err)`** — the message is unacknowledged with cause `UNACKNOWLEDGED` and flows through the normal pipeline: retried, delayed, or dead-lettered according to its retry policy.
- **The worker module crashes on load** (uncaught throw at import time, process exit during load) — the message is unacknowledged with cause `UNACKNOWLEDGED` and flows through the same pipeline.

Handle errors within your handler to control retry behavior:

```javascript
// handlers/safe-processor.cjs
module.exports = function handler(message, done) {
  try {
    const result = processData(message.body);
    done(); // Success
  } catch (err) {
    done(err); // Failure — triggers retry or dead-letter
  }
};
```

A handler that throws **after** calling `done()` has already settled the outcome; the throw is discarded, matching the main-thread handler contract.

## Best Practices

- **Isolate CPU work** — keep worker handlers focused on computation
- **Avoid large payloads** — the message body is structured-cloned per call; keep bodies small
- **Use the main thread for I/O** — database calls, HTTP requests, and file operations are async and don't need workers
- **Monitor memory** — each worker is a separate Node.js instance with its own heap
- **Remember the extension rule** — a `.ts` path or an extensionless path rejects at `consume()` time

## Related

- [Consuming Messages](consuming-messages.md) — Handler function styles
- [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) — Failure resolution pipeline
