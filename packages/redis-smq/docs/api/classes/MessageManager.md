[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / MessageManager

# Class: MessageManager

The MessageManager class provides methods for interacting with Redis-SMQ messages.
It utilizes the RedisClient to perform operations on Redis.

This class allows you to inspect, modify, and manage individual messages
across the system, regardless of their current state or queue location.

## Example

```typescript
const messageManager = new MessageManager();

// Using callback
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) {
    console.error('Failed to get message status:', err);
  } else {
    console.log('Message status:', status);
  }
});

// Using promise
const status = await messageManager.getMessageStatus('msg-123');
console.log('Message status:', status);
```

## Constructors

### Constructor

> **new MessageManager**(): `MessageManager`

#### Returns

`MessageManager`

## Methods

### deleteMessageById()

#### Call Signature

> **deleteMessageById**(`id`): `Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Deletes a single message by its ID.

This method permanently removes a single message from the system.
It's a convenience wrapper around `deleteMessagesByIds`.

##### Parameters

###### id

`string`

The ID of the message to delete

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.deleteMessageById('msg-123', (err, response) => {
  if (err) {
    console.error('Failed to delete message:', err);
  } else {
    console.log(`Message deleted: ${response.deletedIds[0]}`);
  }
});

// Promise pattern
async function deleteIfFailed(messageId: string) {
  try {
    const status = await messageManager.getMessageStatus(messageId);
    if (status === EMessagePropertyStatus.DEAD_LETTERED) {
      await messageManager.deleteMessageById(messageId);
      console.log(`Deleted dead-lettered message: ${messageId}`);
    }
  } catch (err) {
    console.error('Failed to delete message:', err);
  }
}
```

#### Call Signature

> **deleteMessageById**(`id`, `cb`): `void`

Deletes a single message by its ID.

This method permanently removes a single message from the system.
It's a convenience wrapper around `deleteMessagesByIds`.

##### Parameters

###### id

`string`

The ID of the message to delete

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Optional callback function that will be called with the result. - On success: `cb(null, response)` where response contains deletion statistics. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the response.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.deleteMessageById('msg-123', (err, response) => {
  if (err) {
    console.error('Failed to delete message:', err);
  } else {
    console.log(`Message deleted: ${response.deletedIds[0]}`);
  }
});

// Promise pattern
async function deleteIfFailed(messageId: string) {
  try {
    const status = await messageManager.getMessageStatus(messageId);
    if (status === EMessagePropertyStatus.DEAD_LETTERED) {
      await messageManager.deleteMessageById(messageId);
      console.log(`Deleted dead-lettered message: ${messageId}`);
    }
  } catch (err) {
    console.error('Failed to delete message:', err);
  }
}
```

---

### deleteMessagesByIds()

#### Call Signature

> **deleteMessagesByIds**(`ids`): `Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Deletes multiple messages by their IDs.

This method permanently removes multiple messages from the system. The deletion
is performed atomically across all message-related data structures.

##### Parameters

###### ids

`string`[]

Array of message IDs to delete

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.deleteMessagesByIds(
  ['msg-1', 'msg-2', 'msg-3'],
  (err, response) => {
    if (err) {
      console.error('Failed to delete messages:', err);
    } else {
      console.log(`Deleted ${response.deletedCount} messages`);
      console.log('Deleted IDs:', response.deletedIds);
    }
  },
);

// Promise pattern
async function cleanupOldMessages(messageIds: string[]) {
  try {
    const response = await messageManager.deleteMessagesByIds(messageIds);
    console.log(
      `Successfully cleaned up ${response.deletedCount} old messages`,
    );
    return response;
  } catch (err) {
    console.error('Cleanup failed:', err);
    throw err;
  }
}
```

#### Call Signature

> **deleteMessagesByIds**(`ids`, `cb`): `void`

Deletes multiple messages by their IDs.

This method permanently removes multiple messages from the system. The deletion
is performed atomically across all message-related data structures.

##### Parameters

###### ids

`string`[]

Array of message IDs to delete

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Optional callback function that will be called with the deletion result. - On success: `cb(null, response)` where response contains deletion statistics. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the response.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.deleteMessagesByIds(
  ['msg-1', 'msg-2', 'msg-3'],
  (err, response) => {
    if (err) {
      console.error('Failed to delete messages:', err);
    } else {
      console.log(`Deleted ${response.deletedCount} messages`);
      console.log('Deleted IDs:', response.deletedIds);
    }
  },
);

// Promise pattern
async function cleanupOldMessages(messageIds: string[]) {
  try {
    const response = await messageManager.deleteMessagesByIds(messageIds);
    console.log(
      `Successfully cleaned up ${response.deletedCount} old messages`,
    );
    return response;
  } catch (err) {
    console.error('Cleanup failed:', err);
    throw err;
  }
}
```

---

### getMessageById()

#### Call Signature

> **getMessageById**(`messageId`): `Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

Retrieves a single message by its ID.

This method returns the full message object including all metadata and body content.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve

##### Returns

`Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) {
    console.error('Message not found:', err);
  } else {
    console.log('Message details:');
    console.log(`  ID: ${message.getId()}`);
    console.log(`  Body:`, message.getBody());
  }
});

