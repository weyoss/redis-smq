[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessageUnacknowledgementCause

# Enumeration: EMessageUnacknowledgementCause

Why a message was unacknowledged.

The cause categorizes the trigger:

- Consumer-side: the handler threw, rejected, timed out, or
  returned an invalid signature.
- Queue-side: the queue was in a state (STOPPED, LOCKED, invalid)
  that prevented processing.
- Infrastructure-side: the consumer went offline and its in-flight
  messages needed recovery, or the message was not found.
- Library-side: the message expired (TTL), or the consumer was
  shutting down.

The cause is recorded on the message's unacknowledgement history. It
is the primary field a caller inspects when diagnosing a failed
message.

The integer values are persisted indirectly — they are stored as part
of the serialized history record, and the mapping from
`EQueueStateLockOwner`-style stored values to enum members is by
ordinal position, so reordering breaks persisted history. Treat the
ordering as fixed.

## Enumeration Members

### CONSUME\_ERROR

> **CONSUME\_ERROR**: `1`

The handler threw synchronously, rejected its promise, or the
invocation failed before reaching the handler (for example,
`message.transfer()` threw because the message hash was malformed).

This is the general "handler-side failure" cause.

---

### INVALID\_HANDLER\_SIGNATURE

> **INVALID\_HANDLER\_SIGNATURE**: `13`

The handler's signature was invalid — arity 0, arity greater than 2,
a module path that does not exist, or a module that does not
export a function.

Rejection happens at startup (`validateHandler`) for most invalid
shapes; this cause is reachable only if validation was bypassed or
if the handler was swapped at runtime.

---

### MESSAGE\_NOT\_FOUND

> **MESSAGE\_NOT\_FOUND**: `9`

The message ID referenced by the dequeue did not correspond to any
message hash in Redis.

Typically indicates a race: the message was deleted by another
process between the dequeue and the checkout. The consumer advances
to the next message without recording an outcome for this one.

---

### OFFLINE\_CONSUMER

> **OFFLINE\_CONSUMER**: `3`

The consumer that was processing the message stopped heartbeating,
and another consumer's reaper recovered the message.

Set by `ReapConsumersWorker` when it unacknowledges the in-flight
messages of a peer that has gone offline.

---

### QUEUE\_INVALID\_STATE

> **QUEUE\_INVALID\_STATE**: `7`

The queue was in an unknown state, or the checkout script returned
a state marker it does not recognize.

This is a defensive cause. It indicates a version mismatch between
the deployed library and the Lua scripts installed in Redis, or
corruption of the queue's properties hash.

---

### QUEUE\_LOCKED

> **QUEUE\_LOCKED**: `8`

The queue was in the LOCKED state when the message was checked out.

Same behavior as `QUEUE_STOPPED` — the handler stops and the runner
removes the instance.

---

### QUEUE\_NOT\_FOUND

> **QUEUE\_NOT\_FOUND**: `11`

The queue does not exist.

Occurs when a message was produced to a queue that has since been
deleted, and the dequeue finds the queue's properties hash missing.

---

### QUEUE\_STATE\_CHANGED

> **QUEUE\_STATE\_CHANGED**: `10`

The queue's operational state changed between the dequeue and the
checkout.

Rare. Distinguished from the per-state causes (QUEUE_STOPPED,
QUEUE_LOCKED) because the state observed at checkout differs from
the state the consumer's local mirror expected.

---

### QUEUE\_STOPPED

> **QUEUE\_STOPPED**: `6`

The queue was in the STOPPED state when the message was checked
out.

The checkout script refuses to hand the message to the consumer.
The handler emits `shutdownRequired` and the runner removes the
instance; on resume, a fresh handler is created.

---

### SHUTTING\_DOWN

> **SHUTTING\_DOWN**: `4`

The consumer is shutting down and is unacknowledging its in-flight
messages as part of the graceful shutdown sequence.

Set by `MessageUnacknowledger.goingDown`.

---

### TIMEOUT

> **TIMEOUT**: `0`

The handler did not complete within the message's `consumeTimeout`.

The handler may still be running; its eventual result is discarded.
The message is requeued or dead-lettered according to its retry
policy.

---

### TTL\_EXPIRED

> **TTL\_EXPIRED**: `5`

The message's TTL elapsed before it was successfully processed.

Distinct from `UNACKNOWLEDGED`: the message did not fail in the
handler, it aged out. Always resolves to `DEAD_LETTER` with
`deadLetterCause: TTL_EXPIRED`.

---

### UNACKNOWLEDGED

> **UNACKNOWLEDGED**: `2`

The handler called its completion callback with an error, or an
unexpected error occurred inside the consumer pipeline.

Semantically close to `CONSUME_ERROR`. The distinction is
historical: `CONSUME_ERROR` was introduced for synchronous
exceptions, `UNACKNOWLEDGED` for callback-reported failures.

---

### UNEXPECTED\_ERROR

> **UNEXPECTED\_ERROR**: `12`

An error occurred inside the consumer machinery that does not fit
any other category.

Used as a fallback when the consumer wants to unacknowledge a
message but has no more specific classification.
