[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IConsumerBatchConfig

# Interface: IConsumerBatchConfig

Configuration for a batch operation (acknowledgement or
unacknowledgement).

When a batch is enabled, messages are accumulated and written to Redis
in groups rather than one at a time. This trades latency for
throughput: a message is not marked as processed until its batch
flushes, but the flush handles many messages per Redis round trip.

All fields are optional. The consumer merges the provided values with
its current defaults.

## Properties

### batchSize?

> `optional` **batchSize?**: `number`

Maximum number of messages to accumulate before flushing.

Reaching the batch size triggers an immediate flush, independent of
`batchTimeoutMs`.

---

### batchTimeoutMs?

> `optional` **batchTimeoutMs?**: `number`

Maximum time in milliseconds to hold a batch before flushing.

Prevents messages from waiting indefinitely when the arrival rate is
low. Whichever comes first — the batch filling or this timeout —
triggers the flush.

---

### enabled?

> `optional` **enabled?**: `boolean`

Whether this batch is active.

When false, the corresponding operation is performed on each message
immediately, ignoring `batchSize` and `batchTimeoutMs`.
