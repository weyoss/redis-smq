[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TQueueStateTransitionOptions

# Type Alias: TQueueStateTransitionOptions

> **TQueueStateTransitionOptions** = `Partial`\<`Omit`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md), `"from"` \| `"to"` \| `"timestamp"`\>\>

All optional fields of a state transition.

Used internally by the transition machinery to construct the option
bag that becomes a transition record. Includes lock-related fields
(`lockId`, `lockOwner`) that only the internal machinery sets.

Callers who supply transition options through the public API use
`TQueueStateTransitionUserOptions` instead, which excludes the
lock-related fields.

This type is exported by the current public surface. It is arguably
an internal detail (a projection of `IQueueStateTransition` minus the
fields that are set positionally by the transition code). A future
major release could move it to an internal directory.