// Promise pattern
async function inspectAndRequeue(messageId: string) {
  try {
    const message = await messageManager.getMessageById(messageId);
    const body = message.getBody();
    // ...
    // ...
    const newId = await messageManager.requeueMessageById(messageId);
    console.log(`Message ${messageId} requeued as ${newId}`);
  } catch (err) {
    console.error('Failed to inspect message:', err);
  }
}
```

#### Call Signature

> **getMessageById**(`messageId`, `cb`): `void`

Retrieves a single message by its ID.

This method returns the full message object including all metadata and body content.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve

###### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

Optional callback function that will be called with the result. - On success: `cb(null, message)` where message is the full message object. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the message.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) {
    console.error('Message not found:', err);
  } else {
    console.log('Message details:');
    console.log(`  ID: ${message.getId()}`);
    console.log(`  Body:`, message.getBody());
  }
});

// Promise pattern
async function inspectAndRequeue(messageId: string) {
  try {
    const message = await messageManager.getMessageById(messageId);
    const body = message.getBody();
    // ...
    // ...
    const newId = await messageManager.requeueMessageById(messageId);
    console.log(`Message ${messageId} requeued as ${newId}`);
  } catch (err) {
    console.error('Failed to inspect message:', err);
  }
}
```

---

### getMessagesByIds()

#### Call Signature

> **getMessagesByIds**(`messageIds`): `Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

Retrieves multiple messages by their IDs.

This method returns full message objects for multiple message IDs in a single
operation, which is more efficient than calling `getMessageById` for each ID.

##### Parameters

###### messageIds

`string`[]

An array of IDs of the messages to retrieve

##### Returns

`Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When any of the messages don't exist (in strict mode).

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessagesByIds(
  ['msg-1', 'msg-2', 'msg-3'],
  (err, messages) => {
    if (err) {
      console.error('Failed to get messages:', err);
    } else {
      console.log(`Retrieved ${messages.length} messages`);
      messages.forEach((msg) => {
        console.log(`Message ${msg.getId()}:`, msg.getBody());
      });
    }
  },
);

// Promise pattern
async function batchProcessMessages(messageIds: string[]) {
  try {
    const messages = await messageManager.getMessagesByIds(messageIds);
    const results = [];

    for (const msg of messages) {
      const result = await processMessage(msg);
      results.push({ id: msg.getId(), result });
    }

    console.log(`Processed ${results.length} messages`);
    return results;
  } catch (err) {
    console.error('Batch processing failed:', err);
  }
}
```

#### Call Signature

> **getMessagesByIds**(`messageIds`, `cb`): `void`

Retrieves multiple messages by their IDs.

This method returns full message objects for multiple message IDs in a single
operation, which is more efficient than calling `getMessageById` for each ID.

##### Parameters

###### messageIds

`string`[]

An array of IDs of the messages to retrieve

###### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

Optional callback function that will be called with the result. - On success: `cb(null, messages)` where messages is an array of message objects. - On error: `cb(error)` with any Redis or system errors. - If not provided, the method returns a Promise that resolves with the messages.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When any of the messages don't exist (in strict mode).

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessagesByIds(
  ['msg-1', 'msg-2', 'msg-3'],
  (err, messages) => {
    if (err) {
      console.error('Failed to get messages:', err);
    } else {
      console.log(`Retrieved ${messages.length} messages`);
      messages.forEach((msg) => {
        console.log(`Message ${msg.getId()}:`, msg.getBody());
      });
    }
  },
);

// Promise pattern
async function batchProcessMessages(messageIds: string[]) {
  try {
    const messages = await messageManager.getMessagesByIds(messageIds);
    const results = [];

    for (const msg of messages) {
      const result = await processMessage(msg);
      results.push({ id: msg.getId(), result });
    }

    console.log(`Processed ${results.length} messages`);
    return results;
  } catch (err) {
    console.error('Batch processing failed:', err);
  }
}
```

---

### getMessageState()

#### Call Signature

> **getMessageState**(`messageId`): `Promise`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

Retrieves the state of a message with the given ID.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve the state for

##### Returns

`Promise`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageState('msg-123', (err, state) => {
  if (err) {
    console.error('Failed to get message state:', err);
  } else {
    // ...
  }
});

