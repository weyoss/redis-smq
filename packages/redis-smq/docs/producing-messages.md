[RedisSMQ](../README.md) / [Documentation](README.md) / Producing Messages

# Producing Messages

A Producer sends messages to a queue or through an exchange. One producer can send messages to multiple destinations.

## Quick Start

### 1. Create and Start a Producer

```javascript
const { RedisSMQ } = require('redis-smq');

const producer = RedisSMQ.createProducer();

producer.run((err) => {
  if (err) console.error('Failed to start producer:', err);
  else console.log('Producer started');
});
```

### 2. Send a Message

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setBody({ hello: 'world' })
  .setQueue('orders');

producer.produce(msg, (err, messageIds) => {
  if (err) console.error('Send failed:', err);
  else console.log('Message ID:', messageIds[0]);
});
```

`produce` resolves with an array of message IDs — one per destination queue, multiplied by the number of consumer groups for Pub/Sub destinations. A single call can produce more than one ID.

### 3. Shutdown

```javascript
producer.shutdown((err) => {
  if (err) console.error('Shutdown failed:', err);
});
```

## Message Destinations

Every message must have exactly one destination:

| Method                    | Destination     | Routing Key |
| ------------------------- | --------------- | ----------- |
| `setQueue(name)`          | Direct to queue | Not needed  |
| `setDirectExchange(name)` | Direct exchange | Required    |
| `setTopicExchange(name)`  | Topic exchange  | Required    |
| `setFanoutExchange(name)` | Fanout exchange | Forbidden   |

Setting a queue clears any previously set exchange (and its routing key), and vice versa. A message with no destination rejects at `produce` time with `MessageExchangeRequiredError`.

### Direct to Queue (Fastest)

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('orders')
  .setBody({ orderId: 123 });
```

No routing key needed. The message goes directly to the named queue. This path skips exchange matching, so `produce` resolves as soon as the message is enqueued.

### Direct Exchange

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 123 });
```

Routes to queues bound with the exact routing key `"order.created"`. Routing keys are lowercased before matching — `"Order.Created"` and `"order.created"` are the same key.

### Topic Exchange

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 456 });
```

Routes to queues whose binding patterns match `"user.created"`. Patterns are case-sensitive.

### Fanout Exchange

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setFanoutExchange('notifications')
  .setBody({ alert: 'System update' });
```

Broadcasts to all queues bound to the exchange. The routing key is ignored; supplying one rejects with `InvalidFanoutExchangeParametersError` at `produce` time.

## Message Configuration

### Basic Options

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('orders')
  .setBody({ userId: 123 })
  .setTTL(3600000) // Expire after 1 hour (0 = never)
  .setConsumeTimeout(30000); // Fail if not processed in 30 seconds
```

### Priority

```javascript
const { EMessagePriority } = require('redis-smq');

const msg = RedisSMQ.newProducibleMessage()
  .setQueue('alerts')
  .setPriority(EMessagePriority.HIGH) // 0–7, lower = higher priority
  .setBody({ alert: 'Urgent' });

// Check and remove priority
msg.hasPriority(); // true
msg.disablePriority(); // Removes priority setting
```

Priority is only meaningful for priority queues. Producing a message with a priority to a FIFO or LIFO queue rejects with `PriorityQueuingNotEnabledError`; producing without a priority to a priority queue rejects with `MessagePriorityRequiredError`.

### Retry Policy

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('payments')
  .setBody({ amount: 99.99 })
  .setRetryThreshold(3) // Max 3 processing attempts before dead-letter
  .setRetryDelay(5000); // Wait 5 seconds between retries
```

A `retryDelay` of `0` requeues failed messages immediately. A positive value places them in the delayed set for the configured interval before retrying.

### Scheduled Delivery

```javascript
// One-time delay
msg.setScheduledDelay(10000); // Deliver after 10 seconds

// CRON schedule — 5-field (seconds assumed 0) or 6-field (explicit seconds)
msg.setScheduledCRON('30 9 * * 1-5'); // Weekdays at 9:30:00 AM
msg.setScheduledCRON('0 30 9 * * 1-5'); // Same, 6-field form

// Repeating
msg.setScheduledDelay(5000); // First after 5 seconds
msg.setScheduledRepeat(5); // Repeat 5 times
msg.setScheduledRepeatPeriod(60000); // Every 60 seconds

