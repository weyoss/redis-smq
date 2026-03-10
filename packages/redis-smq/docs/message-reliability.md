[RedisSMQ](../README.md) / [Documentation](README.md) / Message Reliability

# Message Reliability

RedisSMQ ensures messages are delivered and processed reliably through a combination of message persistence,
acknowledgment patterns, retry policies, and failure detection mechanisms.

This document explains how RedisSMQ guarantees that messages are never lost and always processed at least once.

## Overview

Reliable delivery in RedisSMQ is built on several key principles:

1. **Message persistence** - Messages are stored in Redis until explicitly deleted
2. **Acknowledgment protocol** - Consumers must explicitly confirm processing
3. **Visibility timeout** - Messages are re-queued if consumers fail to acknowledge
4. **Retry policies** - Failed messages can be retried with configurable delays
5. **Dead letter queues** - Messages that exceed retry limits are moved to DLQ
6. **Consumer heartbeat** - Dead consumers are detected and their messages recovered

## The "At Least Once" Guarantee

RedisSMQ provides **at least once** delivery semantics. This means:

- Every message published will eventually be delivered to a consumer
- In rare failure scenarios (consumer crashes, network issues), a message might be delivered more than once
- Your message handlers should be **idempotent** - processing the same message multiple times should be safe

## Core Components for Reliable Delivery

### 1. Message Persistence

All messages are stored permanently in Redis and are never automatically deleted. They move between different data
structures (pending, processing, scheduled, acknowledged, dead-lettered) based on their state, but the underlying
message data remains in Redis until explicitly deleted by the user:

```javascript
// Message is immediately persisted in Redis
producer.produce(message, (err, messageId) => {
  // Message is now safely stored
});
```

### 2. Acknowledgment Protocol

Consumers must explicitly acknowledge successful processing:

```javascript
const messageHandler = (message, done) => {
  try {
    // Process the message
    processOrder(message.body);

    // ✅ Acknowledge success - message removed from processing queue
    done();
  } catch (err) {
    // ❌ Acknowledge failure - triggers retry or dead-letter
    done(err);
  }
};
consumer.consume('orders', messageHandler, (err) => {
  if (err) console.error('Consume failed:', err);
});
```

### 3. Visibility Timeout / Consume Timeout

If a consumer takes too long to process a message, it's automatically re-queued:

```javascript
// Set consume timeout per message
const message = new ProducibleMessage()
  .setQueue('orders')
  .setConsumeTimeout(30000) // 30 seconds max processing time
  .setBody({ orderId: 123 });

// If consumer doesn't call done() within 30 seconds,
// message is automatically re-queued for another consumer
```

### 4. Retry Policies

Configure how many times and how often messages should be retried:

```javascript
const message = new ProducibleMessage()
  .setQueue('payment-processing')
  .setRetryThreshold(5) // Retry up to 5 times
  .setRetryDelay(10000) // Wait 10 seconds between retries
  .setBody({ paymentId: 456 });

// Retry sequence:
// 1. First failure → wait 10s → retry
// 2. Second failure → wait 10s → retry
// 3. ... up to 5 attempts
// 4. After 5 failures → move to Dead Letter Queue
```

### 5. Dead Letter Queue (DLQ)

Messages that exceed retry limits are moved to a dead letter queue:

```javascript
// Enable message audit to track dead-lettered messages
const config = {
  messageAudit: {
    deadLetteredMessages: {
      queueSize: 10000, // Keep last 10,000 failed messages
      expire: 604800, // Keep for 7 days
    },
  },
};

RedisSMQ.initializeWithConfig(config, callback);

// Later, inspect dead-lettered messages
const dlq = RedisSMQ.createQueueDeadLetteredMessages();
dlq.getMessages('payment-processing', 1, 50, (err, page) => {
  console.log('Failed payments:', page.items);
});
```

### 6. Consumer Heartbeat and Recovery

RedisSMQ detects dead consumers and recovers their messages:

```javascript
// Each consumer sends heartbeats to Redis
// If heartbeat stops (consumer crash), messages are recovered

// Listen for heartbeat events
eventBus.on('consumerHeartbeat.heartbeat', (consumerId, timestamp) => {
  console.log(`Consumer ${consumerId} is alive`);
});

// When consumer dies, its messages are automatically
// returned to the pending queue for other consumers
```

## Batch Acknowledgments for Performance

