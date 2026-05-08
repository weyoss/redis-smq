# Queue State Management

Control and track the operational state of queues. Pause processing, stop queues entirely, resume normal operation, and view state history.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const stateManager = RedisSMQ.createQueueStateManager();

// Pause a queue
stateManager.pause('orders', null, (err, transition) => {
  if (err) console.error('Failed:', err);
  else console.log('Queue paused at:', new Date(transition.timestamp));
});

// Resume a queue
stateManager.resume('orders', null, (err, transition) => {
  if (err) console.error('Failed:', err);
  else console.log('Queue resumed');
});
```

## States

| State       | Accepts Messages | Delivers Messages | Description                        |
| ----------- | ---------------- | ----------------- | ---------------------------------- |
| **ACTIVE**  | Yes              | Yes               | Normal operation                   |
| **PAUSED**  | Yes              | No                | Buffers messages, stops processing |
| **STOPPED** | No               | No                | Fully halted                       |
| **LOCKED**  | No               | No                | Exclusive maintenance (internal)   |

## Managing State

### Pause a Queue

Temporarily stops processing while accepting new messages:

```javascript
stateManager.pause(
  'orders',
  {
    reason: 'MANUAL',
    description: 'Scheduled database maintenance',
  },
  (err, transition) => {
    if (err) console.error('Failed to pause:', err);
  },
);
```

### Resume a Queue

Resumes processing from PAUSED or STOPPED state:

```javascript
stateManager.resume(
  'orders',
  {
    reason: 'MANUAL',
    description: 'Maintenance complete',
  },
  (err, transition) => {
    if (err) console.error('Failed to resume:', err);
  },
);
```

### Stop a Queue

Completely halts the queue:

```javascript
stateManager.stop(
  'orders',
  {
    reason: 'EMERGENCY',
    description: 'Critical system error detected',
  },
  (err, transition) => {
    if (err) console.error('Failed to stop:', err);
  },
);
```

### Get Current State

```javascript
stateManager.getState('orders', (err, transition) => {
  if (err) console.error('Failed:', err);
  else console.log('Current state:', transition.to);
  console.log('Since:', new Date(transition.timestamp));
  console.log('Reason:', transition.reason);
});
```

### Get State History

```javascript
stateManager.getStateHistory('orders', (err, history) => {
  if (err) console.error('Failed:', err);
  else {
    history.forEach((t) => {
      const from = t.from || 'INITIAL';
      console.log(`${from} → ${t.to} (${t.reason}) - ${t.description || ''}`);
    });
  }
});
```

## Transition Options

Each state change can include:

| Option        | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `reason`      | Why the state changed (MANUAL, SCHEDULED, EMERGENCY, etc.) |
| `description` | Human-readable explanation                                 |
| `metadata`    | Arbitrary key-value data                                   |

## Listening to State Changes

```javascript
eventBus.on('queue.stateChanged', (queue, transition) => {
  console.log(`Queue ${queue.name}: ${transition.to}`);
  console.log(`Reason: ${transition.reason}`);
});
```

## Promise Style

```javascript
const transition = await stateManager.pause('orders', {
  reason: 'MANUAL',
  description: 'Maintenance window',
});

const history = await stateManager.getStateHistory('orders');
```

## Common Patterns

### Maintenance Workflow

```javascript
async function performMaintenance(queue) {
  // Pause
  await stateManager.pause(queue, {
    reason: 'SCHEDULED',
    description: 'Nightly maintenance',
  });

  try {
    await performMaintenanceTasks(queue);
  } finally {
    // Always resume
    await stateManager.resume(queue, {
      reason: 'SCHEDULED',
      description: 'Maintenance completed',
    });
  }
}
```

### Emergency Stop

```javascript
// Stop immediately, provide context for later debugging
await stateManager.stop(queue, {
  reason: 'EMERGENCY',
  description: 'Database connection pool exhausted',
});
```

## State Transition Rules

```
ACTIVE  → PAUSED, STOPPED, LOCKED
PAUSED  → ACTIVE, STOPPED, LOCKED
STOPPED → ACTIVE
LOCKED  → ACTIVE, STOPPED
```

Invalid transitions return an error. For example, a STOPPED queue cannot be paused — it must be resumed first.

## Related

- [Queue State Management Concepts](https://github.com/weyoss/redis-smq-docs) — How state management works
- [Validating Queue Operations](validating-queue-operations.md) — Check if operations are allowed
