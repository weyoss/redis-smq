[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessagePropertyStatus

# Enumeration: EMessagePropertyStatus

Lifecycle status of a message.

A message occupies exactly one status at any moment. The status is
authoritative in Redis and is the primary field consumers and managers
inspect to decide what to do with a message.

The integer values are persisted in Redis (as the `STATUS` hash field)
and compared against constants in the Lua scripts. Reordering or
renumbering is a breaking change to persisted data.

Not every status is observable by every caller. `UNACK_REQUEUING` and
`UNACK_DELAYING` are transitional states internal to the
unacknowledgement pipeline: a message passes through them between
being unacknowledged and being placed in its final destination
(requeued list or delayed set). They are visible in
`getMessageStatus()` results but are not part of the intended user
contract; callers should treat them as "in transit".

## Enumeration Members

### ACKNOWLEDGED

> **ACKNOWLEDGED**: `4`

Message has been successfully consumed and acknowledged.

---

### DEAD\_LETTERED

> **DEAD\_LETTERED**: `7`

Message has failed processing and has been moved to the dead-letter
list.

---

### NEW

> **NEW**: `0`

Message has been created but not yet published. This is the default
status of a `MessageEnvelope` before it enters the queue.

---

### PENDING

> **PENDING**: `1`

Message is waiting to be consumed.

---

### PROCESSING

> **PROCESSING**: `2`

Message is being processed by a consumer.

---

### SCHEDULED

> **SCHEDULED**: `3`

Message is scheduled to be delivered at a future time.

---

### UNACK\_DELAYING

> **UNACK\_DELAYING**: `6`

Message has been unacknowledged and is waiting in the delayed set
for a scheduled retry.

---

### UNACK\_REQUEUING

> **UNACK\_REQUEUING**: `5`

Message has been unacknowledged and is waiting in the requeue list
to be moved back to the pending queue.
