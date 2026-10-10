[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IConsumerOptions

# Interface: IConsumerOptions

Constructor options for a `Consumer`.

All fields are optional. The consumer merges the provided values with
its current defaults, which can be inspected via
`Consumer.getDefaultOptions()` and replaced via
`Consumer.setDefaultOptions()`.

## Properties

### batchAcks?

> `optional` **batchAcks?**: `boolean` \| [`IConsumerBatchConfig`](IConsumerBatchConfig.md)

Configuration for the acknowledgement batch.

Accepts:

- `true`: enable batching with the current defaults
- `false`: disable batching; acknowledge each message immediately
- `IConsumerBatchConfig`: enable with the specified values, filling
  unset fields from the current defaults

---

### batchUnacks?

> `optional` **batchUnacks?**: `boolean` \| [`IConsumerBatchConfig`](IConsumerBatchConfig.md)

Configuration for the unacknowledgement batch.

Same shape and semantics as `batchAcks`. Applies to unacknowledgement
requests (retries, dead-letters, and delays).

---

### enableMultiplexing?

> `optional` **enableMultiplexing?**: `boolean`

Enables multiplexed consumption across all queues.

When true, a single consumer instance schedules all of its message
handlers through a shared round-robin tick loop instead of running a
dedicated dequeue loop per handler. This reduces the number of Redis
connections the consumer holds and is useful when a single process
handles many queues.

When false (the default), each handler runs its own dequeue loop on
its own connection. This gives lower latency per message.

---

### heartbeatTTL?

> `optional` **heartbeatTTL?**: `number`

Time-to-live in milliseconds for this consumer's heartbeat key in
Redis.

A consumer is considered offline if its heartbeat key has expired.
Other consumers in the same queue use this to detect offline peers
and recover any messages left in their processing queues. Longer
TTLs tolerate transient disconnects; shorter TTLs recover faster.

Choose a value comfortably larger than the longest tolerable pause
between heartbeats. The default (60000) tolerates the process being
suspended for a few seconds without triggering peer recovery.
