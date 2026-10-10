[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EMessageDeadLetterCause

# Enumeration: EMessageDeadLetterCause

The specific reason a message was dead-lettered.

Present on an unacknowledgement history record only when the
resolution action is `DEAD_LETTER`. Distinguishes the three paths that
lead to the dead-letter list, so a caller can tell whether the
message failed because of a message-level policy (TTL, retry
threshold) or because of the message's scheduling nature (periodic
completion).

The integer values are passed as positional arguments to the
unacknowledgement Lua script. Treat the ordering as fixed.

## Enumeration Members

### PERIODIC\_MESSAGE

> **PERIODIC\_MESSAGE**: `2`

The message is a periodic scheduled message that has completed its
configured number of firings.

Periodic messages are delivered on a CRON schedule or a fixed repeat
count. A failure that occurs after the schedule has ended is not
retried — retrying would restart the cycle, which is not what the
caller asked for. Instead, the message is dead-lettered with this
cause.

---

### RETRY\_THRESHOLD\_EXCEEDED

> **RETRY\_THRESHOLD\_EXCEEDED**: `1`

The message failed processing more times than its retry threshold
allows.

The threshold is a per-message configuration
(`ProducibleMessage.setRetryThreshold`). A message with
`retryThreshold: 3` is dead-lettered after its third failed attempt.

---

### TTL\_EXPIRED

> **TTL\_EXPIRED**: `0`

The message's TTL elapsed before it was successfully processed.

The TTL is evaluated at checkout: the consumer compares
`createdAt + ttl` against the current time. An expired message is
not handed to the handler; it is dead-lettered directly.
