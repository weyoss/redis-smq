[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / MessageManager

# Class: MessageManager

Manages individual message operations.

Provides methods to get, delete, and requeue messages by ID,
plus status and state inspection.

## Example

```ts
const messageManager = new MessageManager();

// Get message status
const status = await messageManager.getMessageStatus('msg-123');

// Requeue a message
const newId = await messageManager.requeueMessageById('msg-123');
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

##### Parameters

###### id

`string`

Message ID

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await messageManager.deleteMessageById('msg-123');

// Callback
messageManager.deleteMessageById('msg-123', (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

#### Call Signature

> **deleteMessageById**(`id`, `cb`): `void`

Deletes a single message by its ID.

##### Parameters

###### id

`string`

Message ID

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

(err, response) => void. Returns IMessageManagerDeleteResponse

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await messageManager.deleteMessageById('msg-123');

// Callback
messageManager.deleteMessageById('msg-123', (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

---

### deleteMessagesByIds()

#### Call Signature

> **deleteMessagesByIds**(`ids`): `Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Deletes multiple messages by their IDs.

##### Parameters

###### ids

`string`[]

Array of message IDs

##### Returns

`Promise`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
console.log(`Deleted: ${result.deletedCount}`);

// Callback
messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

#### Call Signature

> **deleteMessagesByIds**(`ids`, `cb`): `void`

Deletes multiple messages by their IDs.

##### Parameters

###### ids

`string`[]

Array of message IDs

###### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

(err, response) => void. Returns IMessageManagerDeleteResponse

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
console.log(`Deleted: ${result.deletedCount}`);

// Callback
messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

---

### getMessageById()

#### Call Signature

> **getMessageById**(`messageId`): `Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

Gets a single message by its ID.

##### Parameters

###### messageId

`string`

Message ID

##### Returns

`Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const message = await messageManager.getMessageById('msg-123');
console.log(message.getBody());

// Callback
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) throw err;
  console.log(message);
});
```

#### Call Signature

> **getMessageById**(`messageId`, `cb`): `void`

Gets a single message by its ID.

##### Parameters

###### messageId

`string`

Message ID

###### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

(err, message) => void. Returns IMessageTransferable

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const message = await messageManager.getMessageById('msg-123');
console.log(message.getBody());

// Callback
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) throw err;
  console.log(message);
});
```

---

### getMessagesByIds()

#### Call Signature

> **getMessagesByIds**(`messageIds`): `Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

Gets multiple messages by their IDs.

##### Parameters

###### messageIds

`string`[]

Array of message IDs

##### Returns

`Promise`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const messages = await messageManager.getMessagesByIds(['msg-1', 'msg-2']);

// Callback
messageManager.getMessagesByIds(['msg-1', 'msg-2'], (err, messages) => {
  if (err) throw err;
  console.log(messages.length);
});
```

#### Call Signature

> **getMessagesByIds**(`messageIds`, `cb`): `void`

Gets multiple messages by their IDs.

##### Parameters

###### messageIds

`string`[]

Array of message IDs

###### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

(err, messages) => void. Returns IMessageTransferable[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const messages = await messageManager.getMessagesByIds(['msg-1', 'msg-2']);

// Callback
messageManager.getMessagesByIds(['msg-1', 'msg-2'], (err, messages) => {
  if (err) throw err;
  console.log(messages.length);
});
```

---

### getMessageState()

#### Call Signature

> **getMessageState**(`messageId`): `Promise`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

Gets the state of a message (timestamps, attempts, etc.).

##### Parameters

###### messageId

`string`

Message ID

##### Returns

`Promise`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const state = await messageManager.getMessageState('msg-123');
console.log(state.attempts);

// Callback
messageManager.getMessageState('msg-123', (err, state) => {
  if (err) throw err;
  console.log(state);
});
```

#### Call Signature

> **getMessageState**(`messageId`, `cb`): `void`

Gets the state of a message (timestamps, attempts, etc.).

##### Parameters

###### messageId

`string`

Message ID

###### cb

`ICallback`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

(err, state) => void. Returns IMessageStateTransferable

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const state = await messageManager.getMessageState('msg-123');
console.log(state.attempts);

// Callback
messageManager.getMessageState('msg-123', (err, state) => {
  if (err) throw err;
  console.log(state);
});
```

---

### getMessageStatus()

#### Call Signature

> **getMessageStatus**(`messageId`): `Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

Gets the status of a message.

##### Parameters

###### messageId

`string`

Message ID

##### Returns

`Promise`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const status = await messageManager.getMessageStatus('msg-123');

// Callback
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) throw err;
  console.log(status);
});
```

#### Call Signature

> **getMessageStatus**(`messageId`, `cb`): `void`

Gets the status of a message.

##### Parameters

###### messageId

`string`

Message ID

###### cb

`ICallback`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

(err, status) => void. Returns EMessagePropertyStatus

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const status = await messageManager.getMessageStatus('msg-123');

// Callback
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) throw err;
  console.log(status);
});
```

---

### getMessageUnacknowledgementHistory()

#### Call Signature

> **getMessageUnacknowledgementHistory**(`messageId`): `Promise`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

Gets the unacknowledgement history for a message.

Requires message audit to be enabled in configuration.

##### Parameters

###### messageId

`string`

Message ID

##### Returns

`Promise`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const history =
  await messageManager.getMessageUnacknowledgementHistory('msg-123');
console.log(history.length);

// Callback
messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
  if (err) throw err;
  console.log(history);
});
```

#### Call Signature

> **getMessageUnacknowledgementHistory**(`messageId`, `cb`): `void`

Gets the unacknowledgement history for a message.

Requires message audit to be enabled in configuration.

##### Parameters

###### messageId

`string`

Message ID

###### cb

`ICallback`\<[`TMessageUnacknowledgementHistory`](../type-aliases/TMessageUnacknowledgementHistory.md)\>

(err, history) => void. Returns TMessageUnacknowledgementHistory

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const history =
  await messageManager.getMessageUnacknowledgementHistory('msg-123');
console.log(history.length);

// Callback
messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
  if (err) throw err;
  console.log(history);
});
```

---

### requeueMessageById()

#### Call Signature

> **requeueMessageById**(`messageId`): `Promise`\<`string`\>

Requeues a message (creates a new copy for reprocessing).

##### Parameters

###### messageId

`string`

Message ID to requeue

##### Returns

`Promise`\<`string`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const newId = await messageManager.requeueMessageById('msg-123');

// Callback
messageManager.requeueMessageById('msg-123', (err, newId) => {
  if (err) throw err;
  console.log(newId);
});
```

#### Call Signature

> **requeueMessageById**(`messageId`, `cb`): `void`

Requeues a message (creates a new copy for reprocessing).

##### Parameters

###### messageId

`string`

Message ID to requeue

###### cb

`ICallback`\<`string`\>

(err, newMessageId) => void. Returns string

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const newId = await messageManager.requeueMessageById('msg-123');

// Callback
messageManager.requeueMessageById('msg-123', (err, newId) => {
  if (err) throw err;
  console.log(newId);
});
```