For high-throughput systems, use batch acknowledgments to reduce Redis operations while maintaining reliability:

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 100, // Acknowledge in batches of 100
    batchTimeoutMs: 5000, // Or after 5 seconds
  },
});

// Your handler code stays the same
// Acknowledgments are batched automatically
```

See [Message Batch Acknowledgments](message-batch-acknowledgements.md) for details.

## Message Lifecycle with Reliability

```
Published → Stored in Redis
    ↓
Pending Queue ←→ Consumer retrieves
    ↓
Processing ←→ Consumer heartbeat active
    ↓
Two possible paths:
    ├── Success → done() → Acknowledged → (Optional audit)
    └── Failure → done(error) → Check retry count
                              ↓
                      Retries left? → Yes → Wait → Requeue
                              ↓
                             No → Dead Letter Queue
```

See [Message Lifecycle](message-lifecycle.md) for details.

## Handling Common Failure Scenarios

### Consumer Crash During Processing

```
1. Consumer starts processing message
2. Consumer crashes (power loss, process kill)
3. Heartbeat stops
4. RedisSMQ detects dead consumer
5. Messages in processing queue are returned to pending queue
6. Another consumer picks up the message
```

### Network Partition

```
1. Network between consumer and Redis fails
2. Consumer can't send acknowledgment
3. Visibility timeout expires
4. Message returns to pending queue
5. Network recovers, other consumers process message
```

### Slow Processing (Beyond Timeout)

```
1. Message with consumeTimeout = 30s starts processing
2. Handler takes 35s (maybe deadlocked, maybe slow)
3. At 30s, RedisSMQ assumes failure
4. Message returned to pending queue
5. Original handler finally calls done() - ignored (already recovered)
6. Another consumer processes the message
```

## Best Practices for Reliable Delivery

### 1. Make Handlers Idempotent

```javascript
// ❌ Not idempotent - may charge twice
consumer.consume(
  'payments',
  (message, done) => {
    chargeCustomer(message.body.amount); // Could be called twice!
    done();
  },
  (err) => {},
);

// ✅ Idempotent - check before processing
consumer.consume(
  'payments',
  (message, done) => {
    const { paymentId, amount } = message.body;

    // Check if already processed
    if (alreadyProcessed(paymentId)) {
      return done(); // Skip, already done
    }

    chargeCustomer(amount);
    markProcessed(paymentId);
    done();
  },
  (err) => {},
);
```

### 2. Set Appropriate Timeouts

```javascript
// For predictable operations
const message = new ProducibleMessage().setConsumeTimeout(5000); // Should complete in 5 seconds

// For variable operations
const message = new ProducibleMessage().setConsumeTimeout(60000); // May take up to 60 seconds
```

### 3. Configure Retry Policies Wisely

```javascript
// Transient failures (network, rate limits)
const message = new ProducibleMessage()
  .setRetryThreshold(10) // Retry many times
  .setRetryDelay(30000); // Wait longer between retries

// Permanent failures (validation errors)
const message = new ProducibleMessage()
  .setRetryThreshold(2) // Retry a few times
  .setRetryDelay(1000); // Quick retries
```

### 4. Monitor Dead Letter Queues

```javascript
// Regular monitoring
setInterval(() => {
  const dlq = RedisSMQ.createQueueDeadLetteredMessages();
  dlq.countMessages('critical-queue', (err, count) => {
    if (count > 0) {
      alert(`⚠️ ${count} messages in DLQ for critical-queue`);
    }
  });
}, 60000); // Check every minute
```

## Summary

RedisSMQ provides robust reliable delivery through:

- **Persistence** at every step
- **Explicit acknowledgment** protocol
- **Automatic recovery** from failures
- **Configurable retry** policies
- **Dead letter queues** for failed messages
- **Consumer monitoring** and recovery

The system guarantees **at least once** delivery. Design your message handlers to be idempotent to safely handle
potential duplicate deliveries in failure scenarios.

---

**Related Documentation**:

- [Message Lifecycle](message-lifecycle.md) - Walkthrough of a message's journey through RedisSMQ
- [Consuming Messages](consuming-messages.md) - How to receive and process messages
- [Producing Messages](producing-messages.md) - How to send messages
- [Message Batch Acknowledgments](message-batch-acknowledgements.md) - Performance optimization
- [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) - Handling failures
- [Message Audit](message-audit.md) - Tracking processed messages
- [Graceful Shutdown](graceful-shutdown.md) - Proper cleanup
- [EventBus](event-bus.md) - Monitoring events
- [Configuration](configuration.md) - Complete setup options
