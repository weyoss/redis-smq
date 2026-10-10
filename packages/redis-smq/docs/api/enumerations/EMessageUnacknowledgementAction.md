[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessageUnacknowledgementAction

# Enumeration: EMessageUnacknowledgementAction

What the library did with a message as a result of an
unacknowledgement.

The action is the outcome, not the intent. A message with cause
`TIMEOUT` may resolve to `REQUEUE`, `DELAY`, or `DEAD_LETTER`
depending on the message's retry policy and prior attempts. The
action recorded on a history record is the one that was actually
taken.

The integer values are compared inside the unacknowledgement Lua
script and passed as positional arguments. They are not persisted to
Redis directly — the serialized history record stores the resolution
outcome, not the enum value — but reordering them would break the
script's argument convention. Treat the ordering as fixed.

## Enumeration Members

### DEAD\_LETTER

> **DEAD\_LETTER**: `0`

Move the message to the dead-letter list.

Chosen when the message's retry policy says it should not be
retried: TTL has expired, the retry threshold has been reached, or
the message is a periodic scheduled message that has completed its
cycle.

---

### DELAY

> **DELAY**: `2`

Move the message to the delayed set for a scheduled retry.

Chosen for a failed message whose retry policy allows another
attempt and whose retry delay is positive. The message is placed in
the delayed sorted set with a score of `now + retryDelay`.

---

### REQUEUE

> **REQUEUE**: `1`

Move the message back to the pending list for immediate retry.

Chosen for a failed message whose retry policy allows another
attempt and whose retry delay is zero.
