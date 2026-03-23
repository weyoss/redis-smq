[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ConsumerGroups

# Class: ConsumerGroups

The `ConsumerGroups` class is responsible for managing consumer groups within RedisSMQ.
It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.

Consumer groups are essential for PUB/SUB queues, allowing multiple consumers to process
messages from the same queue with each message delivered to all groups.

## Example

```typescript
const consumerGroups = new ConsumerGroups();

// Using callback
consumerGroups.saveConsumerGroup('notifications', 'group-1', (err, result) => {
  if (err) console.error('Failed to save:', err);
  else console.log('Consumer group saved:', result);
});

// Using promise
const result = await consumerGroups.saveConsumerGroup(
  'notifications',
  'group-1',
);
console.log('Consumer group saved:', result);
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

Delete Consumer Group

Deletes a consumer group from a specific queue. This removes the consumer group
and prevents further message delivery to consumers in that group.

##### Parameters

###### queue

The queue from which to delete the consumer group (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

The ID of the consumer group to delete

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Throws

When the specified queue doesn't exist

##### Throws

When the consumer group still has pending messages

##### Throws

When the queue doesn't support consumer groups

##### Throws

When the queue is locked

##### Throws

When the queue is in an invalid state

##### Throws

When Redis returns an unexpected response

##### Example

```typescript
// Callback pattern - delete consumer group
consumerGroups.deleteConsumerGroup('notifications', 'email-group', (err) => {
  if (err) {
    console.error('Failed to delete consumer group:', err);
  } else {
    console.log('Consumer group deleted successfully');
  }
});

// Promise pattern - delete consumer group
try {
  await consumerGroups.deleteConsumerGroup(
    { name: 'events', ns: 'production' },
    'analytics-group',
  );
  console.log('Consumer group deleted successfully');
} catch (err) {
  console.error('Failed to delete consumer group:', err);
}
```

#### Call Signature

> **deleteConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Delete Consumer Group

Deletes a consumer group from a specific queue. This removes the consumer group
and prevents further message delivery to consumers in that group.

##### Parameters

###### queue

The queue from which to delete the consumer group (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

The ID of the consumer group to delete

###### cb

`ICallback`\<`void`\>

Optional callback function to handle the result or error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Throws

When the specified queue doesn't exist

##### Throws

When the consumer group still has pending messages

##### Throws

When the queue doesn't support consumer groups

##### Throws

When the queue is locked

##### Throws

When the queue is in an invalid state

##### Throws

When Redis returns an unexpected response

##### Example

```typescript
// Callback pattern - delete consumer group
consumerGroups.deleteConsumerGroup('notifications', 'email-group', (err) => {
  if (err) {
    console.error('Failed to delete consumer group:', err);
  } else {
    console.log('Consumer group deleted successfully');
  }
});

// Promise pattern - delete consumer group
try {
  await consumerGroups.deleteConsumerGroup(
    { name: 'events', ns: 'production' },
    'analytics-group',
  );
  console.log('Consumer group deleted successfully');
} catch (err) {
  console.error('Failed to delete consumer group:', err);
}
```

---

### getConsumerGroups()

#### Call Signature

> **getConsumerGroups**(`queue`): `Promise`\<`string`[]\>

Get Consumer Groups

Retrieves a list of consumer group IDs associated with a specific queue.
This method returns all consumer groups that have been created for the queue.

##### Parameters

###### queue

The queue from which to retrieve consumer groups (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Example

```typescript
// Callback pattern - get all consumer groups
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  if (err) {
    console.error('Failed to get consumer groups:', err);
  } else {
    console.log(`Found ${groups.length} consumer groups:`);
    groups.forEach((group) => console.log(`  - ${group}`));
  }
});

