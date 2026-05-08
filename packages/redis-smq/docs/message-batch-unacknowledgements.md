# Message Batch Unacknowledgments

Batch unacknowledgment groups failed message handling into a single Redis operation. Like batch acknowledgments, it reduces network overhead for failure scenarios.

## How It Works

When a message fails, the system decides what to do based on retry policy. Without batching, each failure is handled individually. With batching, failures are grouped:

```
Message fails → Determine action → Add to batch
Message fails → Determine action → Add to batch
Message fails → Determine action → Add to batch
→ Process all failures at once (1 Redis call)
```

## Failure Actions

When a message fails, the system determines the appropriate action:

| Action          | When                                                | What Happens                                       |
| --------------- | --------------------------------------------------- | -------------------------------------------------- |
| **Requeue**     | Transient failure, retries remain                   | Message goes back to the queue for immediate retry |
| **Delay**       | Transient failure, retry delay configured           | Message is scheduled for retry after the delay     |
| **Dead-Letter** | TTL expired, periodic message, or retries exhausted | Message moves to the dead-letter queue             |

### Action Decision Logic

```
Message fails
│
├─→ TTL expired? → Dead-letter
├─→ Periodic message (CRON/repeat)? → Dead-letter
├─→ Retry threshold exceeded? → Dead-letter
├─→ Retry delay configured? → Delay
└─→ Otherwise → Requeue
```

## Configuration

Batch unacknowledgments are configured when creating a consumer:

```javascript
const { Consumer } = require('redis-smq');

// Enable with defaults
const consumer = new Consumer({
  batchUnacks: true,
});

// Custom settings
const consumer = new Consumer({
  batchUnacks: {
    batchSize: 500,
    batchTimeoutMs: 5000,
  },
});

// Disable batching
const consumer = new Consumer({
  batchUnacks: false,
});
```

## Different Settings for Acks and Unacks

Batch settings for successes and failures can be configured independently:

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 500, // Aggressive batching for successes
    batchTimeoutMs: 2000,
  },
  batchUnacks: {
    batchSize: 50, // Smaller batches for failures
    batchTimeoutMs: 5000,
  },
});
```

## When a Batch is Sent

A batch is automatically flushed when:

1. **Batch is full** — reached `batchSize` failed messages
2. **Timeout reached** — `batchTimeoutMs` elapsed since first failure
3. **Consumer shutting down** — all pending failures are flushed

## Integration

No changes are needed to your message handler. Failures are batched automatically:

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    try {
      processOrder(message.body);
      done(); // Success → goes to batchAcks
    } catch (err) {
      done(err); // Failure → goes to batchUnacks
    }
  },
  callback,
);
```

## Monitoring

Failure events are emitted per message:

```javascript
// Unacknowledged
eventBus.on(
  'consumer.consumeMessage.messageUnacknowledged',
  (messageId, queue, handlerId, consumerId, cause) => {
    console.log(`Message ${messageId} unacknowledged: ${cause}`);
  },
);

// Dead-lettered
eventBus.on(
  'consumer.consumeMessage.messageDeadLettered',
  (messageId, queue, handlerId, consumerId, cause) => {
    console.log(`Message ${messageId} dead-lettered: ${cause}`);
  },
);

// Requeued
eventBus.on(
  'consumer.consumeMessage.messageRequeued',
  (messageId, queue, handlerId, consumerId) => {
    console.log(`Message ${messageId} requeued`);
  },
);
```

## Graceful Shutdown

During shutdown:

1. Pending batches are flushed
2. All messages in the processing queue are unacknowledged with `SHUTTING_DOWN` cause
3. Messages are returned to the pending queue for other consumers

## When to Use

### Use Batch Unacknowledgments When

- Processing many messages with occasional failures
- Reducing Redis operations is important
- Failure handling latency is not critical

### Consider Disabling When

- Failure rate is very low (batching adds little value)
- You need real-time visibility into each failure
- Debugging specific failure scenarios

## Tuning

- **Use smaller batches for failures** than successes — failures are rarer and may need more immediate attention
- **Monitor dead-letter queues** — track messages that exceed retry limits
- **Set appropriate retry thresholds** — balance between giving up too soon and retrying forever

See [Message Batch Acknowledgments](message-batch-acknowledgements.md) for the success counterpart.
