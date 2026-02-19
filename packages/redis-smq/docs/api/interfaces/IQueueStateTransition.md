[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueStateTransition

# Interface: IQueueStateTransition

Queue state transition information

## Properties

### description?

> `optional` **description**: `string`

Human-readable description

---

### from

> **from**: [`EQueueOperationalState`](../enumerations/EQueueOperationalState.md) \| `null`

State transitioning from

---

### lockId?

> `optional` **lockId**: `string`

Lock ID (if applicable for LOCKED state)

---

### lockOwner?

> `optional` **lockOwner**: [`PURGE_JOB`](../enumerations/EQueueStateLockOwner.md#purge_job)

Lock owner (if applicable)

---

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Additional context/metadata

---

### reason

> **reason**: [`EQueueStateTransitionReason`](../enumerations/EQueueStateTransitionReason.md)

Reason for the transition

---

### timestamp

> **timestamp**: `number`

When the transition occurred

---

### to

> **to**: [`EQueueOperationalState`](../enumerations/EQueueOperationalState.md)

State transitioning to
