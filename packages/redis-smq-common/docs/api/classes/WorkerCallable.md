[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerCallable

# Class: WorkerCallable\<Payload, Reply\>

## Extends

- `Worker`\<`Payload`, `Reply`\>

## Type Parameters

### Payload

`Payload`

### Reply

`Reply`

## Implements

- [`IWorkerCallable`](../interfaces/IWorkerCallable.md)\<`Payload`, `Reply`\>

## Constructors

### Constructor

> **new WorkerCallable**\<`Payload`, `Reply`\>(`workerFilename`, `logger?`): `WorkerCallable`\<`Payload`, `Reply`\>

#### Parameters

##### workerFilename

`string`

##### logger?

[`ILogger`](../interfaces/ILogger.md)

#### Returns

`WorkerCallable`\<`Payload`, `Reply`\>

#### Overrides

`Worker<Payload, Reply>.constructor`

## Methods

### call()

> **call**(`payload`, `cb`): `void`

#### Parameters

##### payload

`Payload`

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`Reply`\>

#### Returns

`void`

#### Implementation of

[`IWorkerCallable`](../interfaces/IWorkerCallable.md).[`call`](../interfaces/IWorkerCallable.md#call)

***

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` *extends* keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`TWorkerEvent`\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Worker.emit`

***

### getId()

> **getId**(): `string`

Gets the worker ID.

#### Returns

`string`

The worker ID.

#### Inherited from

`Worker.getId`

***

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.on`

***

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.once`

***

### postMessage()

> **postMessage**(`message`): `void`

Posts a message to the worker thread.

#### Parameters

##### message

[`TWorkerThreadParentMessage`](../type-aliases/TWorkerThreadParentMessage.md)

The message to post to the worker thread.

#### Returns

`void`

#### Inherited from

`Worker.postMessage`

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* keyof `TWorkerEvent`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Worker.removeAllListeners`

***

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* keyof `TWorkerEvent`

#### Parameters

##### event

`E`

##### listener

`TWorkerEvent`\[`E`\]

#### Returns

`this`

#### Inherited from

`Worker.removeListener`

***

### shutdown()

> **shutdown**(`cb`): `void`

Shuts down the worker thread.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

The callback function to call after shutdown.

#### Returns

`void`

#### Inherited from

`Worker.shutdown`
