[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueStateManager

# Class: QueueStateManager

Manages queue operational states and transitions.

Provides methods to get state, pause, resume, stop queues,
and retrieve state transition history.

## Example

```ts
const stateManager = new QueueStateManager();

// Get queue state
const state = await stateManager.getState('orders');

// Pause a queue
await stateManager.pause('orders', { reason: EStateTransitionReason.MANUAL });
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

Gets the current operational state of a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const state = await stateManager.getState('orders');
console.log(state.to);

// Callback
stateManager.getState('orders', (err, state) => {
  if (err) throw err;
  console.log(state.to);
});
```

#### Call Signature

> **getState**(`queue`, `cb`): `void`

Gets the current operational state of a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

(err, state) => void. Returns IQueueStateTransition

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const state = await stateManager.getState('orders');
console.log(state.to);

// Callback
stateManager.getState('orders', (err, state) => {
  if (err) throw err;
  console.log(state.to);
});
```

---

### getStateHistory()

#### Call Signature

> **getStateHistory**(`queue`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

Gets the complete state transition history for a queue.

Returns array of all state transitions from oldest to newest.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const history = await stateManager.getStateHistory('orders');
console.log(`Total transitions: ${history.length}`);

// Callback
stateManager.getStateHistory('orders', (err, history) => {
  if (err) throw err;
  history.forEach((t) => console.log(t.to));
});
```

#### Call Signature

> **getStateHistory**(`queue`, `cb`): `void`

Gets the complete state transition history for a queue.

Returns array of all state transitions from oldest to newest.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)[]\>

(err, history) => void. Returns IQueueStateTransition[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const history = await stateManager.getStateHistory('orders');
console.log(`Total transitions: ${history.length}`);

// Callback
stateManager.getStateHistory('orders', (err, history) => {
  if (err) throw err;
  history.forEach((t) => console.log(t.to));
});
```

---

### pause()

#### Call Signature

> **pause**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Pauses message processing for a queue.

Queue continues to accept messages but stops processing them.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.pause('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance',
});

// Callback
stateManager.pause('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```

#### Call Signature

> **pause**(`queue`, `options`, `cb`): `void`

Pauses message processing for a queue.

Queue continues to accept messages but stops processing them.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

(err, transition) => void. Returns IQueueStateTransition

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.pause('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance',
});

// Callback
stateManager.pause('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```

---

### resume()

#### Call Signature

> **resume**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Resumes message processing for a paused or stopped queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.resume('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance complete',
});

// Callback
stateManager.resume('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```

#### Call Signature

> **resume**(`queue`, `options`, `cb`): `void`

Resumes message processing for a paused or stopped queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

(err, transition) => void. Returns IQueueStateTransition

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.resume('orders', {
  reason: EStateTransitionReason.MANUAL,
  description: 'Maintenance complete',
});

// Callback
stateManager.resume('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```

---

### stop()

#### Call Signature

> **stop**(`queue`, `options`): `Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Stops a queue completely.

Queue will not accept new messages nor process existing ones.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

##### Returns

`Promise`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.stop('orders', {
  reason: EStateTransitionReason.EMERGENCY,
  description: 'Security incident',
});

// Callback
stateManager.stop('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```

#### Call Signature

> **stop**(`queue`, `options`, `cb`): `void`

Stops a queue completely.

Queue will not accept new messages nor process existing ones.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### options

Optional transition options (reason, description, metadata)

[`TQueueStateTransitionUserOptions`](../type-aliases/TQueueStateTransitionUserOptions.md) | `null`

###### cb

`ICallback`\<[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)\>

(err, transition) => void. Returns IQueueStateTransition

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const transition = await stateManager.stop('orders', {
  reason: EStateTransitionReason.EMERGENCY,
  description: 'Security incident',
});

// Callback
stateManager.stop('orders', null, (err, transition) => {
  if (err) throw err;
  console.log(transition.timestamp);
});
```
