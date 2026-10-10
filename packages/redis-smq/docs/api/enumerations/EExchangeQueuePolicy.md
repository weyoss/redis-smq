[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EExchangeQueuePolicy

# Enumeration: EExchangeQueuePolicy

Which queue types an exchange accepts bindings from.

An exchange is created with a queue policy, and that policy is
enforced on every subsequent `bindQueue`. Attempting to bind a queue
whose type does not match the exchange's policy fails with
`ExchangeQueuePolicyMismatchError`.

The policy exists because the two categories of queues have different
message-ordering semantics and different pending data structures:

- STANDARD: FIFO and LIFO queues. Messages flow through Redis lists;
  ordering is first-in-first-out or last-in-first-out depending on
  the queue type.

- PRIORITY: PRIORITY_QUEUE queues. Messages flow through a Redis
  sorted set scored by priority; ordering is by priority level, then
  by insertion order within a level.

Mixing the two under a single exchange would make the exchange's
behavior ambiguous. The library refuses the mix rather than silently
picking one semantics over the other.

The integer values are persisted in Redis (as the `QUEUE_POLICY` field
of the exchange's properties hash). Reordering or renumbering is a
breaking change to persisted data.

## Enumeration Members

### PRIORITY

> **PRIORITY**: `1`

---

### STANDARD

> **STANDARD**: `0`
