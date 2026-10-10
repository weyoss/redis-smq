[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TQueueStateTransitionUserOptions

# Type Alias: TQueueStateTransitionUserOptions

> **TQueueStateTransitionUserOptions** = `Omit`\<[`TQueueStateTransitionOptions`](TQueueStateTransitionOptions.md), `"lockId"` \| `"lockOwner"`\> & `object`

Transition options a caller may supply.

The same shape as `TQueueStateTransitionOptions`, minus the
lock-related fields (`lockId`, `lockOwner`) that callers must not set.
The `reason` field is narrowed to `EStateTransitionReason` so that a
caller cannot accidentally record a system-only reason.

Passing `null` instead of an options object is allowed and is treated
as "no options". A caller who supplies an options object with no
`reason` gets the `MANUAL` default.

## Type Declaration

### reason?

> `optional` **reason?**: [`EStateTransitionReason`](../enumerations/EStateTransitionReason.md)

## Example

```ts
// Minimal — reason defaults to MANUAL, no description
await stateManager.pause('orders', null);

// Explicit reason and description
await stateManager.pause('orders', {
  reason: EStateTransitionReason.EMERGENCY,
  description: 'Downstream service unavailable',
  metadata: { incidentId: 'INC-1234' },
});
```