// Promise pattern
async function analyzeMessageProcessing(messageId: string) {
  try {
    const state = await messageManager.getMessageState(messageId);
    // ...
  } catch (err) {
    console.error('Failed to analyze message:', err);
  }
}
```

#### Call Signature

> **getMessageState**(`messageId`, `cb`): `void`

Retrieves the state of a message with the given ID.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve the state for

###### cb

`ICallback`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

Optional callback function that will be called with the result. - On success: `cb(null, state)` where state contains detailed message metadata. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the state.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageState('msg-123', (err, state) => {
  if (err) {
    console.error('Failed to get message state:', err);
  } else {
    // ...
  }
});

// Promise pattern
async function analyzeMessageProcessing(messageId: string) {
  try {
    const state = await messageManager.getMessageState(messageId);
    // ...
  } catch (err) {
    console.error('Failed to analyze message:', err);
  }
}
```

---

### getMessageStatus()

#### Call Signature

> **getMessageStatus**(`messageId`): `Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

Retrieves the status of a message with the given ID.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve the status for

##### Returns

`Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) {
    console.error('Message not found or error:', err);
  } else {
    // ...
  }
});

// Promise pattern
async function isMessageProcessed(messageId: string): Promise<boolean> {
  try {
    const status = await messageManager.getMessageStatus(messageId);
    return status === EMessagePropertyStatus.ACKNOWLEDGED;
  } catch (err) {
    console.error('Failed to check message status:', err);
    return false;
  }
}
```

#### Call Signature

> **getMessageStatus**(`messageId`, `cb`): `void`

Retrieves the status of a message with the given ID.

##### Parameters

###### messageId

`string`

The ID of the message to retrieve the status for

###### cb

`ICallback`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

Optional callback function that will be called with the result. - On success: `cb(null, status)` where status is the message status enum. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the status.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) {
    console.error('Message not found or error:', err);
  } else {
    // ...
  }
});

// Promise pattern
async function isMessageProcessed(messageId: string): Promise<boolean> {
  try {
    const status = await messageManager.getMessageStatus(messageId);
    return status === EMessagePropertyStatus.ACKNOWLEDGED;
  } catch (err) {
    console.error('Failed to check message status:', err);
    return false;
  }
}
```

---

### requeueMessageById()

#### Call Signature

> **requeueMessageById**(`messageId`): `Promise`\<`string`\>

Requeues a message with the given ID.

This operation creates a new copy of the message and marks the original as requeued.
The new message is placed back into the queue for reprocessing, while the original
message's state is updated to reflect that it has been requeued.

##### Parameters

###### messageId

`string`

The ID of the message to requeue

##### Returns

`Promise`\<`string`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Throws

When the message cannot be requeued (e.g., already acknowledged).

##### Throws

When the requeue operation fails.

##### Throws

When Redis returns an unexpected response.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.requeueMessageById('msg-123', (err, newMessageId) => {
  if (err) {
    console.error('Failed to requeue message:', err);
  } else {
    console.log(`Message requeued. New ID: ${newMessageId}`);
  }
});

// Promise pattern
async function retryFailedMessages(messageIds: string[]) {
  const results = {
    success: [],
    failed: [],
  };

  for (const id of messageIds) {
    try {
      const newId = await messageManager.requeueMessageById(id);
      results.success.push({ original: id, new: newId });
      console.log(`Message ${id} requeued as ${newId}`);
    } catch (err) {
      results.failed.push({ id, error: err.message });
      console.error(`Failed to requeue ${id}:`, err.message);
    }
  }

  return results;
}
```

#### Call Signature

> **requeueMessageById**(`messageId`, `cb`): `void`

Requeues a message with the given ID.

This operation creates a new copy of the message and marks the original as requeued.
The new message is placed back into the queue for reprocessing, while the original
message's state is updated to reflect that it has been requeued.

##### Parameters

###### messageId

`string`

The ID of the message to requeue

###### cb

`ICallback`\<`string`\>

Optional callback function that will be called with the result. - On success: `cb(null, newMessageId)` where newMessageId is the ID of the new message. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the new message ID.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the message with the given ID doesn't exist.

##### Throws

When the message cannot be requeued (e.g., already acknowledged).

##### Throws

When the requeue operation fails.

##### Throws

When Redis returns an unexpected response.

##### Throws

When the associated queue is locked.

##### Throws

When the queue is in an invalid state.

##### Example

```typescript
const messageManager = new MessageManager();

// Callback pattern
messageManager.requeueMessageById('msg-123', (err, newMessageId) => {
  if (err) {
    console.error('Failed to requeue message:', err);
  } else {
    console.log(`Message requeued. New ID: ${newMessageId}`);
  }
});

// Promise pattern
async function retryFailedMessages(messageIds: string[]) {
  const results = {
    success: [],
    failed: [],
  };

  for (const id of messageIds) {
    try {
      const newId = await messageManager.requeueMessageById(id);
      results.success.push({ original: id, new: newId });
      console.log(`Message ${id} requeued as ${newId}`);
    } catch (err) {
      results.failed.push({ id, error: err.message });
      console.error(`Failed to requeue ${id}:`, err.message);
    }
  }

  return results;
}
```
