[RedisSMQ](../README.md) / [Documentation](README.md) / Queue State Management

# Queue State Management

Control and track the operational state of queues. Pause processing, stop queues entirely, resume normal operation, and view the transition history.

## Quick Start

```javascript
const { RedisSMQ, EStateTransitionReason } = require('redis-smq');
const stateManager = RedisSMQ.createQueueStateManager();

// Pause a queue
const pauseTransition = await stateManager.pause('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Scheduled database maintenance',
});
console.log('Queue paused at:', new Date(pauseTransition.timestamp));

// Resume a queue
const resumeTransition = await stateManager.resume('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance complete',
});
console.log('Queue resumed');
```

The `options` argument is required but may be `null` when no context is needed:

```javascript
await stateManager.pause('orders', null);
```

## States

| State       | Accepts messages | Delivers messages | Description                                |
| ----------- | ---------------- | ----------------- | ------------------------------------------ |
| **ACTIVE**  | Yes              | Yes               | Normal operation                           |
| **PAUSED**  | Yes              | No                | Buffers messages, stops processing         |
| **STOPPED** | No               | No                | Fully halted — neither produce nor consume |
| **LOCKED**  | No               | No                | Exclusive maintenance; **internal only**   |

The first three states are reachable through the public API (`pause`, `resume`, `stop`). `LOCKED` is set by library internals — the purge-queue job is the only current user — and released by the same internal code when the job completes or fails. A caller cannot acquire or release a lock directly through `QueueStateManager`.

State is a property of the queue itself, not of any consumer group. All consumer groups on a queue share the same operational state.

## Managing State

### Pause a Queue

Temporarily stop processing while continuing to accept new messages:

```javascript
await stateManager.pause('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Scheduled database maintenance',
});
```

In `PAUSED`, the queue continues to accept publishes; they accumulate in the pending list. Consumers that were subscribed are stopped by the runner; they restart when the queue returns to `ACTIVE`.

`pause` is a no-op if the queue is already `PAUSED`. Pausing a `STOPPED` or `LOCKED` queue rejects with `QueueStateTransitionError` — those states must transition to `ACTIVE` first, then to `PAUSED`.

Fails with `QueueNotFoundError` if the queue does not exist.

### Resume a Queue

Move a queue to `ACTIVE`:

```javascript
await stateManager.resume('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance complete',
});
```

Valid from `PAUSED` and `STOPPED`. A `resume` of a `LOCKED` queue is not reachable through the public API — the lock must be released by the subsystem that acquired it.

`resume` is a no-op if the queue is already `ACTIVE`. Attempting to resume an already-active queue rejects with `QueueStateTransitionError` (the transition rule table has no `ACTIVE → ACTIVE` entry).

Fails with `QueueNotFoundError` if the queue does not exist.

### Stop a Queue

Halt the queue completely:

```javascript
await stateManager.stop('orders', {
  reason: EStateTransitionReason.EMERGENCY,
  description: 'Database connection pool exhausted',
});
```

In `STOPPED`, neither producing nor consuming is allowed. Consumers are disconnected. To resume consumption, transition the queue back to `ACTIVE`.

Valid from `ACTIVE` and `PAUSED`. `stop` on a `STOPPED` queue is a no-op; `stop` on a `LOCKED` queue rejects with `QueueStateTransitionError`.

Fails with `QueueNotFoundError` if the queue does not exist.

### Get Current State

```javascript
const transition = await stateManager.getState('orders');

console.log('Current state:', EQueueOperationalState[transition.to]);
console.log('Since:', new Date(transition.timestamp));
console.log('Reason:', transition.reason);
console.log('Description:', transition.description);
```

`getState` returns the **latest transition**, not a synthesized snapshot. Its `to` field is the queue's current state; its `from`, `reason`, `timestamp`, and `description` describe how the queue arrived there. The `lockId` and `lockOwner` fields are present only on transitions to or from `LOCKED`.

Fails with `QueueNotFoundError` if the queue does not exist.

### Get State History

```javascript
const history = await stateManager.getStateHistory('orders');

history.forEach((t) => {
  const from = t.from === null ? 'INITIAL' : EQueueOperationalState[t.from];
  const to = EQueueOperationalState[t.to];
  console.log(`${from} → ${to} (${t.reason}) — ${t.description ?? ''}`);
});
```

History is ordered **newest-first** — index 0 is the most recent transition. The list is capped at 50 entries; older entries are dropped as new ones arrive.

Note that `from` is `null` only for the queue's creation entry (`SYSTEM_INIT`), not for any other transition. Checking `t.from === null` explicitly is correct; `t.from || 'INITIAL'` would incorrectly treat `ACTIVE` (whose enum value is `0`) as initial.

Fails with `QueueNotFoundError` if the queue does not exist.

## Transition Options

Every mutating method accepts an options object (or `null`):

| Option        | Type   | Description                                                                         |
| ------------- | ------ | ----------------------------------------------------------------------------------- |
| `reason`      | enum   | Why the state changed. Defaults to `EStateTransitionReason.MANUAL` when omitted.    |
| `description` | string | Human-readable explanation. Auto-synthesized from the reason and states if omitted. |
| `metadata`    | object | Arbitrary JSON-serializable key-value data for the transition record.               |

