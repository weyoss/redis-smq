[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessagePriority

# Enumeration: EMessagePriority

Priority levels for messages in PRIORITY_QUEUE queues.

Lower integer values represent higher priority. A message with priority
`HIGHEST` (0) is dequeued before any message with priority `HIGH` (2),
regardless of arrival order. Within the same priority level, ordering
follows the queue type (FIFO or LIFO by insertion order within the
level).

Priority is only meaningful for PRIORITY_QUEUE queues. Publishing a
message with a priority to a non-priority queue is refused at publish
time; so is publishing without a priority to a priority queue.

The integer values are persisted in Redis (as the score of the pending
sorted set) and passed as arguments to several Lua scripts. Reordering
or renumbering is a breaking change to persisted data.

## Enumeration Members

### ABOVE\_NORMAL

> **ABOVE\_NORMAL**: `3`

---

### HIGH

> **HIGH**: `2`

---

### HIGHEST

> **HIGHEST**: `0`

---

### LOW

> **LOW**: `5`

---

### LOWEST

> **LOWEST**: `7`

---

### NORMAL

> **NORMAL**: `4`

---

### VERY\_HIGH

> **VERY\_HIGH**: `1`

---

### VERY\_LOW

> **VERY\_LOW**: `6`