// Promise pattern - check if group exists
try {
  const groups = await consumerGroups.getConsumerGroups({
    name: 'events',
    ns: 'production',
  });

  if (groups.includes('analytics-group')) {
    console.log('Analytics consumer group exists');
  } else {
    console.log('Analytics consumer group not found');
  }
} catch (err) {
  console.error('Failed to get consumer groups:', err);
}
```

#### Call Signature

> **getConsumerGroups**(`queue`, `cb`): `void`

Get Consumer Groups

Retrieves a list of consumer group IDs associated with a specific queue.
This method returns all consumer groups that have been created for the queue.

##### Parameters

###### queue

The queue from which to retrieve consumer groups (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`string`[]\>

Optional callback function to handle the result or error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Example

```typescript
// Callback pattern - get all consumer groups
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  if (err) {
    console.error('Failed to get consumer groups:', err);
  } else {
    console.log(`Found ${groups.length} consumer groups:`);
    groups.forEach((group) => console.log(`  - ${group}`));
  }
});

// Promise pattern - check if group exists
try {
  const groups = await consumerGroups.getConsumerGroups({
    name: 'events',
    ns: 'production',
  });

  if (groups.includes('analytics-group')) {
    console.log('Analytics consumer group exists');
  } else {
    console.log('Analytics consumer group not found');
  }
} catch (err) {
  console.error('Failed to get consumer groups:', err);
}
```

---

### saveConsumerGroup()

#### Call Signature

> **saveConsumerGroup**(`queue`, `groupId`): `Promise`\<`number`\>

Save Consumer Group

Saves a consumer group to a specific queue. This creates a new consumer group
for PUB/SUB queues, allowing multiple consumer groups to receive copies of
each message published to the queue.

**Important Notes:**

- Consumer groups are only supported on PUB/SUB queues
- Each consumer group ID must be unique within the queue
- Saving an existing consumer group returns 0 (already exists)
- Creating a new consumer group returns 1

##### Parameters

###### queue

The queue to which the consumer group belongs (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

The ID of the consumer group to save

##### Returns

`Promise`\<`number`\>

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Throws

When the specified queue doesn't exist

##### Throws

When the group ID is invalid

##### Throws

When the queue doesn't support consumer groups

##### Throws

When the queue is locked

##### Throws

When the queue is in an invalid state

##### Example

```typescript
// Callback pattern - create a new consumer group
consumerGroups.saveConsumerGroup(
  { name: 'notifications', ns: 'default' },
  'email-group',
  (err, result) => {
    if (err) {
      console.error('Failed to save consumer group:', err);
    } else if (result === 1) {
      console.log('Consumer group created successfully');
    } else {
      console.log('Consumer group already exists');
    }
  },
);

// Promise pattern - save consumer group
try {
  const result = await consumerGroups.saveConsumerGroup(
    'events',
    'analytics-group',
  );
  console.log(result === 1 ? 'Group created' : 'Group already exists');
} catch (err) {
  console.error('Failed to save consumer group:', err);
}
```

#### Call Signature

> **saveConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Save Consumer Group

Saves a consumer group to a specific queue. This creates a new consumer group
for PUB/SUB queues, allowing multiple consumer groups to receive copies of
each message published to the queue.

**Important Notes:**

- Consumer groups are only supported on PUB/SUB queues
- Each consumer group ID must be unique within the queue
- Saving an existing consumer group returns 0 (already exists)
- Creating a new consumer group returns 1

##### Parameters

###### queue

The queue to which the consumer group belongs (string or IQueueParams)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### groupId

`string`

The ID of the consumer group to save

###### cb

`ICallback`\<`number`\>

Optional callback function to handle the result or error

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Throws

When the queue parameters are invalid

##### Throws

When the specified queue doesn't exist

##### Throws

When the group ID is invalid

##### Throws

When the queue doesn't support consumer groups

##### Throws

When the queue is locked

##### Throws

When the queue is in an invalid state

##### Example

```typescript
// Callback pattern - create a new consumer group
consumerGroups.saveConsumerGroup(
  { name: 'notifications', ns: 'default' },
  'email-group',
  (err, result) => {
    if (err) {
      console.error('Failed to save consumer group:', err);
    } else if (result === 1) {
      console.log('Consumer group created successfully');
    } else {
      console.log('Consumer group already exists');
    }
  },
);

// Promise pattern - save consumer group
try {
  const result = await consumerGroups.saveConsumerGroup(
    'events',
    'analytics-group',
  );
  console.log(result === 1 ? 'Group created' : 'Group already exists');
} catch (err) {
  console.error('Failed to save consumer group:', err);
}
```
