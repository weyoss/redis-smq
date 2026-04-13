[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ConsumerGroups

# Class: ConsumerGroups

Manages consumer groups for PUB/SUB queues.

Consumer groups allow multiple consumers to process messages from the same queue,
with each message delivered to all groups.

## Example

```ts
const consumerGroups = new ConsumerGroups();

// Save a consumer group
await consumerGroups.saveConsumerGroup('notifications', 'email-group');

// Get all consumer groups
const groups = await consumerGroups.getConsumerGroups('notifications');
```

## Constructors

### Constructor

> **new ConsumerGroups**(): `ConsumerGroups`

#### Returns

`ConsumerGroups`

## Methods

### deleteConsumerGroup()

#### Call Signature

> **deleteConsumerGroup**(`queue`, `groupId`): `Promise`\<`void`\>

Deletes a consumer group from a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

Consumer group ID

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await consumerGroups.deleteConsumerGroup('notifications', 'email-group');

// Callback
consumerGroups.deleteConsumerGroup('notifications', 'email-group', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **deleteConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Deletes a consumer group from a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

Consumer group ID

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await consumerGroups.deleteConsumerGroup('notifications', 'email-group');

// Callback
consumerGroups.deleteConsumerGroup('notifications', 'email-group', (err) => {
  if (err) throw err;
});
```

---

### getConsumerGroups()

#### Call Signature

> **getConsumerGroups**(`queue`): `Promise`\<`string`[]\>

Gets all consumer groups for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`string`[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const groups = await consumerGroups.getConsumerGroups('notifications');
console.log(groups);

// Callback
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  if (err) throw err;
  console.log(groups);
});
```

#### Call Signature

> **getConsumerGroups**(`queue`, `cb`): `void`

Gets all consumer groups for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`string`[]\>

(err, groups) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const groups = await consumerGroups.getConsumerGroups('notifications');
console.log(groups);

// Callback
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  if (err) throw err;
  console.log(groups);
});
```

---

### saveConsumerGroup()

#### Call Signature

> **saveConsumerGroup**(`queue`, `groupId`): `Promise`\<`number`\>

Saves a consumer group to a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

Consumer group ID

##### Returns

`Promise`\<`number`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await consumerGroups.saveConsumerGroup(
  'notifications',
  'email-group',
);
console.log(result === 1 ? 'Created' : 'Already exists');

// Callback
consumerGroups.saveConsumerGroup(
  'notifications',
  'email-group',
  (err, result) => {
    if (err) throw err;
    console.log(result);
  },
);
```

#### Call Signature

> **saveConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Saves a consumer group to a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

Consumer group ID

###### cb

`ICallback`\<`number`\>

(err, result) => void. Returns 1 if created, 0 if already exists

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await consumerGroups.saveConsumerGroup(
  'notifications',
  'email-group',
);
console.log(result === 1 ? 'Created' : 'Already exists');

// Callback
consumerGroups.saveConsumerGroup(
  'notifications',
  'email-group',
  (err, result) => {
    if (err) throw err;
    console.log(result);
  },
);
```
