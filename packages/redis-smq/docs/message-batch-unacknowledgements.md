[RedisSMQ](../README.md) / [Documentation](README.md) / Message Batch Unacknowledgments

# Message Batch Unacknowledgments

## What is Batch Unacknowledgment?

When a message fails to process, it must be **unacknowledged** (or "nacked"). This tells RedisSMQ the message wasn't
processed successfully and needs to be handled according to your retry policy.

Like acknowledgments, unacknowledgments can be batched together for better performance.

## How It Works

When a message fails, the system decides what to do based on the message configuration:

```
Message fails → Check retry policy → Determine action → Add to batch → Process batch
```

### Possible Actions for Failed Messages

| Action          | What Happens                                                              |
| --------------- | ------------------------------------------------------------------------- |
| **Requeue**     | Message goes back to the end of the queue for immediate retry             |
| **Delay**       | Message is scheduled for retry after a delay                              |
| **Dead Letter** | Message moves to Dead Letter Queue (retries exhausted, TTL expired, etc.) |

## Configuration

Batch unacknowledgments are configured through the `batchUnacks` option when creating a consumer:

```typescript
interface IConsumerBatchConfig {
  enabled?: boolean; // Enable/disable batching
  batchSize?: number; // Max messages per batch (default: 100)
  batchTimeoutMs?: number; // Max wait time in ms (default: 10000)
}

interface IConsumerOptions {
  batchUnacks?: boolean | IConsumerBatchConfig;
  // other options...
}
```

### Configuration Examples

**Enable with defaults** (simplest):

```javascript
const consumer = new Consumer({
  batchUnacks: true,
});
```

**Disable batching** (immediate unacknowledgments):

```javascript
const consumer = new Consumer({
  batchUnacks: false,
});
```

**Custom batch configuration**:

```javascript
const consumer = new Consumer({
  batchUnacks: {
    batchSize: 500, // Wait for 500 failed messages
    batchTimeoutMs: 5000, // Or 5 seconds, whichever comes first
  },
});
```

**Partial configuration** (uses defaults for missing values):

```javascript
const consumer = new Consumer({
  batchUnacks: {
    batchSize: 200, // enabled: true, batchTimeoutMs: 10000
  },
});
```

**Different settings for acks and unacks**:

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 500, // Aggressive batching for successes
    batchTimeoutMs: 2000,
  },
  batchUnacks: {
    batchSize: 50, // Smaller batches for failures (more granular)
    batchTimeoutMs: 5000,
  },
});
```

## How Messages Are Handled

### 1. **Determining the Action**

For each failed message, the system evaluates:

```javascript
// Simplified logic
if (cause === 'TTL_EXPIRED') {
  // TTL expired messages always go to DLQ
  action = 'DEAD_LETTER';
} else if (message.isPeriodic()) {
  // Periodic messages are never retried
  action = 'DEAD_LETTER';
} else if (message.hasRetryThresholdExceeded()) {
  // Too many retries, give up
  action = 'DEAD_LETTER';
} else {
  // Determine if retry should be immediate or delayed
  action = message.getRetryDelay() ? 'DELAY' : 'REQUEUE';
}
```

### 2. **When Does a Batch Get Sent?**

A batch is automatically flushed when:

1. **Batch is full** - Reached `batchSize` failed messages
2. **Timeout reached** - `batchTimeoutMs` elapsed since first failure
3. **Consumer shutting down** - All pending messages are flushed

## Failure Scenarios and Actions

### Message TTL Expired

```
Message → TTL Expired → Dead Letter Queue → Never retried
```

### Periodic Message Fails

```
Periodic Message → Fails → Dead Letter Queue → Next occurrence scheduled
```

### Regular Message Fails (with retries)

```
Message fails → Retry count: 1/3 → Requeue or Delay → Try again
Message fails → Retry count: 3/3 → Dead Letter Queue → No more retries
```

### Consumer Shutdown

```
Consumer shutting down → Unacknowledge all processing messages → Messages return to queue
```

## Integration with Message Processing

Using batch unacknowledgments requires **no changes** to your message handler code:

```javascript
// Your message handler stays exactly the same
consumer.consume('my-queue', (message, done) => {
  try {
    // Process the message
    if (someCondition) {
      throw new Error('Processing failed');
    }
    done(); // Success - goes to batchAcks
  } catch (err) {
    done(err); // Failure - goes to batchUnacks
  }
});
```

The batch unacknowledgment happens automatically behind the scenes.

## Events for Monitoring

```javascript
// Listen to unacknowledgment events
eventBus.on(
  'consumer.consumeMessage.messageUnacknowledged',
  (messageId, queue, handlerId, consumerId, cause) => {
    console.log(`Message ${messageId} unacknowledged due to: ${cause}`);
  },
);

