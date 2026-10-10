[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ESystemStateTransitionReason

# Enumeration: ESystemStateTransitionReason

Reasons for a state transition that only the system produces.

These reasons are recorded automatically by internal machinery — the
initial state on queue creation, the recovery of an orphaned lock, and
the lifecycle of a purge job. They are never supplied by a caller
through the public API.

The values are persisted in the queue's state history list (as part of
the JSON-serialized transition records). Renaming a member is a
breaking change to persisted history.

## Enumeration Members

### PURGE\_QUEUE\_CANCEL

> **PURGE\_QUEUE\_CANCEL**: `"PURGE_QUEUE_CANCEL"`

Recorded when a purge job is cancelled by the caller. The queue
transitions back to ACTIVE and the lock is released.

---

### PURGE\_QUEUE\_COMPLETE

> **PURGE\_QUEUE\_COMPLETE**: `"PURGE_QUEUE_COMPLETE"`

Recorded when a purge job completes successfully. The queue
transitions back to ACTIVE and the lock is released.

---

### PURGE\_QUEUE\_FAIL

> **PURGE\_QUEUE\_FAIL**: `"PURGE_QUEUE_FAIL"`

Recorded when a purge job fails. The queue transitions back to
ACTIVE and the lock is released.

---

### PURGE\_QUEUE\_START

> **PURGE\_QUEUE\_START**: `"PURGE_QUEUE_START"`

Recorded when a purge job starts. The queue transitions to LOCKED,
and the lock ID is the purge job ID.

---

### RECOVERY

> **RECOVERY**: `"RECOVERY"`

Recorded when an internal worker recovers a queue from a state that
was left by a crashed or timed-out process. Currently used to
recover from an orphaned LOCKED state whose owner is no longer
running.

---

### SYSTEM\_INIT

> **SYSTEM\_INIT**: `"SYSTEM_INIT"`

Recorded when a queue is created. The transition is from `null` (no
prior state) to `ACTIVE`, and it is the first entry in every queue's
history.
