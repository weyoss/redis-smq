[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueType

# Enumeration: EQueueType

Queue ordering model.

Determines the Redis data structure used for the pending queue:

- LIFO_QUEUE: list, newest-first retrieval
- FIFO_QUEUE: list, oldest-first retrieval
- PRIORITY_QUEUE: sorted set, scored by message priority

The integer values are persisted in Redis (the `QUEUE_TYPE` hash
field) and passed as arguments to several Lua scripts. Reordering or
renumbering is a breaking change.

## Enumeration Members

### FIFO\_QUEUE

> **FIFO\_QUEUE**: `1`

---

### LIFO\_QUEUE

> **LIFO\_QUEUE**: `0`

---

### PRIORITY\_QUEUE

> **PRIORITY\_QUEUE**: `2`
