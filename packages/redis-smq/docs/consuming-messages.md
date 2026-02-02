[RedisSMQ](../README.md) / [Docs](README.md) / Consuming Messages

# Consuming Messages

A Consumer processes messages from queues. You provide a handler function to process each message and must explicitly
acknowledge or reject it.

## Quick Start

### 1. Create and Start a Consumer

```javascript
const { RedisSMQ } = require('redis-smq');
const consumer = RedisSMQ.createConsumer();

// Start the consumer
consumer.run((err, started) => {
  if (err) console.error('Start failed:', err);
  else console.log('Consumer is running: ', started);
});
```

### 2. Consume a Queue

```javascript
// Define a message handler
const handler = (msg, done) => {
  console.log('Processing:', msg.body);
  // Your business logic here

  // Acknowledge success
  done();

  // Or reject with error (triggers retry)
  // done(new Error('Processing failed'));
};

// Register handler
consumer.consume('orders', handler, (err) => {
  if (err) console.error('Registration failed:', err);
});
```

#### 2.1. Pub/Sub Queues with Consumer Groups

For [Pub/Sub Queues](queue-delivery-models.md#pubsub-broadcast-to-groups), use consumer groups. Messages broadcast to all
groups, but within a group only one consumer receives each message.

```javascript
consumer.consume(
  { queue: 'notifications', groupId: 'email-service' },
  (msg, done) => {
    console.log('Sending email:', msg.body);
    done();
  },
  (err) => {
    if (err) console.error('Registration failed:', err);
  },
);
```

## Key Concepts

### Message Acknowledgement

Every message must be acknowledged:

- **Success**: `done()` - Message processed successfully
- **Failure**: `done(error)` - Processing failed, triggers retry

## Managing Consumption

### Stop Consuming from a Queue

```javascript
consumer.cancel('orders', (err) => {
  if (err) console.error('Cancel failed:', err);
  else console.log('No longer consuming from orders queue');
});
```

### Stop the Entire Consumer

```javascript
consumer.shutdown((err) => {
  if (err) console.error('Shutdown failed:', err);
  else console.log('Consumer stopped');
});
```

### Application Shutdown

```javascript
// Clean up all RedisSMQ components
RedisSMQ.shutdown((err) => {
  if (err) console.error('Cleanup failed:', err);
  else console.log('All components stopped');
});
```

## Message Lifecycle

### Retry Behavior

- Failed messages (`done(error)`) are retried based on the message's retry configuration
- After exceeding retry threshold, messages go to Dead Letter Queue (DLQ) when message audit configuration allows to do so.
- Configure retry settings when [producing messages](producing-messages.md)

### Message Auditing

- By default, RedisSMQ doesn't store acknowledged or dead-lettered messages
- Enable in [configuration](configuration.md) for debugging or compliance

---

For complete API details, see the [Consumer Class documentation](api/classes/Consumer.md).
