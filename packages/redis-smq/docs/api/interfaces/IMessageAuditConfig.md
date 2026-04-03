[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditConfig

# Interface: IMessageAuditConfig

Root configuration interface for message audit system.

Each audit category can be configured in three ways:

- `false` - Disable auditing for this category
- `true` - Enable auditing with default settings (queueSize=0, expire=0, maxSize=100)
- `Partial<IConfig>` - Enable auditing with custom settings

## Example

```typescript
// Minimal configuration - enable all with defaults
const config: IMessageAuditConfig = {
  acknowledgedMessages: true,
  deadLetteredMessages: true,
  unacknowledgementHistory: true,
};

// Custom configuration with size limits and expiration
const config: IMessageAuditConfig = {
  acknowledgedMessages: {
    enabled: true,
    queueSize: 10000,
    expire: 2592000, // 30 days
  },
  deadLetteredMessages: {
    enabled: true,
    queueSize: 5000,
    expire: 604800, // 7 days
  },
  unacknowledgementHistory: {
    enabled: true,
    maxSize: 50,
  },
};
```

## Properties

### acknowledgedMessages?

> `optional` **acknowledgedMessages**: `boolean` \| `Partial`\<[`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)\>

Audit configuration for acknowledged messages.

When enabled, creates dedicated storage to track IDs of successfully
processed messages. This allows using the `QueueAcknowledgedMessages` class
to browse, query, and analyze acknowledged messages per queue.

#### Default

```ts
false;
```

---

### deadLetteredMessages?

> `optional` **deadLetteredMessages**: `boolean` \| `Partial`\<[`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)\>

Audit configuration for dead-lettered messages.

When enabled, creates dedicated storage to track IDs of messages that
failed processing and exceeded their retry limits. This allows using
the `QueueDeadLetteredMessages` class to browse, query, and analyze
failed messages per queue.

#### Default

```ts
false;
```

---

### unacknowledgementHistory?

> `optional` **unacknowledgementHistory**: `boolean` \| `Partial`\<[`IMessageAuditHistoryConfig`](IMessageAuditHistoryConfig.md)\>

Audit configuration for unacknowledgement message history.

When enabled, tracks detailed history of message processing failures,
including each unacknowledgement event with failure causes and resolution
actions. This provides comprehensive debugging information.

#### Default

```ts
false;
```
