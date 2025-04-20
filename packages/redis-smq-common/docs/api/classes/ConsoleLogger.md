[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsoleLogger

# Class: ConsoleLogger

ConsoleLogger implements the ILogger interface and provides
formatted logging with timestamps to the console.

## Implements

- [`ILogger`](../interfaces/ILogger.md)

## Table of contents

### Constructors

- [constructor](ConsoleLogger.md#constructor)

### Methods

- [debug](ConsoleLogger.md#debug)
- [error](ConsoleLogger.md#error)
- [info](ConsoleLogger.md#info)
- [isFormatted](ConsoleLogger.md#isformatted)
- [warn](ConsoleLogger.md#warn)

## Constructors

### constructor

• **new ConsoleLogger**(`options?`): [`ConsoleLogger`](ConsoleLogger.md)

Creates a new ConsoleLogger instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`IConsoleLoggerOptions`](../interfaces/IConsoleLoggerOptions.md) | Configuration options for the logger |

#### Returns

[`ConsoleLogger`](ConsoleLogger.md)

## Methods

### debug

▸ **debug**(`message`, `...params`): `void`

Logs a debug message to the console.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `unknown` | The message to log |
| `...params` | `unknown`[] | Additional parameters to log |

#### Returns

`void`

#### Implementation of

[ILogger](../interfaces/ILogger.md).[debug](../interfaces/ILogger.md#debug)

___

### error

▸ **error**(`message`, `...params`): `void`

Logs an error message to the console.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `unknown` | The message to log |
| `...params` | `unknown`[] | Additional parameters to log |

#### Returns

`void`

#### Implementation of

[ILogger](../interfaces/ILogger.md).[error](../interfaces/ILogger.md#error)

___

### info

▸ **info**(`message`, `...params`): `void`

Logs an info message to the console.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `unknown` | The message to log |
| `...params` | `unknown`[] | Additional parameters to log |

#### Returns

`void`

#### Implementation of

[ILogger](../interfaces/ILogger.md).[info](../interfaces/ILogger.md#info)

___

### isFormatted

▸ **isFormatted**(`message`): `boolean`

Checks if a message already contains a timestamp and log level.
Takes into account possible ANSI color codes in the message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `unknown` | The message to check |

#### Returns

`boolean`

Whether the message already contains a timestamp and log level

___

### warn

▸ **warn**(`message`, `...params`): `void`

Logs a warning message to the console.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `unknown` | The message to log |
| `...params` | `unknown`[] | Additional parameters to log |

#### Returns

`void`

#### Implementation of

[ILogger](../interfaces/ILogger.md).[warn](../interfaces/ILogger.md#warn)
