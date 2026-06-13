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
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ hello: 'world' })
  .setQueue('orders');

producer.produce(msg, (err, messageIds) => {
  if (err) console.error('Send failed:', err);
  else console.log('Message ID:', messageIds[0]);
});
```

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
| `setFanoutExchange(name)` | Fanout exchange | Ignored     |

### Direct to Queue (Fastest)

```javascript
const msg = new ProducibleMessage()
  .setQueue('orders')
  .setBody({ orderId: 123 });
```

No routing key needed. The message goes directly to the named queue.

### Direct Exchange

```javascript
const msg = new ProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 123 });
```

Routes to queues bound with the exact routing key `"order.created"`.

### Topic Exchange

```javascript
const msg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 456 });
```

Routes to queues whose binding patterns match `"user.created"`.

### Fanout Exchange

```javascript
const msg = new ProducibleMessage()
  .setFanoutExchange('notifications')
  .setBody({ alert: 'System update' });
```

Broadcasts to all queues bound to the exchange. Routing key is ignored.

## Message Configuration

### Basic Options

```javascript
const msg = new ProducibleMessage()
  .setQueue('orders')
  .setBody({ userId: 123 })
  .setTTL(3600000) // Expire after 1 hour (0 = never)
  .setConsumeTimeout(30000); // Fail if not processed in 30 seconds
```

### Priority

```javascript
const msg = new ProducibleMessage()
  .setQueue('alerts')
  .setPriority(EMessagePriority.HIGH) // 0–7, lower = higher priority
  .setBody({ alert: 'Urgent' });

// Check and remove priority
msg.hasPriority(); // true
msg.disablePriority(); // Removes priority setting
```

Only effective for priority queues.

### Retry Policy

```javascript
const msg = new ProducibleMessage()
  .setQueue('payments')
  .setBody({ amount: 99.99 })
  .setRetryThreshold(3) // Max 3 retries before dead-letter
  .setRetryDelay(5000); // Wait 5 seconds between retries
```

### Scheduled Delivery

```javascript
// One-time delay
msg.setScheduledDelay(10000); // Deliver after 10 seconds

// CRON schedule
msg.setScheduledCRON('0 0 10 * * *'); // Daily at 10 AM

// Repeating
msg.setScheduledDelay(5000); // First after 5 seconds
msg.setScheduledRepeat(5); // Repeat 5 times
msg.setScheduledRepeatPeriod(60000); // Every 60 seconds

// Clear all scheduling
msg.resetScheduledParams();
```

## Managing the Producer

### Check Status

```javascript
console.log('Producer ID:', producer.getId());
console.log('Is running:', producer.isRunning());
```

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
producer.produce(msg, (err, messageIds) => {
  if (err) {
    if (err.message.includes('No matching queues')) {
      console.log('No queues bound to this routing key');
    } else if (err.message.includes('not found')) {
      console.log('Queue does not exist');
    } else {
      console.error('Unexpected error:', err);
    }
    return;
  }
  console.log('Sent:', messageIds);
});
```

### Promise Style

```javascript
try {
  const ids = await producer.produce(msg);
  console.log('Sent:', ids);
} catch (err) {
  console.error('Failed:', err.message);
}
```

## Common Errors

| Error                    | Cause                                               |
| ------------------------ | --------------------------------------------------- |
| `QUEUE_NOT_FOUND`        | Queue does not exist                                |
| `QUEUE_STOPPED`          | Queue is stopped, not accepting messages            |
| `QUEUE_LOCKED`           | Queue is locked for maintenance                     |
| `EXCHANGE_NOT_FOUND`     | Exchange does not exist                             |
| `NO_MATCHING_QUEUES`     | No queues bound to the routing key/pattern          |
| `ROUTING_KEY_REQUIRED`   | Direct or topic exchange used without a routing key |
| `MESSAGE_ALREADY_EXISTS` | Duplicate message ID                                |
| `PRIORITY_REQUIRED`      | Priority queue requires a priority on the message   |
| `RATE_LIMIT_EXCEEDED`    | Queue's rate limit has been reached                 |

## Best Practices

- **Use direct-to-queue for simple cases** — faster than exchanges
- **Set TTL** to prevent stale messages from accumulating
- **Configure retries** for transient failures
- **Handle errors gracefully** — check error types and respond appropriately
- **Reuse producers** — create one producer and use it for multiple messages
- **Shut down** producers when no longer needed
