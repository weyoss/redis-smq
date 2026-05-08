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

The handler is a standalone file that exports a function:

```javascript
// handlers/image-processor.js
module.exports = function imageProcessor(message, done) {
  // CPU-intensive work here
  const result = heavyCalculation(message.body);
  done(); // Acknowledge
};

function heavyCalculation(data) {
  // Example: image processing, data transformation, etc.
  let total = 0;
  for (let i = 0; i < 10000000; i++) {
    total += Math.sqrt(i);
  }
  return total;
}
```

### 2. Register the Handler

Provide the absolute path to the handler file:

```javascript
const path = require('path');
const { RedisSMQ } = require('redis-smq');

const consumer = RedisSMQ.createConsumer();

const handlerPath = path.resolve(__dirname, 'handlers/image-processor.js');

consumer.consume('image-queue', handlerPath, (err) => {
  if (err) console.error('Failed to register:', err);
  else console.log('Handler registered in worker thread');
});

consumer.run((err) => {
  if (err) console.error('Failed to start:', err);
});
```

## File Requirements

- **Path must be absolute** — use `path.resolve()`, not relative paths
- **Must export a function** — `module.exports = function(message, done) { ... }`
- **Handler signature** — `function(message, done)` where `message` is the message object and `done` is the acknowledgment callback

## TypeScript Handlers

TypeScript handler files must be compiled to JavaScript before use:

```typescript
// handlers/data-processor.ts
import { IMessageTransferable, ICallback } from 'redis-smq';

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
const handlerPath = path.resolve(__dirname, 'handlers/data-processor.js');
consumer.consume('data-queue', handlerPath, callback);
```

## Multiple Worker Threads

Each handler registered with a file path runs in its own worker thread. Multiple queues can each have their own worker thread:

```javascript
// CPU-intensive queue — worker thread
consumer.consume(
  'image-processing',
  path.resolve(__dirname, 'handlers/image-processor.js'),
  callback,
);

// Another CPU-intensive queue — separate worker thread
consumer.consume(
  'data-analysis',
  path.resolve(__dirname, 'handlers/data-analyzer.js'),
  callback,
);

// I/O queue — main thread (no worker needed)
consumer.consume(
  'email-sending',
  async (message, done) => {
    await sendEmail(message.body);
    done();
  },
  callback,
);
```

## Performance

Worker threads add overhead for:

- **Thread creation** — each worker is a separate Node.js instance
- **Message serialization** — data is copied between threads
- **Scheduling** — the event loop manages thread communication

Only use worker threads when the CPU work outweighs this overhead. For simple handlers, the main thread is faster.

## Error Handling

If a worker thread throws an unhandled error:

- The message is unacknowledged (triggers retry or dead-letter)
- The error is logged
- The worker continues processing subsequent messages

Handle errors within your handler to control retry behavior:

```javascript
module.exports = function handler(message, done) {
  try {
    const result = processData(message.body);
    done(); // Success
  } catch (err) {
    done(err); // Failure — triggers retry
  }
};
```

## Best Practices

- **Isolate CPU work** — Keep worker handlers focused on computation
- **Avoid large data transfers** — Keep message bodies small; data passed between threads is copied
- **Use main thread for I/O** — Database calls, HTTP requests, and file operations are async and don't need workers
- **Monitor memory** — Each worker is a separate Node.js instance with its own memory