### Reasons

`EStateTransitionReason` values accepted from callers:

| Value           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `MANUAL`        | Explicit operator or application action. The default.          |
| `SCHEDULED`     | Part of a scheduled maintenance window.                        |
| `EMERGENCY`     | In response to a failing service or a data integrity issue.    |
| `PERFORMANCE`   | To shed load or protect a downstream system.                   |
| `ERROR`         | Triggered automatically from an error handler.                 |
| `CONFIG_CHANGE` | To apply a configuration change (rate limit, retention, etc.). |
| `TESTING`       | Made by a test harness; filtered out of production audits.     |
| `OTHER`         | Does not fit any other category.                               |

A separate enum — `ESystemStateTransitionReason` — records transitions the library makes on its own (`SYSTEM_INIT`, `RECOVERY`, purge-job lifecycle). Those reasons are never supplied by a caller and appear on the transition history alongside the caller-supplied ones.

### Metadata

The `metadata` bag is serialized with the transition record and is available on every read that returns a transition (`getState`, `getStateHistory`, and the `queue.stateChanged` event). Use it to record anything a post-incident review would want — ticket IDs, operator names, correlation IDs.

```javascript
await stateManager.pause('orders', {
  reason: EStateTransitionReason.SCHEDULED,
  description: 'Nightly maintenance window',
  metadata: {
    ticket: 'INC-12345',
    operator: 'on-call-rotation',
    estimated_duration_minutes: 30,
  },
});
```

## State Transition Rules

```
ACTIVE  → PAUSED, STOPPED, LOCKED
PAUSED  → ACTIVE, STOPPED, LOCKED
STOPPED → ACTIVE
LOCKED  → ACTIVE, STOPPED
```

The table describes every transition the state machine permits. Two of these are **not reachable through the public API**:

- **Any transition into `LOCKED`** — the state is set by `PurgeQueueJobManager` when a purge job starts. There is no public method for acquiring a lock.
- **Any transition out of `LOCKED`** — the state is released by the same internal subsystem when the job completes, fails, or is cancelled. `resume` and `stop` against a locked queue reject.

A caller who wants "no consumption, no production, but resumable in one step" uses `STOPPED`. A caller who wants "no consumption, production allowed" uses `PAUSED`.

Attempting an invalid transition rejects with `QueueStateTransitionError`. For example, a `STOPPED` queue cannot be paused — it must be resumed first.

## Listening to State Changes

State changes are published on the event bus:

```javascript
const { RedisSMQ } = require('redis-smq');

const eventBus = RedisSMQ.getEventBus();
await eventBus.run();

eventBus.on('queue.stateChanged', (queue, transition) => {
  console.log(
    `Queue ${queue.name}@${queue.ns}: ` +
      `${EQueueOperationalState[transition.to]} (${transition.reason})`,
  );
});
```

The `queue` argument is `IQueueParams` — name and namespace. The transition carries the same shape returned by `getState`. See [Event Bus](event-bus.md) for the bus's start-before-subscribe requirement.

## Promise Style

Every method supports both callback and promise forms. The callback form passes an `(err, result)` callback as the last argument; `options` remains positionally required:

```javascript
// Promise
const transition = await stateManager.pause('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance window',
});

// Callback
stateManager.pause(
  'orders',
  { reason: EStateTransitionReason.MANUAL, description: 'Maintenance window' },
  (err, transition) => {
    if (err) console.error('Failed to pause:', err);
    else console.log('Paused at:', new Date(transition.timestamp));
  },
);
```

`getState` and `getStateHistory` take no options, so their callback form is `(queue, cb)`.

## Common Patterns

### Maintenance Workflow

Always resume in a `finally` block so a failed maintenance task does not leave the queue paused indefinitely:

```javascript
async function performMaintenance(queue) {
  await stateManager.pause(queue, {
    reason: EStateTransitionReason.SCHEDULED,
    description: 'Nightly maintenance',
  });

  try {
    await performMaintenanceTasks(queue);
  } finally {
    await stateManager.resume(queue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Maintenance completed',
    });
  }
}
```

### Emergency Stop

```javascript
await stateManager.stop(queue, {
  reason: EStateTransitionReason.EMERGENCY,
  description: 'Database connection pool exhausted',
  metadata: { incidentId: 'INC-2024-001' },
});
```

### Graceful Shutdown of a Single Queue

`STOPPED` transitions halt consumption immediately; in-flight messages are unacknowledged by the consumer's shutdown path and resolved according to their retry policy. To drain first, `PAUSE` and wait for `pendingMessagesCount` to reach zero before transitioning to `STOPPED`.

## Related

- [Queue State Management Concepts](https://github.com/weyoss/redis-smq-docs) — How state management works
- [Validating Queue Operations](validating-queue-operations.md) — Check whether an operation is allowed before attempting it
- [Queue Management](queue-management.md) — Create, inspect, and delete queues
- [Event Bus](event-bus.md) — Subscribing to `queue.stateChanged`
