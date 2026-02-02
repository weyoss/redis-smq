[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

A Producer sends messages to a queue or through an exchange. One Producer instance can send
messages—including priority, scheduled, or retry-enabled ones—to multiple destinations.

## Quick Start

### 1. Create and Start a Producer

```javascript
const { RedisSMQ } = require('redis-smq');

const producer = RedisSMQ.createProducer();

producer.run((err, started) => {
  if (err) console.error('Failed to start producer:', err);
  else console.log(`Producer ${producer.getId()} started: ${started}`);
});
```

### 2. Send a Message to a Queue

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ hello: 'world' }) // JSON payload
  .setQueue('test_queue'); // Target queue

producer.produce(msg, (err, messageIds) => {
  if (err) console.error('Send failed:', err);
  else console.log('Message ID:', messageIds[0]);
});
```

See [Direct Queue Publishing](message-exchanges.md#direct-to-queue-fastest) for more details.

### 3. Shutdown

```javascript
producer.shutdown(() => {
  console.log('Producer stopped');
});
```

## Message Destinations

You must set exactly one target on a message:

| Target Type     | Method                       | Routing Key? |
| --------------- | ---------------------------- | ------------ |
| Queue           | `.setQueue('name')`          | No           |
| Direct Exchange | `.setDirectExchange('name')` | Required     |
| Topic Exchange  | `.setTopicExchange('name')`  | Required     |
| Fanout Exchange | `.setFanoutExchange('name')` | Ignored      |

### Direct Exchange

```javascript
const msg = new ProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: '123' });
```

See [Direct Exchange](message-exchanges.md#1-direct-exchange) for more details.

### Topic Exchange

```javascript
const msg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 456 });
```

See [Topic Exchange](message-exchanges.md#2-topic-exchange) for more details.

### Fanout Exchange

```javascript
const msg = new ProducibleMessage()
  .setFanoutExchange('notifications')
  .setBody({ alert: 'System update' });
```

See [Fanout Exchange](message-exchanges.md#3-fanout-exchange) for more details.

## Message Options

Configure messages with optional settings using the [ProducibleMessage](api/classes/ProducibleMessage.md) class:

### Basic Configuration

```javascript
const msg = new ProducibleMessage()
  .setQueue('my_queue')
  .setBody({ userId: 123, action: 'process' })
  .setTTL(3600000) // Expire after 1 hour (0 = no expiration)
  .setPriority(EMessagePriority.HIGH) // Use only for priority queues
  .setConsumeTimeout(30000); // Fail if not processed within 30s
```

### Retry Behavior

```javascript
msg
  .setRetryThreshold(3) // Max retry attempts (0 = no retries)
  .setRetryDelay(5000); // Wait 5 seconds between retries
```

### Scheduled Delivery

```javascript
// Delayed delivery
msg.setScheduledDelay(10000); // Deliver after 10 seconds

// Recurring delivery with fixed interval
msg
  .setScheduledRepeat(5) // Repeat 5 times
  .setScheduledRepeatPeriod(60000); // Every 60 seconds

// CRON-based scheduling
msg.setScheduledCRON('0 0 10 * * *'); // Daily at 10 AM
```

### Priority Management

```javascript
msg.setPriority(EMessagePriority.HIGH); // Set priority level
msg.hasPriority(); // Check if priority is set
msg.disablePriority(); // Remove priority setting
```

Use `.setPriority()` with queues configured for priority handling.

---

For complete API details, see the [Producer Class documentation](api/classes/Producer.md).
