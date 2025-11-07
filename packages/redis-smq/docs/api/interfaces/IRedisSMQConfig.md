[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQConfig

# Interface: IRedisSMQConfig

## Properties

### eventBus?

> `optional` **eventBus**: [`IEventBusConfig`](IEventBusConfig.md)

#### See

/packages/redis-smq/docs/event-bus.md

***

### logger?

> `optional` **logger**: `ILoggerConfig`

#### See

/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

***

### messageAudit?

> `optional` **messageAudit**: `boolean` \| [`IMessageAuditConfig`](IMessageAuditConfig.md)

Message audit configuration for tracking processed messages.

Message audit creates dedicated Redis storage to track processed message IDs,
enabling efficient monitoring and analysis of acknowledged and dead-lettered
messages per queue. Without message audit, QueueAcknowledgedMessages and
QueueDeadLetteredMessages classes cannot function.

**Storage Impact:**
- Creates separate Redis storage structures for tracked message IDs
- Default settings use unlimited storage and retention (queueSize: 0, expire: 0)
- Consider setting limits in production to manage Redis memory usage

**Configuration Options:**
- `true`: Enable audit for both acknowledged and dead-lettered messages with defaults
- `false` or `undefined`: Disable message audit completely
- `IMessageAuditConfig`: Enable with granular control over message types and limits

#### Example

```typescript
// Enable audit for all processed messages (unlimited storage)
const config = {
  messageAudit: true
};

// Enable audit only for dead-lettered messages
const config = {
  messageAudit: {
    deadLetteredMessages: true
  }
};

// Enable audit with storage limits
const config = {
  messageAudit: {
    acknowledgedMessages: {
      queueSize: 5000,        // track last 5,000 message IDs per queue
      expire: 12 * 60 * 60    // retain for 12 hours
    },
    deadLetteredMessages: {
      queueSize: 10000,       // track last 10,000 message IDs per queue
      expire: 7 * 24 * 60 * 60 // retain for 7 days
    }
  }
};
```

#### See

 - /packages/redis-smq/docs/message-audit.md for detailed documentation
 - [IMessageAuditConfig](IMessageAuditConfig.md) for configuration interface details

***

### namespace?

> `optional` **namespace**: `string`

Logical namespace for all queues, exchanges, and Redis keys used by RedisSMQ.

Purpose:
- Isolates resources between applications/environments.
- Used whenever an operation does not explicitly pass a namespace.

Defaults:
- If omitted, the default namespace is used (see defaultConfig.namespace).

***

### redis?

> `optional` **redis**: `IRedisConfig`

#### See

/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md
