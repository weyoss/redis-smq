[RedisSMQ Common Library](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Enumerations

- [EConsoleLoggerLevel](enumerations/EConsoleLoggerLevel.md)
- [ERedisConfigClient](enumerations/ERedisConfigClient.md)
- [EWorkerThreadChildExecutionCode](enumerations/EWorkerThreadChildExecutionCode.md)
- [EWorkerThreadChildExitCode](enumerations/EWorkerThreadChildExitCode.md)
- [EWorkerThreadParentMessage](enumerations/EWorkerThreadParentMessage.md)
- [EWorkerType](enumerations/EWorkerType.md)

## Classes

- [ConsoleLogger](classes/ConsoleLogger.md)
- [EventBus](classes/EventBus.md)
- [EventBusRedis](classes/EventBusRedis.md)
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

## Error Classes

- [AbortError](classes/AbortError.md)
- [AsyncCallbackTimeoutError](classes/AsyncCallbackTimeoutError.md)
- [CallbackEmptyReplyError](classes/CallbackEmptyReplyError.md)
- [CallbackInvalidReplyError](classes/CallbackInvalidReplyError.md)
- [EventBusError](classes/EventBusError.md)
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
- [RedisServerBinaryNotFoundError](classes/RedisServerBinaryNotFoundError.md)
- [RedisServerError](classes/RedisServerError.md)
- [RedisServerUnsupportedPlatformError](classes/RedisServerUnsupportedPlatformError.md)
- [RedisSMQError](classes/RedisSMQError.md)
- [TimerError](classes/TimerError.md)
- [WatchedKeysChangedError](classes/WatchedKeysChangedError.md)
- [WorkerAlreadyDownError](classes/WorkerAlreadyDownError.md)
- [WorkerAlreadyRunningError](classes/WorkerAlreadyRunningError.md)
- [WorkerError](classes/WorkerError.md)
- [WorkerPayloadRequiredError](classes/WorkerPayloadRequiredError.md)
- [WorkerThreadError](classes/WorkerThreadError.md)

## Interfaces

- [ICallback](interfaces/ICallback.md)
- [IConsoleLoggerOptions](interfaces/IConsoleLoggerOptions.md)
- [IEventBusConfig](interfaces/IEventBusConfig.md)
- [IEventBusRedisConfig](interfaces/IEventBusRedisConfig.md)
- [IEventEmitter](interfaces/IEventEmitter.md)
- [ILogger](interfaces/ILogger.md)
- [ILoggerConfig](interfaces/ILoggerConfig.md)
- [IRedisClient](interfaces/IRedisClient.md)
- [IRedisConfig](interfaces/IRedisConfig.md)
- [IRedisTransaction](interfaces/IRedisTransaction.md)
- [IWatchTransactionAttemptResult](interfaces/IWatchTransactionAttemptResult.md)
- [IWatchTransactionOptions](interfaces/IWatchTransactionOptions.md)
- [IWorkerCallable](interfaces/IWorkerCallable.md)
- [IWorkerRunnable](interfaces/IWorkerRunnable.md)
- [IWorkerThreadData](interfaces/IWorkerThreadData.md)

## Type Aliases

- [ExtractAsyncOperationReturnType](type-aliases/ExtractAsyncOperationReturnType.md)
- [MapAsyncOperationReturnTypeToResult](type-aliases/MapAsyncOperationReturnTypeToResult.md)
- [TAsyncFunction](type-aliases/TAsyncFunction.md)
- [TAsyncOperation](type-aliases/TAsyncOperation.md)
- [TAsyncOperationList](type-aliases/TAsyncOperationList.md)
- [TConsoleLoggerLevelName](type-aliases/TConsoleLoggerLevelName.md)
- [TConsoleLoggerOptionsDateFormatter](type-aliases/TConsoleLoggerOptionsDateFormatter.md)
- [TEventBusEvent](type-aliases/TEventBusEvent.md)
- [TEventEmitterEvent](type-aliases/TEventEmitterEvent.md)
- [TFunction](type-aliases/TFunction.md)
- [TLockerEvent](type-aliases/TLockerEvent.md)
- [TRedisClientEvent](type-aliases/TRedisClientEvent.md)
- [TTimer](type-aliases/TTimer.md)
- [TTimerEvent](type-aliases/TTimerEvent.md)
- [TWorkerCallableFunction](type-aliases/TWorkerCallableFunction.md)
- [TWorkerFunction](type-aliases/TWorkerFunction.md)
- [TWorkerResourceGroupEvent](type-aliases/TWorkerResourceGroupEvent.md)
- [TWorkerRunnableFunctionFactory](type-aliases/TWorkerRunnableFunctionFactory.md)
- [TWorkerThreadChildMessage](type-aliases/TWorkerThreadChildMessage.md)
- [TWorkerThreadChildMessageCode](type-aliases/TWorkerThreadChildMessageCode.md)
- [TWorkerThreadParentMessage](type-aliases/TWorkerThreadParentMessage.md)
- [TWorkerThreadParentMessageCall](type-aliases/TWorkerThreadParentMessageCall.md)
- [TWorkerThreadParentMessageRun](type-aliases/TWorkerThreadParentMessageRun.md)
- [TWorkerThreadParentMessageShutdown](type-aliases/TWorkerThreadParentMessageShutdown.md)

## Variables

- [archive](variables/archive.md)
- [async](variables/async.md)
- [env](variables/env.md)
- [net](variables/net.md)

## Functions

- [createLogger](functions/createLogger.md)
- [withWatchTransaction](functions/withWatchTransaction.md)
