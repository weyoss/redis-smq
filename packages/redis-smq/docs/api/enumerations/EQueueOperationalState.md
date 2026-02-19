[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EQueueOperationalState

# Enumeration: EQueueOperationalState

Queue operational states representing the current mode of queue processing.
These states are mutually exclusive - a queue can only be in one state at a time.

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

Queue has an exclusive lock for operations.

- **NOT** consuming messages (except lock holder)
- **NOT** accepting new messages
- External operations blocked
- Lock holder has exclusive access

#### Example

```ts
// Use cases:
// - Administrative operations
// - Bulk data operations
// - Schema migrations
// - Critical repairs
```

---

### PAUSED

> **PAUSED**: `1`

Queue processing is temporarily paused.

- **NOT** consuming messages
- **CAN** accept new messages (messages buffer)
- Message handler remain subscribed
- In-flight messages complete or timeout
- Quick resume capability

#### Example

```ts
// Use cases:
// - Rolling deployments
// - Downstream service issues
// - Temporary maintenance
// - Debugging/inspection
```

---

### STOPPED

> **STOPPED**: `2`

Queue is completely shut down.

- **NOT** consuming messages
- **NOT** accepting new messages
- All message handler are disconnected

#### Example

```ts
// Use cases:
// - Major maintenance
// - Resource reclamation
// - Long-term disabling
// - Emergency intervention
```
