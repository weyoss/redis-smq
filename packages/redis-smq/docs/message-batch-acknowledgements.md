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

## Configuration

Batch acknowledgments are configured when creating a consumer:

```javascript
const { RedisSMQ } = require('redis-smq');

// Enable with defaults (100 messages or 10 seconds)
const consumer = new Consumer({
  batchAcks: true,
});

// Custom batch settings
const consumer = new Consumer({
  batchAcks: {
    batchSize: 500, // Max messages per batch
    batchTimeoutMs: 5000, // Max wait time in milliseconds
  },
});

// Disable batching (immediate acknowledgments)
const consumer = new Consumer({
  batchAcks: false,
});
```

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

Acknowledgment events are still emitted per message, even when batched:

```javascript
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, handlerId, consumerId) => {
    console.log(`Message ${messageId} acknowledged`);
  },
);
```

## Graceful Shutdown

When a consumer shuts down, any pending acknowledgments are flushed immediately. No messages are left unacknowledged.

## When to Use

### Use Batch Acknowledgments When

- Processing many messages per second
- Reducing Redis operations is important
- Slight acknowledgment delay is acceptable

### Consider Disabling When

- Message volume is very low
- Each message requires immediate acknowledgment
- You need real-time per-message acknowledgment tracking

## Tuning

- **Increase `batchSize`** for higher throughput (fewer Redis calls)
- **Decrease `batchTimeoutMs`** for more consistent acknowledgment latency
- **Start with defaults** and adjust based on monitoring

See [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) for the failure counterpart.
