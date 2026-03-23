[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueStateManager

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

// Using callback
stateManager.getState('orders@production', (err, state) => {
  if (err) console.error('Failed to get state:', err);
  else console.log('Queue state:', EQueueOperationalState[state.to]);
});

// Using promise
const state = await stateManager.getState('orders@production');
console.log('Queue state:', EQueueOperationalState[state.to]);
```

## Constructors

### Constructor

> **new QueueStateManager**(): `QueueStateManager`

#### Returns

`QueueStateManager`

## Methods

### getState()

#### Call Signature

> **getState**(`queue`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Retrieves the current operational state of a queue

This method returns the complete state transition information for the queue,
including the current state, when it was last changed, and the reason for
the last transition.

##### Parameters

###### queue

Queue identifier (either string in format "name@namespace" or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

- Returns a Promise if no callback is provided

##### Throws

If queue exists but no state information is found

##### Example

```typescript
// Callback pattern
stateManager.getState('orders@production', (err, state) => {
  if (err) {
    console.error('Failed to get state:', err);
  } else {
    console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
    console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
    console.log(`Reason: ${state.reason}`);
  }
});

// Promise pattern
try {
  const state = await stateManager.getState({
    name: 'orders',
    ns: 'production',
  });
  console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
  console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
} catch (err) {
  console.error('Failed to get state:', err);
}
```

#### Call Signature

> **getState**(`queue`, `cb`): `void`

Retrieves the current operational state of a queue

This method returns the complete state transition information for the queue,
including the current state, when it was last changed, and the reason for
the last transition.

##### Parameters

###### queue

Queue identifier (either string in format "name@namespace" or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Optional callback function that receives either an error or the current state information

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

If queue exists but no state information is found

##### Example

```typescript
// Callback pattern
stateManager.getState('orders@production', (err, state) => {
  if (err) {
    console.error('Failed to get state:', err);
  } else {
    console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
    console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
    console.log(`Reason: ${state.reason}`);
  }
});

// Promise pattern
try {
  const state = await stateManager.getState({
    name: 'orders',
    ns: 'production',
  });
  console.log(`Queue is: ${EQueueOperationalState[state.to]}`);
  console.log(`Last changed: ${new Date(state.timestamp).toISOString()}`);
} catch (err) {
  console.error('Failed to get state:', err);
}
```

---

### getStateHistory()

#### Call Signature

> **getStateHistory**(`queue`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

Retrieves the complete state transition history for a queue

This method returns an array of all state transitions that have occurred
for the specified queue, from oldest to newest. The history is maintained
as an audit trail and can be used for:

- Compliance and auditing
- Debugging operational issues
- Analyzing queue behavior over time
- Generating reports on queue availability

The history is limited to recent transitions.

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

- Returns a Promise if no callback is provided

##### Throws

If queue exists but no history is found

##### Example

```typescript
// Callback pattern - get history
stateManager.getStateHistory('orders@production', (err, history) => {
  if (err) {
    console.error('Failed to get history:', err);
  } else {
    console.log(`Queue has ${history.length} state transitions`);
    history.forEach((transition, idx) => {
      const from = transition.from
        ? EQueueOperationalState[transition.from]
        : 'INITIAL';
      const to = EQueueOperationalState[transition.to];
      console.log(
        `${idx}: ${from} → ${to} at ${new Date(transition.timestamp).toISOString()}`,
      );
    });
  }
});

// Promise pattern - analyze emergency stops
try {
  const history = await stateManager.getStateHistory('email-worker@production');
  const emergencyStops = history.filter(
    (t) => t.reason === EStateTransitionReason.EMERGENCY,
  );
  console.log(`Emergency stops: ${emergencyStops.length}`);
  console.log(`Total transitions: ${history.length}`);
} catch (err) {
  console.error('Failed to get history:', err);
}
```

#### Call Signature

> **getStateHistory**(`queue`, `cb`): `void`

Retrieves the complete state transition history for a queue

This method returns an array of all state transitions that have occurred
for the specified queue, from oldest to newest. The history is maintained
as an audit trail and can be used for:

- Compliance and auditing
- Debugging operational issues
- Analyzing queue behavior over time
- Generating reports on queue availability

The history is limited to recent transitions.

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

Optional callback receiving either an error or an array of state transitions

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

If queue exists but no history is found

##### Example

```typescript
// Callback pattern - get history
stateManager.getStateHistory('orders@production', (err, history) => {
  if (err) {
    console.error('Failed to get history:', err);
  } else {
    console.log(`Queue has ${history.length} state transitions`);
    history.forEach((transition, idx) => {
      const from = transition.from
        ? EQueueOperationalState[transition.from]
        : 'INITIAL';
      const to = EQueueOperationalState[transition.to];
      console.log(
        `${idx}: ${from} → ${to} at ${new Date(transition.timestamp).toISOString()}`,
      );
    });
  }
});

// Promise pattern - analyze emergency stops
try {
  const history = await stateManager.getStateHistory('email-worker@production');
  const emergencyStops = history.filter(
    (t) => t.reason === EStateTransitionReason.EMERGENCY,
  );
  console.log(`Emergency stops: ${emergencyStops.length}`);
  console.log(`Total transitions: ${history.length}`);
} catch (err) {
  console.error('Failed to get history:', err);
}
```

---

### pause()

#### Call Signature

> **pause**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Temporarily pauses message processing for a queue

When paused, the queue continues to accept new messages but stops processing them.
This is useful for maintenance activities, deployment windows, or temporarily
halting processing due to downstream issues.

Valid transitions to PAUSED:

- From ACTIVE (normal operation → paused)
- From STOPPED (if resuming then immediately pausing is not recommended - use resume instead)

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the pause operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - simple pause
stateManager.pause('orders@production', null, (err, transition) => {
  if (err) {
    console.error('Failed to pause:', err);
  } else {
    console.log('Queue paused at:', new Date(transition.timestamp));
  }
});

// Promise pattern - pause with detailed reason
try {
  const transition = await stateManager.pause(
    { name: 'email-worker', ns: 'production' },
    {
      reason: EStateTransitionReason.PERFORMANCE,
      description: 'Email service latency spike detected',
      metadata: { latency: '2500ms' },
    },
  );
  console.log('Queue paused at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to pause:', err);
}
```

#### Call Signature

> **pause**(`queue`, `options`, `cb`): `void`

Temporarily pauses message processing for a queue

When paused, the queue continues to accept new messages but stops processing them.
This is useful for maintenance activities, deployment windows, or temporarily
halting processing due to downstream issues.

Valid transitions to PAUSED:

- From ACTIVE (normal operation → paused)
- From STOPPED (if resuming then immediately pausing is not recommended - use resume instead)

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the pause operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Optional callback receiving the completed state transition record

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - simple pause
stateManager.pause('orders@production', null, (err, transition) => {
  if (err) {
    console.error('Failed to pause:', err);
  } else {
    console.log('Queue paused at:', new Date(transition.timestamp));
  }
});

// Promise pattern - pause with detailed reason
try {
  const transition = await stateManager.pause(
    { name: 'email-worker', ns: 'production' },
    {
      reason: EStateTransitionReason.PERFORMANCE,
      description: 'Email service latency spike detected',
      metadata: { latency: '2500ms' },
    },
  );
  console.log('Queue paused at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to pause:', err);
}
```

---

### resume()

#### Call Signature

> **resume**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Resumes message processing for a previously paused or stopped queue

This method transitions a queue back to the ACTIVE state, allowing it to
resume normal message processing. It can be called on queues in either
PAUSED or STOPPED states.

Valid transitions to ACTIVE:

- From PAUSED (resume normal operation)
- From STOPPED (restart a stopped queue)

Note: Cannot resume a queue that is LOCKED (internal state) - locks are
managed automatically by system components.

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the resume operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - simple resume
stateManager.resume('orders', null, (err, transition) => {
  if (err) {
    console.error('Failed to resume:', err);
  } else {
    console.log('Queue resumed at:', new Date(transition.timestamp));
  }
});

// Promise pattern - resume with detailed reason
try {
  const transition = await stateManager.resume(
    { name: 'email-worker', ns: 'production' },
    {
      reason: EStateTransitionReason.MANUAL,
      description: 'Database maintenance completed',
      metadata: { downtime: '45s' },
    },
  );
  console.log('Queue resumed at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to resume:', err);
}
```

#### Call Signature

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

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the resume operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Optional callback receiving the completed state transition record

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - simple resume
stateManager.resume('orders', null, (err, transition) => {
  if (err) {
    console.error('Failed to resume:', err);
  } else {
    console.log('Queue resumed at:', new Date(transition.timestamp));
  }
});

// Promise pattern - resume with detailed reason
try {
  const transition = await stateManager.resume(
    { name: 'email-worker', ns: 'production' },
    {
      reason: EStateTransitionReason.MANUAL,
      description: 'Database maintenance completed',
      metadata: { downtime: '45s' },
    },
  );
  console.log('Queue resumed at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to resume:', err);
}
```

---

### stop()

#### Call Signature

> **stop**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Completely stops a queue from processing messages

When stopped, the queue will not accept new messages nor process existing ones.
This is a more severe state than PAUSED and is typically used for:

- Emergency situations (critical errors, security incidents)
- Queue deletion preparation
- Complete system shutdown

Valid transitions to STOPPED:

- From ACTIVE (emergency stop)
- From PAUSED (stop from paused state)

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the stop operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - emergency stop
stateManager.stop('payment-processor', null, (err, transition) => {
  if (err) {
    console.error('Failed to stop:', err);
  } else {
    console.log('Queue stopped at:', new Date(transition.timestamp));
  }
});

// Promise pattern - scheduled maintenance stop
try {
  const transition = await stateManager.stop(
    { name: 'analytics', ns: 'production' },
    {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Weekly maintenance window',
    },
  );
  console.log('Queue stopped at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to stop:', err);
}
```

#### Call Signature

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

##### Parameters

###### queue

Queue identifier (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Configuration options for the stop operation

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Optional callback receiving the completed state transition record

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern - emergency stop
stateManager.stop('payment-processor', null, (err, transition) => {
  if (err) {
    console.error('Failed to stop:', err);
  } else {
    console.log('Queue stopped at:', new Date(transition.timestamp));
  }
});

// Promise pattern - scheduled maintenance stop
try {
  const transition = await stateManager.stop(
    { name: 'analytics', ns: 'production' },
    {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Weekly maintenance window',
    },
  );
  console.log('Queue stopped at:', new Date(transition.timestamp));
} catch (err) {
  console.error('Failed to stop:', err);
}
```
