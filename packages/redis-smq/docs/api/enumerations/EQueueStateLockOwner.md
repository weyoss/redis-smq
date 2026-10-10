[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueStateLockOwner

# Enumeration: EQueueStateLockOwner

Who owns a LOCKED state.

The lock owner identifies the subsystem that acquired the lock. Today
there is exactly one owner — the purge-queue job — but the enum exists
so that a future lock-acquiring subsystem can be added without
changing the transition schema.

The value is persisted in the transition record's `lockOwner` field.
Renaming a member is a breaking change to persisted history.

This type is exported by the current public surface. It is arguably
an internal detail (callers cannot acquire locks themselves). A future
major release could move it to an internal directory.

## Enumeration Members

### PURGE\_JOB

> **PURGE\_JOB**: `0`

The lock is held by a purge-queue job. The lock ID equals the job's
ID, so the lock can be correlated with the job in the queue's
background-job registry.
