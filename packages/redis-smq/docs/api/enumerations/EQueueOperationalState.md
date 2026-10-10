[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueOperationalState

# Enumeration: EQueueOperationalState

Operational states a queue can be in.

States are mutually exclusive. A queue occupies exactly one at any
moment. The state is authoritative in Redis (`keyQueueProperties`) and
is mirrored locally by consumers; the Redis value wins whenever the
two disagree.

Transitions between states are validated by a rule table (see
`_isAllowedTransition`). Attempting an invalid transition — for
example, STOPPED -> PAUSED — fails with a transition error rather than
silently moving the queue to the new state.

The integer values are part of the Redis wire format. They are used as
values of the `OPERATIONAL_STATE` hash field and as arguments to the
queue-state Lua scripts. Reordering or renumbering this enum is a
breaking change to persisted data.

## Enumeration Members

### ACTIVE

> **ACTIVE**: `0`

Queue is operating normally.

- Consuming messages
- Accepting new messages
- All operations enabled

---

### LOCKED

> **LOCKED**: `3`

Queue is held under an exclusive lock.

- NOT consuming messages (except by the lock holder)
- NOT accepting new messages
- External operations blocked
- The lock holder has exclusive access

Typical use: administrative operations, bulk data operations,
schema migrations, critical repairs.

---

### PAUSED

> **PAUSED**: `1`

Queue processing is temporarily paused.

- NOT consuming messages
- CAN accept new messages (they buffer in pending)
- Message handlers remain subscribed
- In-flight messages complete or time out normally
- Quick to resume

Typical use: rolling deployments, downstream service degradation,
short maintenance windows, debugging a live queue.

---

### STOPPED

> **STOPPED**: `2`

Queue is completely shut down.

- NOT consuming messages
- NOT accepting new messages
- Message handlers are disconnected

Typical use: prolonged maintenance, resource reclamation,
long-term disabling, emergency intervention.
