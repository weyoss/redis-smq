[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EBackgroundJobStatus

# Enumeration: EBackgroundJobStatus

Status values for a background job.

The lifecycle is linear: `PENDING` → `PROCESSING` → one of
`COMPLETED`, `FAILED`, or `CANCELED`. A job never leaves a terminal
state.

`PENDING` jobs have been created but not yet picked up by a worker.
`PROCESSING` jobs are actively running. The three terminal states are
self-descriptive.

## Enumeration Members

### CANCELED

> **CANCELED**: `4`

---

### COMPLETED

> **COMPLETED**: `2`

---

### FAILED

> **FAILED**: `3`

---

### PENDING

> **PENDING**: `0`

---

### PROCESSING

> **PROCESSING**: `1`
