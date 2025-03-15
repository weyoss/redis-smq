[RedisSMQ Common Library](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Table of contents

### Enumerations

- [ERedisConfigClient](enums/ERedisConfigClient.md)
- [EWorkerThreadChildExecutionCode](enums/EWorkerThreadChildExecutionCode.md)
- [EWorkerThreadChildExitCode](enums/EWorkerThreadChildExitCode.md)
- [EWorkerThreadParentMessage](enums/EWorkerThreadParentMessage.md)
- [EWorkerType](enums/EWorkerType.md)

### Classes

- [EventBus](classes/EventBus.md)
- [EventBusRedis](classes/EventBusRedis.md)
- [EventEmitter](classes/EventEmitter.md)
- [Locker](classes/Locker.md)
- [PowerSwitch](classes/PowerSwitch.md)
- [Runnable](classes/Runnable.md)
- [Timer](classes/Timer.md)
- [WorkerCallable](classes/WorkerCallable.md)
- [WorkerResourceGroup](classes/WorkerResourceGroup.md)
- [WorkerRunnable](classes/WorkerRunnable.md)

### Error Classes

- [AbortError](classes/AbortError.md)
- [CallbackEmptyReplyError](classes/CallbackEmptyReplyError.md)
- [CallbackInvalidReplyError](classes/CallbackInvalidReplyError.md)
- [EventBusError](classes/EventBusError.md)
- [EventBusNotConnectedError](classes/EventBusNotConnectedError.md)
- [LockAcquireError](classes/LockAcquireError.md)
- [LockError](classes/LockError.md)
- [LockExtendError](classes/LockExtendError.md)
- [LockMethodNotAllowedError](classes/LockMethodNotAllowedError.md)
- [LockNotAcquiredError](classes/LockNotAcquiredError.md)
- [LoggerError](classes/LoggerError.md)
- [PanicError](classes/PanicError.md)
- [RedisClientError](classes/RedisClientError.md)
- [RedisSMQError](classes/RedisSMQError.md)
- [TimerError](classes/TimerError.md)
- [WatchedKeysChangedError](classes/WatchedKeysChangedError.md)
- [WorkerAlreadyDownError](classes/WorkerAlreadyDownError.md)
- [WorkerAlreadyRunningError](classes/WorkerAlreadyRunningError.md)
- [WorkerError](classes/WorkerError.md)
- [WorkerPayloadRequiredError](classes/WorkerPayloadRequiredError.md)
- [WorkerThreadError](classes/WorkerThreadError.md)

### Interfaces

- [ICallback](interfaces/ICallback.md)
- [IEventBus](interfaces/IEventBus.md)
- [IEventEmitter](interfaces/IEventEmitter.md)
- [ILogger](interfaces/ILogger.md)
- [ILoggerConfig](interfaces/ILoggerConfig.md)
- [IRedisClient](interfaces/IRedisClient.md)
- [IRedisConfig](interfaces/IRedisConfig.md)
- [IRedisTransaction](interfaces/IRedisTransaction.md)
- [IWorkerCallable](interfaces/IWorkerCallable.md)
- [IWorkerRunnable](interfaces/IWorkerRunnable.md)
- [IWorkerThreadData](interfaces/IWorkerThreadData.md)

### Type Aliases

- [TEventBusEvent](README.md#teventbusevent)
- [TEventEmitterEvent](README.md#teventemitterevent)
- [TFunction](README.md#tfunction)
- [TLockerEvent](README.md#tlockerevent)
- [TRedisClientEvent](README.md#tredisclientevent)
- [TTimer](README.md#ttimer)
- [TTimerEvent](README.md#ttimerevent)
- [TUnaryFunction](README.md#tunaryfunction)
- [TWorkerCallableFunction](README.md#tworkercallablefunction)
- [TWorkerFunction](README.md#tworkerfunction)
- [TWorkerResourceGroupEvent](README.md#tworkerresourcegroupevent)
- [TWorkerRunnableFunctionFactory](README.md#tworkerrunnablefunctionfactory)
- [TWorkerThreadChildMessage](README.md#tworkerthreadchildmessage)
- [TWorkerThreadChildMessageCode](README.md#tworkerthreadchildmessagecode)
- [TWorkerThreadParentMessage](README.md#tworkerthreadparentmessage)
- [TWorkerThreadParentMessageCall](README.md#tworkerthreadparentmessagecall)
- [TWorkerThreadParentMessageRun](README.md#tworkerthreadparentmessagerun)
- [TWorkerThreadParentMessageShutdown](README.md#tworkerthreadparentmessageshutdown)

### Variables

- [async](README.md#async)
- [logger](README.md#logger)

### Functions

- [createRedisClient](README.md#createredisclient)
- [getDirname](README.md#getdirname)

## Type Aliases

### TEventBusEvent

Ƭ **TEventBusEvent**: [`TEventEmitterEvent`](README.md#teventemitterevent) & \{ `error`: (`err`: `Error`) => `void`  }

___

### TEventEmitterEvent

Ƭ **TEventEmitterEvent**: `Record`\<`string`, (...`args`: `any`[]) => `void`\>

___

### TFunction

Ƭ **TFunction**\<`TReturn`, `TArgs`\>: (...`args`: `TArgs`[]) => `TReturn`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TReturn` | `void` |
| `TArgs` | `any` |

#### Type declaration

▸ (`...args`): `TReturn`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TArgs`[] |

##### Returns

`TReturn`

___

### TLockerEvent

Ƭ **TLockerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `locker.down` | (`id`: `string`) => `void` |
| `locker.error` | (`error`: `Error`, `id`: `string`) => `void` |
| `locker.goingDown` | (`id`: `string`) => `void` |
| `locker.goingUp` | (`id`: `string`) => `void` |
| `locker.up` | (`id`: `string`) => `void` |

___

### TRedisClientEvent

Ƭ **TRedisClientEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `end` | () => `void` |
| `error` | (`err`: `Error`) => `void` |
| `message` | (`channel`: `string`, `message`: `string`) => `void` |
| `pmessage` | (`pattern`: `string`, `channel`: `string`, `message`: `string`) => `void` |
| `ready` | () => `void` |

___

### TTimer

Ƭ **TTimer**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `fn` | [`TFunction`](README.md#tfunction) |
| `periodic` | `boolean` |
| `timer` | `NodeJS.Timeout` |

___

### TTimerEvent

Ƭ **TTimerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `error` | (`err`: `Error`) => `void` |

___

### TUnaryFunction

Ƭ **TUnaryFunction**\<`T`, `E`\>: (`reply`: `T`) => `E`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `E` | `void` |

#### Type declaration

▸ (`reply`): `E`

##### Parameters

| Name | Type |
| :------ | :------ |
| `reply` | `T` |

##### Returns

`E`

___

### TWorkerCallableFunction

Ƭ **TWorkerCallableFunction**: (`args`: `unknown`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`unknown`\>) => `void`

#### Type declaration

▸ (`args`, `cb`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `unknown` |
| `cb` | [`ICallback`](interfaces/ICallback.md)\<`unknown`\> |

##### Returns

`void`

___

### TWorkerFunction

Ƭ **TWorkerFunction**: [`TWorkerRunnableFunctionFactory`](README.md#tworkerrunnablefunctionfactory) \| [`TWorkerCallableFunction`](README.md#tworkercallablefunction)

___

### TWorkerResourceGroupEvent

Ƭ **TWorkerResourceGroupEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `workerResourceGroup.error` | (`err`: `Error`) => `void` |

___

### TWorkerRunnableFunctionFactory

Ƭ **TWorkerRunnableFunctionFactory**: (`initialPayload`: `unknown`) => [`IWorkerRunnable`](interfaces/IWorkerRunnable.md)

#### Type declaration

▸ (`initialPayload`): [`IWorkerRunnable`](interfaces/IWorkerRunnable.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `initialPayload` | `unknown` |

##### Returns

[`IWorkerRunnable`](interfaces/IWorkerRunnable.md)

___

### TWorkerThreadChildError

Ƭ **TWorkerThreadChildError**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `name` | `string` |

___

### TWorkerThreadChildMessage

Ƭ **TWorkerThreadChildMessage**\<`Data`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `unknown` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `code` | [`TWorkerThreadChildMessageCode`](README.md#tworkerthreadchildmessagecode) |
| `data?` | `Data` |
| `error?` | [`TWorkerThreadChildError`](README.md#tworkerthreadchilderror) \| ``null`` |

___

### TWorkerThreadChildMessageCode

Ƭ **TWorkerThreadChildMessageCode**: [`EWorkerThreadChildExitCode`](enums/EWorkerThreadChildExitCode.md) \| [`EWorkerThreadChildExecutionCode`](enums/EWorkerThreadChildExecutionCode.md)

___

### TWorkerThreadParentMessage

Ƭ **TWorkerThreadParentMessage**: [`TWorkerThreadParentMessageCall`](README.md#tworkerthreadparentmessagecall) \| [`TWorkerThreadParentMessageRun`](README.md#tworkerthreadparentmessagerun) \| [`TWorkerThreadParentMessageShutdown`](README.md#tworkerthreadparentmessageshutdown)

___

### TWorkerThreadParentMessageCall

Ƭ **TWorkerThreadParentMessageCall**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `payload` | `unknown` |
| `type` | [`CALL`](enums/EWorkerThreadParentMessage.md#call) |

___

### TWorkerThreadParentMessageRun

Ƭ **TWorkerThreadParentMessageRun**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | [`RUN`](enums/EWorkerThreadParentMessage.md#run) |

___

### TWorkerThreadParentMessageShutdown

Ƭ **TWorkerThreadParentMessageShutdown**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | [`SHUTDOWN`](enums/EWorkerThreadParentMessage.md#shutdown) |

## Variables

### async

• `Const` **async**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `each` | \<T\>(`collection`: `Record`\<`string`, `T`\> \| `T`[], `iteratee`: (`item`: `T`, `key`: `string` \| `number`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `eachIn` | \<T\>(`collection`: `Record`\<`string`, `T`\>, `iteratee`: (`item`: `T`, `key`: `string`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `eachOf` | \<T\>(`collection`: `T`[], `iteratee`: (`item`: `T`, `key`: `number`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `waterfall` | \<T\>(`tasks`: [`TFunction`](README.md#tfunction)\<`void`, `any`\>[], `callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` |

___

### logger

• `Const` **logger**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `destroy` | () => `void` |
| `getLogger` | (`cfg`: [`ILoggerConfig`](interfaces/ILoggerConfig.md), `ns?`: `string`) => [`ILogger`](interfaces/ILogger.md) |
| `setLogger` | \<T\>(`logger`: `T`) => `void` |

## Functions

### createRedisClient

▸ **createRedisClient**(`config`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IRedisConfig`](interfaces/IRedisConfig.md) |
| `cb` | [`ICallback`](interfaces/ICallback.md)\<[`IRedisClient`](interfaces/IRedisClient.md)\> |

#### Returns

`void`

___

### getDirname

▸ **getDirname**(): `string`

#### Returns

`string`
