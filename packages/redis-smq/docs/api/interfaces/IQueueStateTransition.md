[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueStateTransition

# Interface: IQueueStateTransition

A record of one transition of a queue's operational state.

Every transition — from `ACTIVE` to `PAUSED`, from `PAUSED` back to
`ACTIVE`, from `ACTIVE` to `LOCKED`, and so on — produces one of these
objects. The queue's history is a list of them, capped at 50 entries
(older entries are dropped as new ones arrive).

The object is persisted in Redis as JSON, one entry per list element.
Renaming any field is a breaking change to persisted history.

The `from` field is `null` only for the initial transition
(`SYSTEM_INIT`) recorded when the queue is created. Every subsequent
transition has a non-null `from` and `to`.

## Properties

### description?

> `optional` **description?**: `string`

Human-readable description of the transition.

Filled in by the caller when options include a description. When no
description is supplied, the transition is given a default that
summarizes the transition (e.g., "Manual transition from active to
paused").

---

### from

> **from**: [`EQueueOperationalState`](../enumerations/EQueueOperationalState.md) \| `null`

The operational state the queue was in before this transition.

`null` only for the initial transition recorded at queue creation,
which has no prior state.

---

### lockId?

> `optional` **lockId?**: `string`

The lock ID for transitions into or out of the `LOCKED` state.

Present only when the transition involves a lock. For a transition
into `LOCKED`, this is the ID of the lock that was acquired. For a
transition out of `LOCKED`, this is the ID of the lock that was
released. Absent for all other transitions.

---

### lockOwner?

> `optional` **lockOwner?**: [`PURGE_JOB`](../enumerations/EQueueStateLockOwner.md#purge_job)

The owner of the lock for transitions into or out of the `LOCKED`
state.

Present only when the transition involves a lock. Identifies which
subsystem held the lock. Absent for all other transitions.

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Additional context supplied by the caller or the system.

For caller-supplied transitions, this is whatever was passed in the
options. For system transitions, the metadata typically identifies
the trigger (e.g., the job ID for a purge-queue transition).

---

### reason

> **reason**: [`EQueueStateTransitionReason`](../type-aliases/EQueueStateTransitionReason.md)

Why the transition occurred.

For transitions the caller triggered through the public API, this is
one of the `EStateTransitionReason` values. For transitions the
system triggered on its own (queue creation, lock recovery, purge
job lifecycle), it is one of the `ESystemStateTransitionReason`
values.

---

### timestamp

> **timestamp**: `number`

Milliseconds since the Unix epoch, at the moment the transition was
recorded.

---

### to

> **to**: [`EQueueOperationalState`](../enumerations/EQueueOperationalState.md)

The operational state the queue moved to.
