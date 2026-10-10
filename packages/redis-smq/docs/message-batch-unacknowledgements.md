```markdown
[RedisSMQ](../README.md) / [Documentation](README.md) / Message Batch Unacknowledgments

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

Batching is **enabled by default**, independently of batch acknowledgments. If you do nothing, the consumer batches unacknowledgments with the settings shown below.

## Failure Actions

When a message fails, the system determines the appropriate action:

| Action          | When                                                | What Happens                                       |
| --------------- | --------------------------------------------------- | -------------------------------------------------- |
| **Requeue**     | Transient failure, retries remain, no retry delay   | Message goes back to the queue for immediate retry |
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

````

The rules are evaluated in the order shown. A periodic message with retries remaining still dead-letters — periodic messages are never retried because a retry would restart the cycle, which is not the caller's intent.

## Configuration

Batch unacknowledgments are configured when creating a consumer through the `RedisSMQ` factory:

```javascript
const { RedisSMQ } = require('redis-smq');

// Enable with defaults (100 messages or 10 seconds)
const consumer = RedisSMQ.createConsumer({ batchUnacks: true });

// Custom settings
const consumer = RedisSMQ.createConsumer({
  batchUnacks: {
    batchSize: 500,
    batchTimeoutMs: 5000,
  },
});

// Disable batching
const consumer = RedisSMQ.createConsumer({ batchUnacks: false });
````

The `Consumer` class is not exported from the package root — construct consumers through `RedisSMQ.createConsumer(options)`. Unset fields fall back to the consumer's current defaults.

## Different Settings for Acks and Unacks

Batch settings for successes and failures are configured independently. Both are merged separately with their own defaults:

```javascript
const consumer = RedisSMQ.createConsumer({
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

## Default Settings

| Setting          | Default | Description                |
| ---------------- | ------- | -------------------------- |
| `batchSize`      | 100     | Max messages per batch     |
| `batchTimeoutMs` | 10000   | Max wait time (10 seconds) |

## When a Batch is Sent

A batch is automatically flushed when:

1. **Batch is full** — reached `batchSize` failed messages
2. **Timeout reached** — `batchTimeoutMs` elapsed since the first failure in the batch
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

Failure events are emitted per message, even when the batch contains multiple messages. The events fire when the batch flushes, not when an individual message enters the batch.

```javascript
const { RedisSMQ } = require('redis-smq');

const eventBus = RedisSMQ.getEventBus();
await eventBus.run();

// Unacknowledged — the general failure signal
eventBus.on(
  'consumer.messageUnacknowledged',
  (messageId, queue, consumerId, cause) => {
    console.log(`Message ${messageId} unacknowledged: ${cause}`);
  },
);

// Dead-lettered — a specific resolution
eventBus.on(
  'consumer.messageDeadLettered',
  (messageId, queue, consumerId, deadLetterCause) => {
    console.log(`Message ${messageId} dead-lettered: ${deadLetterCause}`);
  },
);

// Requeued — a specific resolution
eventBus.on('consumer.messageRequeued', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} requeued`);
});

// Delayed — a specific resolution
eventBus.on('consumer.messageDelayed', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} delayed for retry`);
});
```

`consumer.messageUnacknowledged` fires for every failure. The action-specific events (`messageDeadLettered`, `messageRequeued`, `messageDelayed`) fire in addition, once the resolution has been decided. A subscriber that only cares about a specific outcome can subscribe to just that event.

See [Event Bus](event-bus.md) for the bus's start-before-subscribe requirement.

## Graceful Shutdown

During shutdown:

1. Pending batch is flushed
2. Every message still in the processing queue is unacknowledged with cause `SHUTTING_DOWN`
3. Each message resolves through the same pipeline as a normal failure — Requeue, Delay, or Dead-Letter, according to its retry policy

A consumer shutting down with in-flight messages does not necessarily return them all to pending. If a message's retry threshold is already exceeded, it dead-letters. See [Graceful Shutdown](graceful-shutdown.md) for the full sequence.

## When to Use

### Use Batch Unacknowledgments When

- Processing many messages with occasional failures
- Reducing Redis operations is important
- Failure handling latency is not critical

### Consider Disabling When

- Failure rate is very low (batching adds latency without meaningful savings)
- You need real-time visibility into each failure
- You are debugging a specific failure scenario and want per-failure Redis writes

## Tuning

- **Use smaller batches for failures** than successes — failures are rarer and may need more immediate attention
- **Monitor dead-letter queues** — track messages that exceed retry limits
- **Set appropriate retry thresholds** — balance between giving up too soon and retrying forever
- **Consider a shorter `batchTimeoutMs` for unacks** than for acks — failures deserve faster visibility

See [Message Batch Acknowledgments](message-batch-acknowledgements.md) for the success counterpart.
