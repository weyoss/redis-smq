[RedisSMQ](../README.md) / [Docs](README.md) / Message Handler Worker Threads

# Message Handler Worker Threads

This is also known as "sandboxing" message handlers considering the fact that the message handler code runs from an isolated thread or process and does not affect neither the performance nor the functioning of the main application process.

All message handlers of a given consumer run from the same node.js process due to the JavaScript nature of being a single-threaded language.

That is great for all Input/Output asynchronous operations (reading data from database, sending network requests, etc.).

But if one or many of your message handlers perform mainly synchronous operations or run some CPU intensive tasks then they may block the rest of your message handlers. In other words, no javascript code from other handlers is executed until our CPU-bound/synchronous code finishes its work.

That would be a disaster for your overall application performance as the JavaScript isn't meant to do such kind of work.

## Using Worker Threads

RedisSMQ allows you to parallelize CPU intensive tasks and run them in an isolated thread from outside your main thread with the help of system threads which are based on [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html).

In fact each worker thread is a true OS thread, runs its own event-loop, and may be executed by a separate CPU core.

Running a message handler in a separate thread is really useful, as already mentioned above, for intensive computations but for performing regular I/O tasks it may not give you any profit.

### Running a Message Handler Worker Thread

#### Creating a Message Handler File

```typescript
// ./my/application/path/message-handlers/my-handler.js

module.exports = function myHandler(msg, cb) {
  console.log(msg.body);
  // Perform here any heavy operation
};
```

#### Consuming Messages

```typescript
const path = require('path');

const { Consumer } = require('redis-smq');

const consumer = new Consumer();
const messageHandlerFilename = path.resolve(
  __dirname,
  './my/application/path/message-handlers/my-handler.js',
);
consumer.consume('my_queue', messageHandlerFilename, (err) =>
  console.error(err),
);

consumer.run((err) => {
  if (err) console.error(err);
});
```

Please note that message handler filename should be always an absolute path.

If you are using TypeScript as your primary language you should create and save as usually your message handler file with a `.ts` extension. But when registering your message handler the `.ts` extension, in the message handler filename, should be replaced with a `.js` or `.cjs` extension depending on your TypeScript project settings.

See [Consumer.consume()](api/classes/Consumer.md#consume) for more details.
