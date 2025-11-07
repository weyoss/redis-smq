[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageAuditConfig

# Interface: IMessageAuditConfig

Message audit configuration for different message types.

Message audit allows tracking of processed messages by storing their IDs
in dedicated Redis storage structures. This enables efficient querying
of acknowledged and dead-lettered messages per queue.

By default, both queueSize and expire are set to 0 (unlimited), which means
audit storage will grow indefinitely. Consider setting limits in production
environments to manage Redis memory usage.

## Example

```typescript
// Enable audit for dead-lettered messages with unlimited storage
const config: IMessageAuditConfig = {
  deadLetteredMessages: true
};

// Enable audit with custom limits to control storage growth
const config: IMessageAuditConfig = {
  acknowledgedMessages: {
    queueSize: 5000,        // limit to 5,000 message IDs per queue
    expire: 12 * 60 * 60    // retain for 12 hours
  },
  deadLetteredMessages: {
    queueSize: 10000,       // limit to 10,000 message IDs per queue
    expire: 7 * 24 * 60 * 60 // retain for 7 days
  }
};
```

## Properties

### acknowledgedMessages?

> `optional` **acknowledgedMessages**: `boolean` \| [`IMessageAuditConfigOptions`](IMessageAuditConfigOptions.md)

Audit configuration for acknowledged messages.

When enabled, creates dedicated storage to track IDs of successfully
processed messages. This allows using QueueAcknowledgedMessages class
to browse and analyze acknowledged messages per queue.

- `true`: Enable with default settings (unlimited storage and retention)
- `false` or `undefined`: Disable audit
- `IMessageAuditConfigOptions`: Enable with custom settings

***

### deadLetteredMessages?

> `optional` **deadLetteredMessages**: `boolean` \| [`IMessageAuditConfigOptions`](IMessageAuditConfigOptions.md)

Audit configuration for dead-lettered messages.

When enabled, creates dedicated storage to track IDs of messages that
failed processing and exceeded retry limits. This allows using
QueueDeadLetteredMessages class to browse and analyze failed messages per queue.

- `true`: Enable with default settings (unlimited storage and retention)
- `false` or `undefined`: Disable audit
- `IMessageAuditConfigOptions`: Enable with custom settings
