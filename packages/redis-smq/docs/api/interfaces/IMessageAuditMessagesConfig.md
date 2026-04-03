[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditMessagesConfig

# Interface: IMessageAuditMessagesConfig

Configuration options for message audit storage.

Message audit creates dedicated Redis storage structures to track processed message IDs,
enabling efficient monitoring of acknowledged and dead-lettered messages per queue.

The storage acts as a ring buffer with configurable size and expiration policies:

- When `queueSize` limit is reached, oldest entries are automatically evicted (FIFO)
- When `expire` time is reached, entries are removed regardless of size
- Both limits can be used together for fine-grained retention control

## Example

```typescript
// Store last 1000 messages or messages from last 7 days (whichever is smaller)
const config: IMessageAuditMessagesConfig = {
  enabled: true,
  queueSize: 1000,
  expire: 604800, // 7 days in seconds
};
```

## Properties

### enabled

> **enabled**: `boolean`

Enables or disables message audit tracking for this message type.

When enabled, the system maintains a Redis sorted set for each queue,
storing message IDs with their processing timestamps as scores.
This enables querying and monitoring capabilities for messages in this category.

When disabled, no audit data is stored, reducing Redis memory overhead
but losing visibility into processed message history.

#### Default

```ts
false;
```

---

### expire

> **expire**: `number`

Retention time for message IDs in seconds.

Message IDs older than this duration are automatically purged from audit storage,
regardless of whether the queue size limit has been reached.

Set to `0` to disable time-based eviction, keeping messages indefinitely.

#### Default

```ts
0(unlimited);
```

---

### queueSize

> **queueSize**: `number`

Maximum number of message IDs to store per queue.

Controls the maximum capacity of the audit storage for each queue.
When the limit is reached, the oldest entries (by timestamp) are
automatically evicted to accommodate new ones.

Set to `0` to disable size-based eviction, allowing unlimited storage.

#### Default

```ts
0(unlimited);
```