// Clear all scheduling
msg.resetScheduledParams();
```

See [Scheduling Messages](scheduling-messages.md) for the full set of scheduling interactions.

## Managing the Producer

### Check Status

```javascript
console.log('Producer ID:', producer.getId());
console.log('Is running:', producer.isRunning());
```

Both methods are synchronous — they read in-memory state without a Redis round-trip.

### Shutdown

```javascript
producer.shutdown((err) => {
  if (err) console.error('Shutdown failed:', err);
});

// Or use system shutdown for all components
RedisSMQ.shutdown(callback);
```

## Error Handling

### Callback Style

```javascript
const { NoMatchingQueuesError, QueueNotFoundError, ExchangeNotFoundError } =
  require('redis-smq').errors;

producer.produce(msg, (err, messageIds) => {
  if (err instanceof NoMatchingQueuesError) {
    console.log('No queues bound to this routing key');
  } else if (err instanceof ExchangeNotFoundError) {
    console.log('The exchange does not exist');
  } else if (err instanceof QueueNotFoundError) {
    console.log('The target queue does not exist');
  } else if (err) {
    console.error('Unexpected error:', err);
  } else {
    console.log('Sent:', messageIds);
  }
});
```

Error classes are exposed under `redis-smq`'s `errors` namespace. Discriminating by class is more reliable than inspecting `err.message` — the message strings are documentation, the classes are the contract.

### Promise Style

```javascript
const { errors } = require('redis-smq');

try {
  const ids = await producer.produce(msg);
  console.log('Sent:', ids);
} catch (err) {
  if (err instanceof errors.ExchangeNotFoundError) {
    console.error('Exchange does not exist');
  } else {
    console.error('Failed:', err.message);
  }
}
```

The same error class reaches both forms; the `instanceof` check is the same regardless of which style you use.

## Common Errors

Errors are grouped by the phase in which they're raised.

### Producer state

| Error class               | Cause                                                      |
| ------------------------- | ---------------------------------------------------------- |
| `ProducerNotRunningError` | `run()` was never called, or the producer shut down.       |
| `PanicError`              | The producer's Pub/Sub target resolver is not operational. |

### Message configuration

| Error class                            | Cause                                                              |
| -------------------------------------- | ------------------------------------------------------------------ |
| `MessageExchangeRequiredError`         | The message has neither a queue nor an exchange.                   |
| `RoutingKeyRequiredError`              | A direct or topic exchange was used without a routing key.         |
| `PriorityQueuingNotEnabledError`       | A priority was set on a message destined for a FIFO/LIFO queue.    |
| `MessagePriorityRequiredError`         | A message destined for a priority queue has no priority.           |
| `InvalidFanoutExchangeParametersError` | A routing key was set on a message destined for a fanout exchange. |

### Destination

| Error class                     | Cause                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| `ExchangeNotFoundError`         | The target exchange does not exist.                          |
| `QueueNotFoundError`            | The target queue does not exist.                             |
| `NoMatchingQueuesError`         | The exchange exists but resolved to zero destination queues. |
| `QueueHasNoConsumerGroupsError` | A Pub/Sub queue has no consumer groups to deliver to.        |

### Queue state

| Error class              | Cause                                         |
| ------------------------ | --------------------------------------------- |
| `QueueStoppedError`      | The target queue is STOPPED.                  |
| `QueueLockedError`       | The target queue is LOCKED.                   |
| `InvalidQueueStateError` | The target queue is in an unrecognized state. |

### Message collision

| Error class                 | Cause                                      |
| --------------------------- | ------------------------------------------ |
| `MessageAlreadyExistsError` | A message with the same ID already exists. |

## Best Practices

- **Use direct-to-queue for simple cases** — it skips exchange matching and is measurably faster
- **Set TTL** to prevent stale messages from accumulating on queues that drain slowly
- **Configure retries** for transient failures — a `retryThreshold > 0` gives the handler more than one attempt
- **Discriminate errors by class** — `instanceof` checks on the exported error classes are the stable contract
- **Reuse producers** — create one producer and use it for multiple messages; the producer holds a shared connection and a Pub/Sub resolver cache
- **Shut down when done** — call `producer.shutdown()` or `RedisSMQ.shutdown()` to release the connection
