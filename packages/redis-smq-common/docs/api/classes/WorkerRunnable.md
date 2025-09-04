[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerRunnable

# Class: WorkerRunnable\<InitialPayload\>

## Extends

- `Worker`\<`void`, `void`\>

## Type Parameters

### InitialPayload

`InitialPayload`

## Implements

- [`IWorkerRunnable`](../interfaces/IWorkerRunnable.md)

## Constructors

### Constructor

> **new WorkerRunnable**\<`InitialPayload`\>(`workerFilename`, `initialPayload?`, `logger?`): `WorkerRunnable`\<`InitialPayload`\>

#### Parameters

##### workerFilename

`string`

##### initialPayload?

`InitialPayload`

##### logger?

[`ILogger`](../interfaces/ILogger.md)

#### Returns

`WorkerRunnable`\<`InitialPayload`\>

#### Overrides

`Worker<void, void>.constructor`

## Methods

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

### run()

> **run**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

#### Returns

`void`

#### Implementation of

[`IWorkerRunnable`](../interfaces/IWorkerRunnable.md).[`run`](../interfaces/IWorkerRunnable.md#run)

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

#### Implementation of

[`IWorkerRunnable`](../interfaces/IWorkerRunnable.md).[`shutdown`](../interfaces/IWorkerRunnable.md#shutdown)

#### Overrides

`Worker.shutdown`
