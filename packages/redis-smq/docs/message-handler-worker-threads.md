[RedisSMQ](../README.md) / [Docs](README.md) / Message Handler Worker Threads

# Message Handler Worker Threads

Run CPU-heavy message handlers in separate threads to keep your main app responsive.

## Why Use Worker Threads?

|               | Main Thread Handler | Worker Thread Handler   |
| ------------- | ------------------- | ----------------------- |
| **CPU Tasks** | Blocks main thread  | Runs in separate thread |
| **I/O Tasks** | Fine (async)        | No benefit              |
| **Use When**  | Simple processing   | Heavy calculations      |

## Quick Start

### 1. Create Your Handler File

```javascript
// handlers/image-processor.js
module.exports = function imageProcessor(msg, done) {
  console.log('Processing:', msg.body);

  // CPU-intensive work here (won't block main thread)
  const result = heavyCalculation(msg.body);

  done(); // Acknowledge
};

function heavyCalculation(data) {
  // Example: image processing, data analysis, etc.
  let total = 0;
  for (let i = 0; i < 10000000; i++) {
    total += Math.sqrt(i);
  }
  return total;
}
```

### 2. Use the Handler

```javascript
const path = require('path');
const { RedisSMQ } = require('redis-smq');

const consumer = RedisSMQ.createConsumer();

// Provide ABSOLUTE path to handler
const handlerPath = path.resolve(__dirname, 'handlers/image-processor.js');

consumer.consume('image-queue', handlerPath, (err) => {
  if (err) console.error('Failed to register:', err);
  else console.log('Handler registered in worker thread');
});

consumer.run((err) => {
  if (err) console.error('Failed to start:', err);
  else console.log('Consumer running');
});
```

## When to Use Worker Threads

### ✅ Good for CPU Tasks:

- Image/video processing
- Data analysis
- Complex calculations
- PDF generation
- Machine learning inference

### ⚠️ Not Needed for I/O Tasks:

- Database queries
- API calls
- File reading/writing
- Network requests

## File Requirements

### Path Must Be Absolute

```javascript
// ✅ Correct
path.resolve(__dirname, 'handlers/my-handler.js');

// ❌ Wrong (relative path)
('./handlers/my-handler.js');
```

### File Extension

- Use `.js` or `.cjs` for JavaScript
- Use `.ts` for TypeScript (transpile first)
- Must export a function: `module.exports = function(msg, done) {...}`

## TypeScript Support

### Handler File (.ts)

```typescript
// handlers/data-processor.ts
export default function dataProcessor(
  msg: IMessageTransferable,
  done: ICallback,
) {
  console.log('Processing TypeScript handler:', msg.body);

  // Your TypeScript code here
  const processed = processData(msg.body);

  done();
}

function processData(data: any) {
  // Type-safe processing
  return data;
}
```

### Registering TypeScript Handlers

```javascript
// Your main app (.js or .ts)
const handlerPath = path.resolve(
  __dirname,
  'handlers/data-processor.js', // Use .js even if source is .ts
);

consumer.consume('data-queue', handlerPath, callback);
```

**Note**: TypeScript files must be compiled to JavaScript before running.

## Performance Tips

### Keep Worker Threads Light

```javascript
// ✅ Good - CPU work stays in worker
module.exports = function handler(msg, done) {
  const result = calculate(msg.data); // CPU work
  done();
};

// ❌ Avoid - Moving data between threads is expensive
module.exports = function handler(msg, done) {
  // Large data transfer between threads
  const hugeData = fetchHugeData(); // I/O - do in main thread instead
  process(hugeData);
  done();
};
```

### Use Multiple Handlers for Different Queues

```javascript
// CPU-intensive queue uses worker thread
consumer.consume(
  'cpu-queue',
  path.resolve(__dirname, 'handlers/cpu-worker.js'),
  callback,
);

// I/O queue uses regular handler
consumer.consume(
  'io-queue',
  (msg, done) => {
    // Async I/O is fine in main thread
    database.query(msg.body).then(() => done());
  },
  callback,
);
```

## Example: Image Processing Service

### Handler (worker thread)

```javascript
// handlers/resize-image.js
const sharp = require('sharp');

module.exports = function resizeImage(msg, done) {
  const { imagePath, width, height } = msg.body;

  // CPU-intensive image processing
  sharp(imagePath)
    .resize(width, height)
    .toBuffer()
    .then((output) => {
      // Store result or send elsewhere
      done();
    })
    .catch((err) => {
      done(err); // Will trigger retry
    });
};
```

### Main Application

```javascript
const consumer = RedisSMQ.createConsumer();

consumer.consume(
  'image-resize',
  path.resolve(__dirname, 'handlers/resize-image.js'),
  (err) => {
    if (err) console.error('Image handler failed:', err);
  },
);

consumer.run((err) => {
  if (err) console.error('Consumer failed:', err);
  else console.log('Image processor ready');
});
```

## Common Issues

### "Handler not found"

- Ensure absolute path
- Check file exists
- Verify file exports a default function

### "Worker thread crashing"

- Handle errors in handler: `try/catch`
- Don't block event loop in worker
- Keep message payloads reasonable size

### "No performance improvement"

- Worker threads only help with CPU work
- For I/O, use async/await or callbacks in main thread
- Consider if task is truly CPU-bound

---

**Related**:

- [Consumer API](api/classes/Consumer.md) - `consume()` method details
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html) - Official documentation
- [Consuming Messages](consuming-messages.md) - Basic message handling
