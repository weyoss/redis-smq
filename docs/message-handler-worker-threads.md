[RedisSMQ](../README.md) / [Docs](README.md) / Message Handler Worker Threads

# Message Handler Worker Threads

Message handler worker threads, also known as "sandboxing," are a technique that isolates message handler code from the 
main application process. This isolation ensures that the message handler code does not affect the performance or 
functionality of the main application process.

In Node.js, all message handlers of a given consumer run from the same process due to JavaScript's single-threaded 
nature. While this is beneficial for Input/Output asynchronous operations, such as reading data from the database or 
sending network requests, it can become a bottleneck when message handlers perform mostly synchronous operations or 
CPU-intensive tasks. 

## Using Worker Threads

RedisSMQ allows you to utilize system threads to parallelize CPU-intensive tasks and run them in an isolated thread 
outside the main thread. This is achieved through the use of Node.js Worker Threads, which provide a true 
multithreaded environment with each worker thread running its own event loop.

Each worker thread can be executed by a separate CPU core, making it ideal for intensive computations. However, for 
regular I/O tasks, running a message handler in a separate thread may not provide any significant benefits.

### Running a Message Handler Worker Thread

#### Creating a Message Handler File

```typescript
// ./my/application/path/message-handlers/my-handler.js

/**
 * Message handler function.
 *
 * This function is the entry point for a message handler.
 * It should contain the code that processes the message.
 *
 * @param {Object} msg - The message object.
 * @param {Function} cb - The callback function.
 */
module.exports = function myHandler(msg, cb) {
  console.log(msg.body);
  // Perform any heavy operation here
};
```

#### Consuming Messages

```typescript
const path = require('path');

const { Consumer } = require('redis-smq');

/**
 * Creates a new consumer instance.
 */
const consumer = new Consumer();

/**
 * Registers a message handler.
 *
 * The message handler file path should be an absolute path.
 *
 * If you're using TypeScript, create and save the message handler file with a `.ts` extension.
 * However, when registering the message handler, use a `.js` or `.cjs` extension depending on your project settings.
 */
const messageHandlerFilename = path.resolve(__dirname, './my/application/path/message-handlers/my-handler.js');
consumer.consume('my_queue', messageHandlerFilename, (err) => console.error(err));

/**
 * Starts the consumer.
 *
 * Calls the callback function with any errors that occur.
 */
consumer.run((err) => {
  if (err) console.error(err);
});
```

##### Note

When registering a message handler, the file path should always be an absolute path. If you are using TypeScript, make 
sure to use the correct file extension (.ts, .js, or .cjs) depending on your project settings. See the 
[Consumer.consume()](api/classes/Consumer.md#consume) documentation for more details.

### Example Use Case

Here's an example use case where we have a message handler that performs a CPU-intensive task:

```javascript
// ./my/application/path/message-handlers/my-cpu-intensive-handler.ts

// Perform a CPU-intensive task
function performCpuIntensiveTask() {
  // Simulate a CPU-intensive task
  for (let i = 0; i < 10000000; i++) {
    console.log(i);
  }
}

module.exports = function myCpuIntensiveHandler(msg, cb) {
  console.log('Starting CPU-intensive task');
  performCpuIntensiveTask();
  console.log('CPU-intensive task completed');
  cb();
};
```

```javascript
// ./my/application/index.ts

const Consumer = require('redis-smq');

const consumer = new Consumer();
const messageHandlerFilename = require.resolve('./message-handlers/my-cpu-intensive-handler.js');
consumer.consume('my_queue', messageHandlerFilename, (err) => console.error(err));
consumer.run((err) => {
  if (err) console.error(err);
});
```

In this example, we have a message handler that performs a CPU-intensive task. We create a worker thread for this 
message handler using RedisSMQ, which allows it to run in parallel with the main thread. This helps to improve the 
overall performance of our application.