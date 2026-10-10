[RedisSMQ](../README.md) / [Documentation](README.md) / Message Batch Acknowledgments

# Message Batch Acknowledgments

Batch acknowledgment groups multiple acknowledgments into a single Redis operation. This reduces network overhead and Redis load in high-throughput systems.

## How It Works

Without batching, each message is acknowledged individually:

```
Message processed → Acknowledge (1 Redis call)
Message processed → Acknowledge (1 Redis call)
Message processed → Acknowledge (1 Redis call)
```

With batching, acknowledgments are grouped:

```
Message processed → Add to batch
Message processed → Add to batch
Message processed → Add to batch
→ Acknowledge all at once (1 Redis call)
```

Batching is **enabled by default**. If you do nothing, the consumer batches acknowledgments with the settings shown below.

## Configuration

Batch acknowledgments are configured when creating a consumer through the `RedisSMQ` factory:

```javascript
const { RedisSMQ } = require('redis-smq');

// Enable with defaults (100 messages or 10 seconds)
const consumer = RedisSMQ.createConsumer({ batchAcks: true });

// Custom batch settings
const consumer = RedisSMQ.createConsumer({
  batchAcks: {
    batchSize: 500, // Max messages per batch
    batchTimeoutMs: 5000, // Max wait time in milliseconds
  },
});

// Disable batching (immediate acknowledgments)
const consumer = RedisSMQ.createConsumer({ batchAcks: false });
```

The `Consumer` class is not exported from the package root — construct consumers through `RedisSMQ.createConsumer(options)`. The options object is merged with the consumer's current defaults; unset fields fall back to the values in the table below.

## When a Batch is Sent

A batch is automatically flushed when:

1. **Batch is full** — the number of pending acknowledgments reaches `batchSize`
2. **Timeout reached** — `batchTimeoutMs` has elapsed since the first message in the batch
3. **Consumer shutting down** — all pending acknowledgments are flushed before shutdown

## Default Settings

| Setting          | Default | Description                |
| ---------------- | ------- | -------------------------- |
| `batchSize`      | 100     | Max messages per batch     |
| `batchTimeoutMs` | 10000   | Max wait time (10 seconds) |

## Impact

| Scenario                      | Redis Calls | Reduction |
| ----------------------------- | ----------- | --------- |
| 1000 messages, no batching    | 1000        | —         |
| 1000 messages, batch size 100 | 10          | 99%       |
| 1000 messages, batch size 500 | 2           | 99.8%     |

## Integration

No changes are needed to your message handler. Acknowledgments are batched automatically behind the scenes:

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    // Process the message
    console.log('Processing:', message.body);

    // Call done() as usual — the system handles batching
    done();
  },
  callback,
);
```

## Monitoring

Acknowledgment events are emitted per message, even when the batch contains multiple messages. The event fires when the batch flushes, not when an individual message enters the batch — so a subscriber may see a burst of events shortly after a batch completes.

```javascript
const { RedisSMQ } = require('redis-smq');

const eventBus = RedisSMQ.getEventBus();
await eventBus.run();

eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} acknowledged by ${consumerId}`);
});
```

See [Event Bus](event-bus.md) for the bus's start-before-subscribe requirement.

## Graceful Shutdown

When a consumer shuts down, any pending acknowledgments are flushed immediately. Messages that were already in the batch are acked; messages that were still being processed are unacknowledged with cause `SHUTTING_DOWN` and resolved according to their retry policy. See [Graceful Shutdown](graceful-shutdown.md) for the full sequence.

## When to Use

### Use Batch Acknowledgments When

- Processing many messages per second
- Reducing Redis operations is important
- A small acknowledgment delay is acceptable

### Consider Disabling When

- Message volume is very low (batching adds latency without meaningful savings)
- Each message requires immediate acknowledgment
- You need per-message acknowledgment visible in Redis the moment the handler returns

## Tuning

- **Increase `batchSize`** for higher throughput — fewer Redis calls per message
- **Decrease `batchTimeoutMs`** for more consistent acknowledgment latency
- **Start with defaults** and adjust based on monitoring

See [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) for the failure counterpart.
