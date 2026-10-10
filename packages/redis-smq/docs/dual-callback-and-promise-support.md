[RedisSMQ](../README.md) / [Documentation](README.md) / Dual Callback & Promise Support

# Dual Callback & Promise Support

RedisSMQ supports both traditional Node.js callbacks and modern Promises/async-await. Every asynchronous method can be used either way.

## How It Works

Every async method follows the same pattern:

```
method(params, callback?) → Promise | void
```

- **With a callback** — executes with zero overhead, invokes the callback on completion
- **Without a callback** — returns a Promise, enabling `async/await` or `.then()` chains

Two guarantees hold for every method that follows the pattern:

- The callback is invoked **exactly once**, whether the operation succeeded or failed.
- On failure, the callback receives an `Error` as its first argument; on success, the first argument is `null` (or `undefined`).

## Callback Style

```javascript
const { RedisSMQ } = require('redis-smq');

RedisSMQ.initialize(redisConfig, (err) => {
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
});
```

## Promise Style

```javascript
import { RedisSMQ } from 'redis-smq';

try {
  await RedisSMQ.initialize(redisConfig);

  const producer = RedisSMQ.createProducer();
  await producer.run();

  const msg = RedisSMQ.newProducibleMessage()
    .setQueue('orders')
    .setBody({ orderId: 123 });

  const ids = await producer.produce(msg);
  console.log('Sent:', ids[0]);
} catch (err) {
  console.error(err);
}
```

## Mixing Styles

Callbacks and promises can be mixed freely, including within the same application and between different components of the same call chain. Omit the callback to get a promise, or provide one for callback style:

```javascript
// Promise style
const ids = await producer.produce(msg);

// Callback style
producer.produce(msg, (err, ids) => {
  // ...
});

// Both work identically on the same method
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

The same `Error` subclass reaches both forms — a `QueueNotFoundError` from the callback is the same class as a `QueueNotFoundError` caught from the promise form. Callers can discriminate on error class the same way regardless of which style they use.

## Performance Considerations

The callback API is the underlying implementation. The promise API is a thin wrapper that allocates a `Promise` and installs a resolve/reject pair before delegating to the callback form. For high-throughput scenarios where every microsecond counts, callbacks avoid that allocation. For most applications the difference is negligible — choose the style that fits your codebase.

## Async Methods by Component

Every method that involves I/O supports both styles. The list below groups them by the component that owns them.

### Lifecycle

- `RedisSMQ.initialize()`
- `RedisSMQ.shutdown()`

### Producers

- `RedisSMQ.startProducer()`
- `producer.run()` / `producer.shutdown()`
- `producer.produce()`

### Consumers

- `RedisSMQ.startConsumer()`
- `consumer.run()` / `consumer.shutdown()`
- `consumer.consume()`
- `consumer.cancel()`

### Queue Management

- `queueManager.save()` / `queueManager.delete()`
- `queueManager.exists()`
- `queueManager.getProperties()`
- `queueManager.getQueues()`
- `queueManager.getConsumers()` / `queueManager.getConsumerIds()`

### Message Management

- `messageManager.getMessageById()` / `messageManager.getMessagesByIds()`
- `messageManager.getMessageStatus()` / `messageManager.getMessageState()`
- `messageManager.deleteMessageById()` / `messageManager.deleteMessagesByIds()`
- `messageManager.requeueMessageById()`
- `messageManager.getMessageUnacknowledgementHistory()`

### Queue State

- `stateManager.getState()` / `stateManager.getStateHistory()`
- `stateManager.pause()` / `stateManager.resume()` / `stateManager.stop()`

### Rate Limiting

- `rateLimitManager.set()` / `rateLimitManager.clear()` / `rateLimitManager.get()`
- `rateLimitManager.hasExceeded()`

### Consumer Groups

- `consumerGroups.saveConsumerGroup()`
- `consumerGroups.deleteConsumerGroup()`
- `consumerGroups.getConsumerGroups()`

### Namespaces

- `namespaceManager.getNamespaces()`
- `namespaceManager.getNamespaceQueues()`
- `namespaceManager.delete()`

### Configuration

- `configManager.reload()`
- `configManager.updateConfig()`

(`configManager.getConfig()` and `configManager.getConfigVersion()` are synchronous — they read an in-memory snapshot with no I/O.)

### Exchanges

All exchange manager methods — `create`, `delete`, `bindQueue`, `unbindQueue`, `matchQueues`, `getBindings`, `getBindingQueues`, `getRoutingKeys`, `getRoutingPatterns`, `getBoundQueues`, `getProperties`, `exists`, `getAllExchanges`, `getNamespaceExchanges`, `getQueueExchanges` — and the equivalent methods on the three facades (`ExchangeDirect`, `ExchangeTopic`, `ExchangeFanout`) follow the same pattern.

### Message Browsers

All message-browser methods — `countMessages`, `getMessageIds`, `getMessages`, `purge`, `cancelPurge`, `getPurgeJob`, `getPurgeJobStatus` — support both styles.

### Queue Operation Validator

The static `QueueOperationValidator` methods (`canConsume`, `canProduce`, `canDelete`, `canPurge`, `canRequeue`, `canSetRateLimit`, `canClearRateLimit`, `canCreateConsumerGroup`, `canDeleteConsumerGroup`, `canBindExchange`, `canUnbindExchange`) each accept an optional callback and return a promise when omitted.

## Factory Methods and Synchronous Calls

Not every method is asynchronous. Factory methods — `RedisSMQ.createProducer()`, `RedisSMQ.createConsumer()`, `RedisSMQ.createQueueManager()`, `RedisSMQ.newProducibleMessage()`, and the rest — are synchronous and return their component immediately. They have no callback form.

Likewise, in-memory reads like `consumer.getQueues()`, `configManager.getConfig()`, and `configManager.getConfigVersion()` are synchronous: they consult state already held by the component rather than making a Redis round-trip.

The pattern described in this document applies specifically to methods that talk to Redis.

## Related

- [ESM & CJS Modules](esm-cjs-modules.md) — Import styles for both module systems
- [Consuming Messages](consuming-messages.md) — Handler function styles (callback, promise, module path)
- [Producing Messages](producing-messages.md) — Publishing messages in either style
