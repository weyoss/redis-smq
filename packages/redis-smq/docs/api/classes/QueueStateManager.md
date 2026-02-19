[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueStateManager

# Class: QueueStateManager

Manages queue operational states and transitions

The QueueStateManager provides a comprehensive interface for controlling and monitoring
the operational state of message queues. It ensures atomic state transitions,
maintains a complete audit trail of all state changes, and enforces transition rules
to maintain system consistency.

Key features:

- Atomic state transitions with validation
- Complete state history tracking
- Event emission for state changes (via EventMultiplexer)
- Support for paused, active, and stopped states
- Internal locking mechanism for system operations (not exposed to end users)

## Example

```typescript
const stateManager = new QueueStateManager();

// Pause a queue for maintenance
stateManager.pause(
  { name: 'orders', ns: 'production' },
  {
    reason: EQueueStateTransitionReason.SCHEDULED,
    description: 'Database maintenance window',
  },
  (err, transition) => {
    if (err) console.error('Failed to pause:', err);
    console.log('Queue paused at:', new Date(transition.timestamp));
  },
);

// Get current state
stateManager.getState('orders@production', (err, state) => {
  console.log('Current state:', EQueueOperationalState[state.to]);
  console.log('Last transition:', new Date(state.timestamp));
});
```

## Constructors

### Constructor

> **new QueueStateManager**(): `QueueStateManager`

#### Returns

`QueueStateManager`

## Methods

### getState()

> **getState**(`queue`, `cb`): `void`

Retrieves the current operational state of a queue

This method returns the complete state transition information for the queue,
including the current state, when it was last changed, and the reason for
the last transition.

#### Parameters

##### queue

Queue identifier (either string in format "name@namespace" or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Callback function that receives either an error or the current state information

#### Returns

`void`

#### Example

```typescript
// Using string format
stateManager.getState('orders@production', (err, state) => {
  if (err) return;

  console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
  console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
  console.log(`Reason: ${state.reason}`);

  if (state.lockOwner) {
    console.log(`Locked by: ${state.lockOwner}`); // Internal use only
  }
});

// Using object format
stateManager.getState({ name: 'orders', ns: 'production' }, callback);
```

#### Throws

If queue exists but no state information is found

---

### getStateHistory()

> **getStateHistory**(`queue`, `cb`): `void`

Retrieves the complete state transition history for a queue

This method returns an array of all state transitions that have occurred
for the specified queue, from oldest to newest. The history is maintained
as an audit trail and can be used for:

- Compliance and auditing
- Debugging operational issues
- Analyzing queue behavior over time
- Generating reports on queue availability

The history is limited to recent transitions (configurable via
maxQueueStateHistorySize in the state transition script).

#### Parameters

##### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

Callback receiving either an error or an array of state transitions

#### Returns

`void`

#### Example

```typescript
// Get full history
stateManager.getStateHistory('orders@production', (err, history) => {
  if (err) {
    console.error('Failed to get history:', err);
    return;
  }

  console.log(`Queue has ${history.length} state transitions`);

  // Analyze uptime/downtime
  let totalDowntime = 0;
  let lastActiveTime = null;

  history.forEach((transition, index) => {
    const from = transition.from
      ? EQueueOperationalState[transition.from]
      : 'INITIAL';
    const to = EQueueOperationalState[transition.to];
    const time = new Date(transition.timestamp);

    console.log(`${index}: ${from} → ${to} at ${time.toISOString()}`);
    console.log(`  Reason: ${transition.reason}`);
    console.log(`  Description: ${transition.description || 'N/A'}`);

    // Calculate downtime if leaving ACTIVE state
    if (from === 'ACTIVE' && to !== 'ACTIVE' && lastActiveTime) {
      const downtime = transition.timestamp - lastActiveTime;
      totalDowntime += downtime;
      console.log(`  Downtime: ${downtime}ms`);
    }

    if (to === 'ACTIVE') {
      lastActiveTime = transition.timestamp;
    }
  });

  console.log(`Total downtime: ${totalDowntime}ms`);
});

// Filter for specific reasons
stateManager.getStateHistory('email-worker@production', (err, history) => {
  const emergencyStops = history.filter(
    (t) => t.reason === EQueueStateTransitionReason.EMERGENCY,
  );
  console.log(`Emergency stops: ${emergencyStops.length}`);
});
```

#### Throws

If queue exists but no history is found

---

### pause()

> **pause**(`queue`, `options`, `cb`): `void`

Temporarily pauses message processing for a queue

When paused, the queue continues to accept new messages but stops processing them.
This is useful for maintenance activities, deployment windows, or temporarily
halting processing due to downstream issues.

Valid transitions to PAUSED:

- From ACTIVE (normal operation → paused)
- From STOPPED (if resuming then immediately pausing is not recommended - use resume instead)

#### Parameters

##### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### options

Configuration options for the pause operation

[`TQueueStateCommonOptions`](../type-aliases/TQueueStateCommonOptions.md) | `null`

##### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Callback receiving the completed state transition record

#### Returns

`void`

#### Example

```typescript
// Simple pause
stateManager.pause('orders@production', null, (err, transition) => {
  if (err) console.error('Failed to pause:', err);
});

// Pause with detailed reason
stateManager.pause(
  { name: 'email-worker', ns: 'production' },
  {
    reason: EQueueStateTransitionReason.PERFORMANCE,
    description: 'Email service latency spike detected',
    metadata: {
      service: 'smtp-provider',
      latency: '2500ms',
      incidentId: 'INC-2024-123',
    },
  },
  (err, transition) => {
    if (err) {
      if (err.code === 'INVALID_STATE_TRANSITION') {
        console.log('Queue cannot be paused from its current state');
      }
      return;
    }

    // Notify monitoring system
    notifyMonitoring('queue-paused', {
      queue: 'email-worker@production',
      timestamp: transition.timestamp,
    });
  },
);
```

#### Emits

queue.stateChanged - Emitted after successful state transition

---

### resume()

> **resume**(`queue`, `options`, `cb`): `void`

Resumes message processing for a previously paused or stopped queue

This method transitions a queue back to the ACTIVE state, allowing it to
resume normal message processing. It can be called on queues in either
PAUSED or STOPPED states.

Valid transitions to ACTIVE:

- From PAUSED (resume normal operation)
- From STOPPED (restart a stopped queue)

Note: Cannot resume a queue that is LOCKED (internal state) - locks are
managed automatically by system components.

#### Parameters

##### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### options

Configuration options for the resume operation

[`TQueueStateCommonOptions`](../type-aliases/TQueueStateCommonOptions.md) | `null`

##### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Callback receiving the completed state transition record

#### Returns

`void`

#### Example

```typescript
// Resume a paused queue
stateManager.resume(
  'orders@production',
  {
    reason: EQueueStateTransitionReason.RECOVERY,
    description: 'Database maintenance completed',
    metadata: {
      downtime: '45s',
      maintenanceWindow: '2024-01-15T02:00:00Z',
    },
  },
  (err, transition) => {
    if (err) {
      if (err.code === 'QUEUE_NOT_FOUND') {
        console.log('Queue does not exist');
      }
      return;
    }

    console.log('Queue resumed at:', new Date(transition.timestamp));
  },
);

// Resume with default options
stateManager.resume('email-worker@production', null, callback);
```

#### Emits

queue.stateChanged - Emitted after successful state transition

---

### stop()

> **stop**(`queue`, `options`, `cb`): `void`

Completely stops a queue from processing messages

When stopped, the queue will not accept new messages nor process existing ones.
This is a more severe state than PAUSED and is typically used for:

- Emergency situations (critical errors, security incidents)
- Queue deletion preparation
- Complete system shutdown

Valid transitions to STOPPED:

- From ACTIVE (emergency stop)
- From PAUSED (stop from paused state)
- From LOCKED (internal use only)

#### Parameters

##### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### options

Configuration options for the stop operation

[`TQueueStateCommonOptions`](../type-aliases/TQueueStateCommonOptions.md) | `null`

##### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Callback receiving the completed state transition record

#### Returns

`void`

#### Example

```typescript
// Emergency stop due to system error
stateManager.stop(
  'payment-processor@production',
  {
    reason: EQueueStateTransitionReason.EMERGENCY,
    description: 'Payment gateway security breach detected',
    metadata: {
      incidentId: 'SEC-2024-456',
      severity: 'critical',
      timestamp: Date.now(),
    },
  },
  (err, transition) => {
    if (err) {
      console.error('Failed to stop queue:', err);
      return;
    }

    // Alert on-call team
    alertTeam({
      type: 'queue-emergency-stop',
      queue: 'payment-processor@production',
      time: new Date(transition.timestamp),
    });
  },
);

// Scheduled maintenance stop
stateManager.stop(
  'analytics@production',
  {
    reason: EQueueStateTransitionReason.SCHEDULED,
    description: 'Weekly maintenance window',
  },
  callback,
);
```

#### Emits

queue.stateChanged - Emitted after successful state transition