// Listen to dead-letter events
eventBus.on(
  'consumer.consumeMessage.messageDeadLettered',
  (messageId, queue, handlerId, consumerId, deadLetterCause) => {
    console.log(`Message ${messageId} moved to DLQ: ${deadLetterCause}`);
  },
);

// Listen to requeue events
eventBus.on(
  'consumer.consumeMessage.messageRequeued',
  (messageId, queue, handlerId, consumerId) => {
    console.log(`Message ${messageId} requeued for immediate retry`);
  },
);

// Listen to delay events
eventBus.on(
  'consumer.consumeMessage.messageDelayed',
  (messageId, queue, handlerId, consumerId) => {
    console.log(`Message ${messageId} delayed for future retry`);
  },
);
```

## Batch Unacks vs Batch Acks

| Aspect             | Batch Acknowledgments         | Batch Unacknowledgments              |
| ------------------ | ----------------------------- | ------------------------------------ |
| **Purpose**        | Confirm successful processing | Handle failed processing             |
| **Actions**        | Remove from processing queue  | Requeue, delay, or dead-letter       |
| **Events**         | Single event per message      | Multiple events per message          |
| **Complexity**     | Simple                        | Complex (decision logic per message) |
| **Typical Volume** | High (most messages succeed)  | Lower (failures are exceptions)      |

## Graceful Shutdown

During shutdown, the system automatically:

1. **Flushes pending batches** - Processes any accumulated failed messages
2. **Unacknowledges processing queue** - All messages in the processing queue are unacknowledged with cause `SHUTTING_DOWN`

This ensures no messages are left in an inconsistent state.

## When to Use Batch Unacknowledgments

### ✅ Good Use Cases

- **High-volume systems** with occasional failures
- **Systems with predictable failure patterns**
- **When Redis operation reduction is important**
- **Batch processing applications**

### ⚠️ Consider Batching Off When

- Failure rate is very low (batching adds little value)
- You need real-time visibility into each failure
- Debugging specific failure scenarios
- Each failure requires immediate action

## Best Practices

1. **Start with defaults** - Just use `batchUnacks: true`
2. **Monitor dead-letter queues** - Track messages that exceed retry limits
3. **Set appropriate retry thresholds** - Balance between giving up too soon and retrying forever
4. **Use retry delays** - Prevent hammering a failing system with immediate retries
5. **Configure batch sizes based on failure volume** - Not just message volume
6. **Log unacknowledgment events** - Especially dead-letter events for debugging
7. **Consider different batch sizes** for acks vs unacks (failures often need more immediate attention)

## Common Questions

### What's the difference between requeue and delay?

- **Requeue**: Message goes back to the queue immediately (for transient failures)
- **Delay**: Message is scheduled for future delivery (when system needs time to recover)

### Can a message be both acknowledged and unacknowledged?

No. A message follows one path: success (ack) or failure (unack).

### What happens to messages during consumer crash?

The `ReapConsumersWorker` detects dead consumers and moves their processing messages back to pending queues.

### Does batching affect retry counts?

No. Retry counts are tracked per message and are updated regardless of batching.

### Can I mix batch and non-batch unacknowledgments?

The setting applies to all messages. Choose based on your needs.

### How do I know if batching is working?

Monitor the events. With batching on, you'll see messages being processed in groups rather than individually.

---

**Related**:

- [Message Batch Acknowledgements](message-batch-acknowledgements.md)
- [Consumer API Reference](api/classes/Consumer.md)
