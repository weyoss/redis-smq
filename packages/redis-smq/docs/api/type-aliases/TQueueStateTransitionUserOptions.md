[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TQueueStateTransitionUserOptions

# Type Alias: TQueueStateTransitionUserOptions

> **TQueueStateTransitionUserOptions** = `Omit`\<[`TQueueStateTransitionOptions`](TQueueStateTransitionOptions.md), `"lockId"` \| `"lockOwner"`\> & `object`

User-facing options should only include user reasons

## Type Declaration

### reason?

> `optional` **reason**: [`EStateTransitionReason`](../enumerations/EStateTransitionReason.md)
