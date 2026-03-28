[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditHistoryConfig

# Interface: IMessageAuditHistoryConfig

Configuration options for unacknowledgement message history.

Unacknowledgement history tracks every time a message fails to be acknowledged,
storing detailed information about the failure cause and resolution action.
This provides a complete audit trail for message processing failures,
enabling debugging, monitoring, and analysis of processing issues.

Each history entry includes:

- Timestamp of the failure
- Failure cause (error, timeout, etc.)
- Resolution action taken (retry, dead-letter, etc.)

## Properties

### enabled

> **enabled**: `boolean`

Enables or disables unacknowledgement history tracking.

When enabled, each unacknowledgement event creates a comprehensive history record
containing failure details and the system's resolution action. This provides
valuable insights for debugging message processing issues and monitoring
application health.

When disabled, no history records are stored, reducing storage overhead but
losing visibility into processing failures.

#### Default

```ts
false;
```

#### Example

```typescript
{
  // Enable failure history tracking
  enabled: true;
}
```

---

### maxSize

> **maxSize**: `number`

Maximum number of history entries to store per message.

This setting controls how many failure events are retained for each message.
When the limit is reached, the oldest entries are evicted to make room for
new ones, maintaining a bounded history of the most recent failures.

Set to `0` for unlimited storage, which can be useful for critical messages
where you need complete failure history.

#### Default

```ts
100;
```

#### Example

```typescript
{
  // Store last 50 failures per message
  maxSize: 50;

  // Store unlimited failures
  maxSize: 0;
}
```
