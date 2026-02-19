[RedisSMQ](../README.md) / [Docs](README.md) / Queue State Management System

# Queue State Management System

## Overview

The Queue State Management system provides a robust mechanism for controlling and tracking the operational state of
message queues. It ensures atomic state transitions, maintains history, and supports exclusive operations through an
internal locking mechanism.

## Core Concepts

### Operational States

Queues can exist in four distinct operational states:

| State       | Description           | Behavior                                                             |
| ----------- | --------------------- | -------------------------------------------------------------------- |
| **ACTIVE**  | Normal operation      | Queue processes messages normally                                    |
| **PAUSED**  | Temporarily suspended | Queue accepts messages but doesn't process them                      |
| **STOPPED** | Fully halted          | Queue is shut down and cannot process messages                       |
| **LOCKED**  | Exclusive operation   | Queue is locked for maintenance/purge operations (internal use only) |

### State Transition Rules

The system enforces strict transition rules to maintain consistency:

```
ACTIVE    → PAUSED, LOCKED, STOPPED
PAUSED    → ACTIVE, STOPPED, LOCKED
STOPPED   → ACTIVE
LOCKED    → ACTIVE, STOPPED
```

### Transition Reasons

Each state change includes a reason for auditing and debugging:

| Reason                 | Description                    |
| ---------------------- | ------------------------------ |
| `SYSTEM_INIT`          | Initial queue creation         |
| `PURGE_QUEUE_START`    | Starting queue purge operation |
| `PURGE_QUEUE_CANCEL`   | Cancelling purge operation     |
| `PURGE_QUEUE_FAIL`     | Purge operation failed         |
| `PURGE_QUEUE_COMPLETE` | Purge completed successfully   |
| `MANUAL`               | User-initiated action          |
| `SCHEDULED`            | Automated scheduled operation  |
| `EMERGENCY`            | Emergency intervention         |
| `PERFORMANCE`          | Performance-related transition |
| `ERROR`                | Error condition                |
| `RECOVERY`             | System recovery                |
| `CONFIG_CHANGE`        | Configuration update           |
| `TESTING`              | Testing/debugging              |
| `UNKNOWN`              | Unspecified reason             |

## Public API Reference

### QueueStateManager

#### Get Current State

```typescript
interface QueueStateManager {
  getState(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition>,
  ): void;
}
```

Retrieves current operational state of a queue.

**Example:**

```typescript
const stateManager = new QueueStateManager();

stateManager.getState('my-queue', (err, state) => {
  if (err) console.error('Failed to get state:', err);
  console.log(`Current state: ${EQueueOperationalState[state.to]}`);
  console.log(`Last change: ${new Date(state.timestamp)}`);
  console.log(`Reason: ${state.reason}`);
});
```

#### Pause Queue

```typescript
interface QueueStateManager {
  pause(
    queue: string | IQueueParams,
    options: TQueueStateCommonOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
}
```

Temporarily stops message processing while accepting new messages.

**Example:**

```typescript
// Pause for maintenance
stateManager.pause(
  'my-queue',
  {
    reason: EQueueStateTransitionReason.MANUAL,
    description: 'Scheduled database maintenance',
  },
  (err, transition) => {
    if (err) {
      console.error('Failed to pause queue:', err);
      return;
    }
    console.log('Queue paused at:', new Date(transition.timestamp));
  },
);
```

#### Resume Queue

```typescript
interface QueueStateManager {
  resume(
    queue: string | IQueueParams,
    options: TQueueStateCommonOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
}
```

Resumes processing from PAUSED/STOPPED state.

**Example:**

```typescript
stateManager.resume(
  'my-queue',
  {
    reason: EQueueStateTransitionReason.MANUAL,
    description: 'Maintenance complete',
  },
  (err, transition) => {
    if (err) console.error('Failed to resume:', err);
  },
);
```

#### Stop Queue

```typescript
interface QueueStateManager {
  stop(
    queue: string | IQueueParams,
    options: TQueueStateCommonOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;
}
```

Completely stops queue operations.

**Example:**

```typescript
// Emergency stop
stateManager.stop(
  queueParams,
  {
    reason: EQueueStateTransitionReason.EMERGENCY,
    description: 'Critical system error detected',
  },
  (err, transition) => {
    if (err) console.error('Failed to stop queue:', err);
  },
);
```

#### Get State History

```typescript
interface QueueStateManager {
  getStateHistory(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition[]>,
  ): void;
}
```

Retrieves complete state transition history.

**Example:**

```typescript
stateManager.getStateHistory(queueParams, (err, history) => {
  if (err) console.error('Failed to get history:', err);

  console.log('State transition history:');
  history.forEach((transition, index) => {
    const from = transition.from
      ? EQueueOperationalState[transition.from]
      : 'INITIAL';
    const to = EQueueOperationalState[transition.to];
    console.log(`${index}: ${from} → ${to} (${transition.reason})`);
  });
});
```

## Event System

State changes are published to the event bus for monitoring and integration:

```typescript
// Listen for state changes
EventMultiplexer.subscribe(
  'queue.stateChanged',
  (queue: IQueueParams, transition: IQueueStateTransition) => {
    console.log(
      `[${new Date().toISOString()}] Queue ${queue.name}@${queue.ns} state changed:`,
    );
    console.log(
      `  From: ${transition.from ? EQueueOperationalState[transition.from] : 'INITIAL'}`,
    );
    console.log(`  To: ${EQueueOperationalState[transition.to]}`);
    console.log(`  Reason: ${transition.reason}`);
    console.log(`  Description: ${transition.description || 'N/A'}`);
  },
);
```

## Sample Usage Pattern

```typescript
import bluebird from 'bluebird';

const stateManager = bluebird.promisifyAll(newQueueStateManager());

// Maintenance workflow
async function performMaintenance(queue: IQueueParams) {
  // 1. Pause the queue
  await stateManager.pauseAsync(queue, {
    reason: EQueueStateTransitionReason.SCHEDULED,
    description: 'Nightly maintenance',
  });

  try {
    // 2. Perform maintenance tasks
    await performMaintenanceTasks(queue);

    // 3. Resume the queue
    await stateManager.resumeAsync(queue, {
      reason: EQueueStateTransitionReason.SCHEDULED,
      description: 'Maintenance completed',
    });
  } catch (err) {
    // 4. Handle errors - maybe resume or alert
    console.error('Maintenance failed:', err);
    await stateManager.resumeAsync(queue, {
      reason: EQueueStateTransitionReason.ERROR,
      description: 'Resuming after failed maintenance',
    });
  }
}
```

## Best Practices

1. **Always Provide Reasons**: Include meaningful reasons and descriptions for auditability
2. **Monitor State Changes**: Subscribe to events for real-time monitoring
3. **Handle Errors Gracefully**: Always check for errors in callbacks
4. **Use Appropriate Reasons**: Match the reason to the actual trigger (MANUAL vs SCHEDULED vs ERROR)
5. **Don't Bypass the Manager**: Always use QueueStateManager methods, never manipulate Redis directly

---

The Queue State Management system provides a robust foundation for controlling queue operations with strong consistency
guarantees, comprehensive audit trails, and flexible integration points for monitoring and automation.

The API is designed to be intuitive for end users while keeping complex locking mechanisms internal to prevent misuse.

**Related**:

- [QueueStateManager API](api/classes/QueueStateManager.md) - Complete API details
- [Queues](queues.md) - Queue management
- [Queue Rate Limiting](queue-rate-limiting.md) - How queue rate limiting works
