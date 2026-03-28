[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditConfig

# Interface: IMessageAuditConfig

Root configuration interface for message audit system.

This interface controls all audit-related features of the message queue system,
including tracking of acknowledged messages, dead-lettered messages, and
failure history. It provides flexible configuration options that can be
enabled/disabled and customized per audit category.

Each audit category can be configured in three ways:

- `false` - Disable auditing for this category
- `true` - Enable auditing with default settings
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

This is useful for:

- Monitoring successful message processing rates
- Auditing completed work
- Debugging message flow through the system

#### Default

```ts
false (audit disabled)
```

#### See

QueueAcknowledgedMessages

---

### deadLetteredMessages?

> `optional` **deadLetteredMessages**: `boolean` \| `Partial`\<[`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)\>

Audit configuration for dead-lettered messages.

When enabled, creates dedicated storage to track IDs of messages that
failed processing and exceeded their retry limits. This allows using
the `QueueDeadLetteredMessages` class to browse, query, and analyze
failed messages per queue.

Dead-lettered messages represent processing failures that require
manual intervention or separate handling. This audit trail helps:

- Identify problematic messages or handlers
- Monitor failure rates and patterns
- Implement dead-letter queue processing workflows

#### Default

```ts
false (audit disabled)
```

#### See

QueueDeadLetteredMessages

---

### unacknowledgementHistory?

> `optional` **unacknowledgementHistory**: `boolean` \| `Partial`\<[`IMessageAuditHistoryConfig`](IMessageAuditHistoryConfig.md)\>

Audit configuration for unacknowledgement message history.

When enabled, tracks detailed history of message processing failures,
including each unacknowledgement event with failure causes and resolution
actions. This provides comprehensive debugging information and helps
identify systemic issues in message processing.

Unlike acknowledged and dead-lettered audits which track only message IDs,
this feature stores rich metadata about each failure event.

#### Default

```ts
false (history tracking disabled)
```
