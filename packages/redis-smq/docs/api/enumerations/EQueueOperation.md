[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueOperation

# Enumeration: EQueueOperation

Operations that can be performed on a queue.

Each operation is authorized or refused based on the queue's
operational state. The mapping from state to allowed operations lives
in the operation registry, not in this enum. This enum names the
operations; the registry decides which are permitted.

The integer values are used as bit positions. `OperationBitmask` maps
each member to `1 << member`, and the registry stores a combined mask
per state. Reordering or renumbering this enum would silently
reassign bit positions and change which operations are allowed under
which state.

The values are not persisted in Redis — the bitmask is computed at
runtime from the static registry table. Reordering therefore would
not corrupt stored data, but it would change behavior in a way that
no test would necessarily catch. Treat the ordering as fixed.

## Enumeration Members

### BIND\_EXCHANGE

> **BIND\_EXCHANGE**: `10`

Binding an exchange to the queue.

---

### CLEAR\_RATE\_LIMIT

> **CLEAR\_RATE\_LIMIT**: `7`

Removing the queue's rate limit.

---

### CONSUME

> **CONSUME**: `0`

Dequeuing and processing messages.

---

### CREATE\_CONSUMER\_GROUP

> **CREATE\_CONSUMER\_GROUP**: `8`

Creating a consumer group on the queue (PUB/SUB only).

---

### DELETE

> **DELETE**: `2`

Deleting the queue itself.

---

### DELETE\_CONSUMER\_GROUP

> **DELETE\_CONSUMER\_GROUP**: `9`

Deleting a consumer group from the queue (PUB/SUB only).

---

### DELETE\_MESSAGE

> **DELETE\_MESSAGE**: `4`

Deleting a single message by ID.

---

### PRODUCE

> **PRODUCE**: `1`

Enqueueing new messages.

---

### PURGE

> **PURGE**: `3`

Removing all messages from the queue.

---

### REQUEUE\_MESSAGE

> **REQUEUE\_MESSAGE**: `5`

Requeuing a failed message for another attempt.

---

### SET\_RATE\_LIMIT

> **SET\_RATE\_LIMIT**: `6`

Setting a rate limit on the queue.

---

### UNBIND\_EXCHANGE

> **UNBIND\_EXCHANGE**: `11`

Unbinding an exchange from the queue.
