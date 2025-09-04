[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsoleLogger

# Class: ConsoleLogger

ConsoleLogger implements the ILogger interface and provides
formatted logging with timestamps to the console.

## Implements

- [`ILogger`](../interfaces/ILogger.md)

## Constructors

### Constructor

> **new ConsoleLogger**(`options`): `ConsoleLogger`

Creates a new ConsoleLogger instance.

#### Parameters

##### options

[`IConsoleLoggerOptions`](../interfaces/IConsoleLoggerOptions.md) = `{}`

Configuration options for the logger

#### Returns

`ConsoleLogger`

## Methods

### debug()

> **debug**(`message`, ...`params`): `void`

Logs a debug message to the console.

#### Parameters

##### message

`unknown`

The message to log

##### params

...`unknown`[]

Additional parameters to log

#### Returns

`void`

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`debug`](../interfaces/ILogger.md#debug)

***

### error()

> **error**(`message`, ...`params`): `void`

Logs an error message to the console.

#### Parameters

##### message

`unknown`

The message to log

##### params

...`unknown`[]

Additional parameters to log

#### Returns

`void`

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`error`](../interfaces/ILogger.md#error)

***

### info()

> **info**(`message`, ...`params`): `void`

Logs an info message to the console.

#### Parameters

##### message

`unknown`

The message to log

##### params

...`unknown`[]

Additional parameters to log

#### Returns

`void`

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`info`](../interfaces/ILogger.md#info)

***

### isFormatted()

> **isFormatted**(`message`): `boolean`

Checks if a message already contains a timestamp and log level.
Takes into account possible ANSI color codes in the message.

#### Parameters

##### message

`unknown`

The message to check

#### Returns

`boolean`

Whether the message already contains a timestamp and log level

***

### warn()

> **warn**(`message`, ...`params`): `void`

Logs a warning message to the console.

#### Parameters

##### message

`unknown`

The message to log

##### params

...`unknown`[]

Additional parameters to log

#### Returns

`void`

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`warn`](../interfaces/ILogger.md#warn)
