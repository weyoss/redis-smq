[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ILoggerConfig

# Interface: ILoggerConfig

## Properties

### enabled?

> `optional` **enabled**: `boolean`

This property determines whether the logger is enabled or not.
If not set, logging operations will be disabled.

***

### options?

> `optional` **options**: [`IConsoleLoggerOptions`](IConsoleLoggerOptions.md)

Options used to configure the ConsoleLogger when it is used.
ConsoleLogger is used by default if no other logger is provided.
