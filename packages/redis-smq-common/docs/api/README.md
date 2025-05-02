[RedisSMQ Common Library](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Table of contents

### Enumerations

- [EConsoleLoggerLevel](enums/EConsoleLoggerLevel.md)
- [ERedisConfigClient](enums/ERedisConfigClient.md)
- [EWorkerThreadChildExecutionCode](enums/EWorkerThreadChildExecutionCode.md)
- [EWorkerThreadChildExitCode](enums/EWorkerThreadChildExitCode.md)
- [EWorkerThreadParentMessage](enums/EWorkerThreadParentMessage.md)
- [EWorkerType](enums/EWorkerType.md)

### Classes

- [ConsoleLogger](classes/ConsoleLogger.md)
- [EventBus](classes/EventBus.md)
- [EventBusRedis](classes/EventBusRedis.md)
- [EventBusRedisFactory](classes/EventBusRedisFactory.md)
- [EventEmitter](classes/EventEmitter.md)
- [FileLock](classes/FileLock.md)
- [PowerSwitch](classes/PowerSwitch.md)
- [RedisClientFactory](classes/RedisClientFactory.md)
- [RedisLock](classes/RedisLock.md)
- [RedisServer](classes/RedisServer.md)
- [Runnable](classes/Runnable.md)
- [Timer](classes/Timer.md)
- [WorkerCallable](classes/WorkerCallable.md)
- [WorkerResourceGroup](classes/WorkerResourceGroup.md)
- [WorkerRunnable](classes/WorkerRunnable.md)

### Error Classes

- [AbortError](classes/AbortError.md)
- [AsyncCallbackTimeoutError](classes/AsyncCallbackTimeoutError.md)
- [CallbackEmptyReplyError](classes/CallbackEmptyReplyError.md)
- [CallbackInvalidReplyError](classes/CallbackInvalidReplyError.md)
- [EventBusError](classes/EventBusError.md)
- [EventBusInstanceLockError](classes/EventBusInstanceLockError.md)
- [EventBusNotConnectedError](classes/EventBusNotConnectedError.md)
- [InstanceLockError](classes/InstanceLockError.md)
- [LockAcquireError](classes/LockAcquireError.md)
- [LockError](classes/LockError.md)
- [LockExtendError](classes/LockExtendError.md)
- [LockMethodNotAllowedError](classes/LockMethodNotAllowedError.md)
- [LockNotAcquiredError](classes/LockNotAcquiredError.md)
- [LoggerError](classes/LoggerError.md)
- [PanicError](classes/PanicError.md)
- [RedisClientError](classes/RedisClientError.md)
- [RedisSMQError](classes/RedisSMQError.md)
- [RedisServerBinaryNotFoundError](classes/RedisServerBinaryNotFoundError.md)
- [RedisServerError](classes/RedisServerError.md)
- [RedisServerUnsupportedPlatformError](classes/RedisServerUnsupportedPlatformError.md)
- [TimerError](classes/TimerError.md)
- [WatchedKeysChangedError](classes/WatchedKeysChangedError.md)
- [WorkerAlreadyDownError](classes/WorkerAlreadyDownError.md)
- [WorkerAlreadyRunningError](classes/WorkerAlreadyRunningError.md)
- [WorkerError](classes/WorkerError.md)
- [WorkerPayloadRequiredError](classes/WorkerPayloadRequiredError.md)
- [WorkerThreadError](classes/WorkerThreadError.md)

### Interfaces

- [ICallback](interfaces/ICallback.md)
- [IConsoleLoggerOptions](interfaces/IConsoleLoggerOptions.md)
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

- [ExtractAsyncOperationReturnType](README.md#extractasyncoperationreturntype)
- [MapAsyncOperationReturnTypeToResult](README.md#mapasyncoperationreturntypetoresult)
- [TAsyncFunction](README.md#tasyncfunction)
- [TAsyncOperation](README.md#tasyncoperation)
- [TAsyncOperationList](README.md#tasyncoperationlist)
- [TConsoleLoggerLevelName](README.md#tconsoleloggerlevelname)
- [TConsoleLoggerOptionsDateFormatter](README.md#tconsoleloggeroptionsdateformatter)
- [TEventBusEvent](README.md#teventbusevent)
- [TEventEmitterEvent](README.md#teventemitterevent)
- [TFunction](README.md#tfunction)
- [TLockerEvent](README.md#tlockerevent)
- [TRedisClientEvent](README.md#tredisclientevent)
- [TTimer](README.md#ttimer)
- [TTimerEvent](README.md#ttimerevent)
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

- [archive](README.md#archive)
- [async](README.md#async)
- [env](README.md#env)
- [logger](README.md#logger)
- [net](README.md#net)

### Functions

- [createRedisClient](README.md#createredisclient)
- [withEventBus](README.md#witheventbus)
- [withRedisClient](README.md#withredisclient)

## Type Aliases

### ExtractAsyncOperationReturnType

Ƭ **ExtractAsyncOperationReturnType**\<`T`\>: `T` extends [`TAsyncOperation`](README.md#tasyncoperation)\<infer R\> ? `R` : `never`

Helper type to extract the result type from a callback-based async operation

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | extends [`TAsyncOperation`](README.md#tasyncoperation)\<`unknown`\> | The async operation type |

___

### MapAsyncOperationReturnTypeToResult

Ƭ **MapAsyncOperationReturnTypeToResult**\<`AsyncOperationList`\>: \{ [K in keyof AsyncOperationList]: ExtractAsyncOperationReturnType\<AsyncOperationList[K]\> }

Maps an array of operation types to an array of their result types

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `AsyncOperationList` | extends [`TAsyncOperationList`](README.md#tasyncoperationlist) | Array of async operations |

___

### TAsyncFunction

Ƭ **TAsyncFunction**\<`TArgs`, `TResult`\>: [args: TArgs, callback: ICallback\<TResult\>]

Represents a tuple where the last element is a callback function

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `TArgs` | extends `any`[] = [] | The types of the arguments in the tuple (excluding the callback) |
| `TResult` | `any` | The type of result passed to the callback |

___

### TAsyncOperation

Ƭ **TAsyncOperation**\<`TResult`\>: (`cb`: [`ICallback`](interfaces/ICallback.md)\<`TResult`\>) => `void`

Represents an asynchronous operation that accepts a callback

#### Type parameters

| Name | Description |
| :------ | :------ |
| `TResult` | The type of result the operation produces |

#### Type declaration

▸ (`cb`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](interfaces/ICallback.md)\<`TResult`\> |

##### Returns

`void`

___

### TAsyncOperationList

Ƭ **TAsyncOperationList**: [`TAsyncOperation`](README.md#tasyncoperation)\<`unknown`\>[]

An array of asynchronous operations that can be executed sequentially or in parallel
Each operation in the array can produce a different result type

___

### TConsoleLoggerLevelName

Ƭ **TConsoleLoggerLevelName**: keyof typeof [`EConsoleLoggerLevel`](enums/EConsoleLoggerLevel.md)

Type for log level names

___

### TConsoleLoggerOptionsDateFormatter

Ƭ **TConsoleLoggerOptionsDateFormatter**: (`date`: `Date`) => `string`

Type for date format function

#### Type declaration

▸ (`date`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |

##### Returns

`string`

___

### TEventBusEvent

Ƭ **TEventBusEvent**: [`TEventEmitterEvent`](README.md#teventemitterevent) & \{ `error`: (`err`: `Error`) => `void`  }

___

### TEventEmitterEvent

Ƭ **TEventEmitterEvent**: `Record`\<`string`, (...`args`: `any`[]) => `void`\>

___

### TFunction

Ƭ **TFunction**\<`TArgs`, `TReturn`\>: (...`args`: `TArgs`) => `TReturn`

A generic function type that can accept any number of arguments and return any type

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `TArgs` | extends `any`[] = `any`[] | The types of the arguments |
| `TReturn` | `any` | The return type of the function |

#### Type declaration

▸ (`...args`): `TReturn`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TArgs` |

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

### archive

• `Const` **archive**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `extractRpm` | (`filePath`: `string`, `destinationDirectory`: `string`) => `Promise`\<`void`\> |
| `extractTgz` | (`tgzPath`: `string`, `destDir`: `string`) => `Promise`\<`void`\> |

___

### async

• `Const` **async**: `Object`

A utility providing generic callback handling functions

This helper centralizes common callback patterns and error handling
to ensure consistent behavior across the application.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `each` | \<T\>(`collection`: `Record`\<`string`, `T`\> \| `T`[], `iteratee`: (`item`: `T`, `key`: `string` \| `number`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `eachIn` | \<T\>(`collection`: `Record`\<`string`, `T`\>, `iteratee`: (`item`: `T`, `key`: `string`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `eachOf` | \<T\>(`collection`: `T`[], `iteratee`: (`item`: `T`, `key`: `number`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void` |
| `exec` | \<T\>(`operation`: (`cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` |
| `map` | \<T, R\>(`items`: `T`[], `operation`: (`item`: `T`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R`\>) => `void`, `chunkSize`: `number`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`R`[]\>) => `void` |
| `parallel` | \<AsyncOperationList\>(`operations`: [...AsyncOperationList[]], `callback`: [`ICallback`](interfaces/ICallback.md)\<[`MapAsyncOperationReturnTypeToResult`](README.md#mapasyncoperationreturntypetoresult)\<`AsyncOperationList`\>\>) => `void` |
| `series` | \<AsyncOperationList\>(`operations`: [...AsyncOperationList[]], `callback`: [`ICallback`](interfaces/ICallback.md)\<[`MapAsyncOperationReturnTypeToResult`](README.md#mapasyncoperationreturntypetoresult)\<`AsyncOperationList`\>\>) => `void` |
| `waterfall` | (`tasks`: [], `callback`: [`ICallback`](interfaces/ICallback.md)\<`void`\>) => `void`\<R1\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`\<R1, R2\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`\<R1, R2, R3\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`\<R1, R2, R3, R4\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`\<R1, R2, R3, R4, R5\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`\<R1, R2, R3, R4, R5, R6\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`, (`arg`: `R5`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`\<R1, R2, R3, R4, R5, R6, R7\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`, (`arg`: `R5`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`, (`arg`: `R6`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R7`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R7`\>) => `void`\<R1, R2, R3, R4, R5, R6, R7, R8\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`, (`arg`: `R5`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`, (`arg`: `R6`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R7`\>) => `void`, (`arg`: `R7`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R8`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R8`\>) => `void`\<R1, R2, R3, R4, R5, R6, R7, R8, R9\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`, (`arg`: `R5`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R9`\>) => `void`\<R1, R2, R3, R4, R5, R6, R7, R8, R9, R10\>(`tasks`: [(`cb`: [`ICallback`](interfaces/ICallback.md)\<`R1`\>) => `void`, (`arg`: `R1`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R2`\>) => `void`, (`arg`: `R2`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R3`\>) => `void`, (`arg`: `R3`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R4`\>) => `void`, (`arg`: `R4`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R5`\>) => `void`, (`arg`: `R5`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`R6`\>) => `void`], `callback`: [`ICallback`](interfaces/ICallback.md)\<`R10`\>) => `void` |
| `withCallback` | \<S, T\>(`setup`: (`cb`: [`ICallback`](interfaces/ICallback.md)\<`S`\>) => `void`, `operation`: (`resource`: `S`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` |
| `withCallbackList` | \<S, T\>(`setups`: \{ [K in string \| number \| symbol]: Function }, `operation`: (`resources`: `S`, `cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void`, `callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` |
| `withRetry` | \<T\>(`operation`: (`cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void`, `options`: \{ `maxAttempts?`: `number` ; `retryDelay?`: `number` ; `shouldRetry?`: (`err`: `Error`) => `boolean`  }, `callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` |
| `withTimeout` | \<T\>(`callback`: [`ICallback`](interfaces/ICallback.md)\<`T`\>, `timeoutMs`: `number`) => [`ICallback`](interfaces/ICallback.md)\<`T`\> |

___

### env

• `Const` **env**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `doesPathExist` | (`filePath`: `string`) => `Promise`\<`boolean`\> |
| `downloadFile` | (`url`: `string`, `savePath`: `string`) => `Promise`\<`void`\> |
| `ensureDirectoryExists` | (`dirPath`: `string`) => `Promise`\<`void`\> |
| `getCacheDir` | () => `string` |
| `getCurrentDir` | () => `string` |

___

### logger

• `Const` **logger**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `destroy` | () => `void` |
| `getLogger` | (`cfg`: [`ILoggerConfig`](interfaces/ILoggerConfig.md), `ns?`: `string`) => [`ILogger`](interfaces/ILogger.md) |
| `setLogger` | \<T\>(`logger`: `T`) => `void` |

___

### net

• `Const` **net**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getRandomPort` | () => `Promise`\<`number`\> |
| `isPortInUse` | (`port`: `number`) => `Promise`\<`boolean`\> |

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

### withEventBus

▸ **withEventBus**\<`S`, `T`\>(`eventBusRedisFactory`, `operation`, `callback`): `void`

A helper function for executing operations with an event bus instance

This function provides a standardized way to:
1. Get or create an event bus instance
2. Execute an operation with the event bus
3. Handle the callback with the result

#### Type parameters

| Name | Type |
| :------ | :------ |
| `S` | extends [`TEventBusEvent`](README.md#teventbusevent) |
| `T` | `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventBusRedisFactory` | [`EventBusRedisFactory`](classes/EventBusRedisFactory.md)\<`S`\> | The factory that provides the event bus instance |
| `operation` | (`eventBus`: [`IEventBus`](interfaces/IEventBus.md)\<`S`\>, `cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` | The operation to execute with the event bus |
| `callback` | [`ICallback`](interfaces/ICallback.md)\<`T`\> | The callback to invoke with the final result |

#### Returns

`void`

**`Typeparam`**

S - The type of events supported by the event bus

**`Typeparam`**

T - The type of data returned by the operation

___

### withRedisClient

▸ **withRedisClient**\<`T`\>(`redisClient`, `operation`, `callback`): `void`

Executes a Redis operation with standardized error handling

This helper method centralizes the common pattern of:
1. Getting a Redis client instance
2. Checking for client errors
3. Checking for empty client replies
4. Executing the Redis operation with proper error handling

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redisClient` | [`RedisClientFactory`](classes/RedisClientFactory.md) | Redis client to use for the operation |
| `operation` | (`client`: [`IRedisClient`](interfaces/IRedisClient.md), `cb`: [`ICallback`](interfaces/ICallback.md)\<`T`\>) => `void` | Function that performs the actual Redis operation |
| `callback` | [`ICallback`](interfaces/ICallback.md)\<`T`\> | The original callback to invoke with results |

#### Returns

`void`

**`Typeparam`**

T - The type of data returned by the operation
