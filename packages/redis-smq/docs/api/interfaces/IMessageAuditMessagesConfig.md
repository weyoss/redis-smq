[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditMessagesConfig

# Interface: IMessageAuditMessagesConfig

Configuration options for message audit storage.

Message audit creates dedicated storage to track processed message IDs,
enabling efficient monitoring of acknowledged and dead-lettered messages per queue.

This storage acts as a ring buffer with configurable size and expiration policies,
allowing you to control memory usage while maintaining visibility into message
processing history.

## Properties

### enabled

> **enabled**: `boolean`

Enables or disables message audit tracking for this message type.

When enabled, the system maintains a dedicated storage structure that tracks
message IDs as they are processed. This enables querying and monitoring
capabilities for messages in this category.

When disabled, no audit data is stored, reducing memory overhead but losing
visibility into processed messages.

#### Example

```typescript
{
  // Enable audit tracking
  enabled: true;

  // Disable audit tracking (default)
  enabled: false;
}
```

---

### expire

> **expire**: `number`

Retention time for message IDs in seconds.

Message IDs older than this duration are automatically purged from audit storage,
regardless of whether the queue size limit has been reached. This helps manage
long-term storage and ensures that only recent message history is retained.

Set to `0` to disable time-based eviction, keeping messages indefinitely.

#### Default

```ts
0(unlimited);
```

#### Example

```typescript
{
  // Keep messages for 7 days (604,800 seconds)
  expire: 604800;

  // Keep messages indefinitely
  expire: 0;
}
```

---

### queueSize

> **queueSize**: `number`

Maximum number of message IDs to store per queue.

This setting controls the maximum capacity of the audit storage for each queue.
When the limit is reached, the oldest entries are automatically evicted to
accommodate new ones (FIFO behavior).

Set to `0` to disable size-based eviction, allowing unlimited storage.
This is useful when you need to retain complete history without automatic cleanup.

#### Default

```ts
0(unlimited);
```

#### Example

```typescript
{
  // Store up to 1000 message IDs per queue
  queueSize: 1000;

  // Unlimited storage
  queueSize: 0;
}
```
