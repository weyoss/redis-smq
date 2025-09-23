[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / createLogger

# Function: createLogger()

> **createLogger**(`cfg`, `ns`): [`ILogger`](../interfaces/ILogger.md)

Creates a logger instance based on the provided configuration and optional namespace.
If logging is disabled in the configuration, a dummy logger is returned.

## Parameters

### cfg

[`ILoggerConfig`](../interfaces/ILoggerConfig.md) = `{}`

Logger configuration specifying if logging is enabled.

### ns

Optional namespaces to prepend to each log message.

`string` | `string`[]

## Returns

[`ILogger`](../interfaces/ILogger.md)

An ILogger instance.

## Throws

LoggerError if the namespace is invalid.
