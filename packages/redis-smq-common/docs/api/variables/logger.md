[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / logger

# Variable: logger

> `const` **logger**: `object`

## Type Declaration

### destroy()

> **destroy**: () => `void`

Clears the global logger instance.

#### Returns

`void`

### getLogger()

> **getLogger**: (`cfg`, `ns?`) => [`ILogger`](../interfaces/ILogger.md)

Retrieves a logger instance based on the provided configuration and optional namespace.
If logging is disabled in the configuration, a dummy logger is returned.
If no logger has been previously set, the built-in console is used.

#### Parameters

##### cfg

[`ILoggerConfig`](../interfaces/ILoggerConfig.md) = `{}`

Logger configuration specifying if logging is enabled.

##### ns?

`string`

Optional namespace to prepend to each log message.

#### Returns

[`ILogger`](../interfaces/ILogger.md)

An ILogger instance.

#### Throws

LoggerError if the namespace is invalid.

### setLogger()

> **setLogger**: \<`T`\>(`logger`) => `void`

Sets the global logger instance.

#### Type Parameters

##### T

`T` *extends* [`ILogger`](../interfaces/ILogger.md)

#### Parameters

##### logger

`T`

An instance implementing ILogger to be used as the logger.

#### Returns

`void`

#### Throws

LoggerError if a logger is already set.
