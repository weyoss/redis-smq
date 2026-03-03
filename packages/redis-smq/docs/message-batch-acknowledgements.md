[RedisSMQ](../README.md) / [Documentation](README.md) / Message Batch Acknowledgments

# Message Batch Acknowledgments

## What is Batch Acknowledgment?

When a consumer successfully processes a message, it must **acknowledge** it to tell RedisSMQ the message can be
removed from the processing queue.

Batch acknowledgment groups multiple acknowledgments together, sending them in a single operation instead of one by one.

This simple optimization can dramatically improve performance in high-throughput systems.

## How It Works

Without batching:

```
Message processed → Acknowledge immediately
Message processed → Acknowledge immediately
Message processed → Acknowledge immediately
```

With batching:

```
Message processed → Add to pending batch
Message processed → Add to pending batch
Message processed → Acknowledge ALL batch messages at once
```

## Configuration

Batch acknowledgments are configured through the `batchAcks` option when creating a consumer:

```typescript
interface IConsumerBatchConfig {
  enabled?: boolean; // Enable/disable batching
  batchSize?: number; // Max messages per batch (default: 100)
  batchTimeoutMs?: number; // Max wait time in ms (default: 10000)
}

interface IConsumerOptions {
  batchAcks?: boolean | IConsumerBatchConfig;
  // other options...
}
```

### Configuration Examples

**Enable with defaults** (simplest):

```javascript
const consumer = new Consumer({
  batchAcks: true,
});
```

**Disable batching** (immediate acknowledgments):

```javascript
const consumer = new Consumer({
  batchAcks: false,
});
```

**Custom batch configuration**:

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 500, // Wait for 500 messages
    batchTimeoutMs: 5000, // Or 5 seconds, whichever comes first
  },
});
```

**Partial configuration** (uses defaults for missing values):

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 200, // enabled: true, batchTimeoutMs: 10000
  },
});
```

## When Does a Batch Get Sent?

A batch is automatically flushed when:

1. **Batch is full** - Reached `batchSize` messages
2. **Timeout reached** - `batchTimeoutMs` elapsed since first message
3. **Consumer shutting down** - All pending messages are flushed

## Key Benefits

| Benefit                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| **Fewer Redis operations**   | One batch acknowledgment replaces many individual ones |
| **Reduced network overhead** | Less back-and-forth traffic between consumer and Redis |
| **Higher throughput**        | Process more messages per second                       |
| **Lower latency**            | Less time spent on acknowledgment overhead             |

### Example

#### Without Batching (Single Acks)

```text
1000 messages = 1000 Redis operations
```

#### With Batching (Batch Size = 100)

```text
1000 messages = 10 Redis operations
```

- 99% reduction in Redis calls
- Lower network latency
- Reduced Redis load

## Integration with Message Processing

Using batch acknowledgments requires **no changes** to your message handler code:

```javascript
// Your message handler stays exactly the same
consumer.consume('my-queue', (message, done) => {
  // Process the message
  console.log('Processing:', message);

  // Call done() when finished
  done(); // This triggers the acknowledgment system
});
```

The batch acknowledgment happens automatically behind the scenes.

## Graceful Shutdown

When your consumer shuts down, it automatically:

1. Checks for any pending acknowledgments
2. Flushes them immediately
3. Then completes the shutdown

No messages are left unacknowledged.

## Monitoring Acknowledgments

You can listen for acknowledgment events:

```javascript
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, handlerId, consumerId) => {
    console.log(`Message ${messageId} was acknowledged`);
  },
);
```

## When to Use Batch Acknowledgments

### ✅ Good Use Cases

- **High-throughput systems** processing many messages
- **Batch processing applications** where immediate acknowledgment isn't critical
- **Resource-constrained environments** where reducing Redis operations helps

### ⚠️ Consider Batching Off When

- Each message requires immediate feedback
- Message volume is very low (batching adds little value)
- You need per-message acknowledgment tracking in real-time

## Best Practices

1. **Start with defaults** - Just use `batchAcks: true`
2. **Monitor your system** and adjust based on:
   - Message volume
   - Processing time
   - Latency requirements
3. **Increase batch size** for higher throughput
4. **Decrease timeout** for more consistent latency
5. **Always shut down properly** to flush pending acknowledgments

## Common Questions

### Does batching increase risk of message loss?

No. Messages are safely stored in Redis until acknowledged. Batching only groups the "done" signals.

### What happens if the consumer crashes?

The `ReapConsumersWorker` detects dead consumers and moves their unacknowledged messages back to pending queues.

### Can I mix batch and non-batch acknowledgments?

The setting applies to all messages for that consumer. Choose based on your overall requirements.

### Does this work with message priorities?

Yes. Batch acknowledgments work with all queue types, including priority queues.

### What's the difference between `batchAcks` and `batchUnacks`?

- **`batchAcks`**: For successfully processed messages
- **`batchUnacks`**: For failed messages (requeue, delay, or dead-letter)

---

**Related**:

- [Message Batch Unacknowledgements](message-batch-unacknowledgements.md)
- [Consumer API Reference](api/classes/Consumer.md)
