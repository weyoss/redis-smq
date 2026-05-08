# Dual Callback & Promise Support

RedisSMQ supports both traditional Node.js callbacks and modern Promises/async-await. Every asynchronous method can be used either way.

## How It Works

Every async method follows this pattern:

```
method(params, callback?) → Promise | void
```

- **With a callback** — executes with zero overhead, invokes the callback on completion
- **Without a callback** — returns a Promise, enabling `async/await` or `.then()` chains

## Callback Style

```javascript
const { RedisSMQ, ProducibleMessage } = require('redis-smq');

RedisSMQ.initialize(redisConfig, (err) => {
  if (err) return console.error(err);

  const producer = RedisSMQ.createProducer();
  producer.run((err) => {
    if (err) return console.error(err);

    const msg = new ProducibleMessage()
      .setQueue('orders')
      .setBody({ orderId: 123 });

    producer.produce(msg, (err, ids) => {
      if (err) return console.error(err);
      console.log('Sent:', ids[0]);
    });
  });
});
```

## Promise Style

```javascript
import { RedisSMQ, ProducibleMessage } from 'redis-smq';

try {
  await RedisSMQ.initialize(redisConfig);

  const producer = RedisSMQ.createProducer();
  await producer.run();

  const msg = new ProducibleMessage()
    .setQueue('orders')
    .setBody({ orderId: 123 });

  const ids = await producer.produce(msg);
  console.log('Sent:', ids[0]);
} catch (err) {
  console.error(err);
}
```

## Mixing Styles

Callbacks and promises can be mixed freely. Omit the callback to get a promise, or provide one for callback style:

```javascript
// Promise style
const ids = await producer.produce(msg);

// Callback style
producer.produce(msg, (err, ids) => {
  // ...
});

// Both work identically
```

## Error Handling

### Callback Style

Errors are passed as the first argument to the callback:

```javascript
producer.produce(msg, (err, ids) => {
  if (err) {
    console.error('Failed:', err);
    return;
  }
  console.log('Success:', ids);
});
```

### Promise Style

Errors are thrown and can be caught with `try/catch` or `.catch()`:

```javascript
try {
  const ids = await producer.produce(msg);
} catch (err) {
  console.error('Failed:', err);
}
```

## Performance Considerations

The callback API is the underlying implementation. The promise API is a thin wrapper that adds minimal overhead. For high-throughput scenarios where every microsecond counts, callbacks avoid the additional promise allocation. For most applications, the difference is negligible — choose the style that fits your codebase.

## All Async Methods

Every method that involves I/O supports both styles:

- `RedisSMQ.initialize()`
- `RedisSMQ.shutdown()`
- `producer.run()` / `producer.shutdown()` / `producer.produce()`
- `consumer.run()` / `consumer.shutdown()` / `consumer.consume()` / `consumer.cancel()`
- `queueManager.save()` / `queueManager.delete()` / `queueManager.exists()`
- `messageManager.getMessageById()` / `messageManager.deleteMessageById()`
- All exchange, rate limit, state manager, and consumer group methods

The pattern is consistent across the entire API.
