[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsoleLogger

# Class: ConsoleLogger

ConsoleLogger implements the ILogger interface and provides formatted logging
with timestamps, namespaces, and color-coded output to the console.

This logger supports hierarchical namespacing through child logger creation,
configurable log levels, and customizable message formatting.

## Example

```typescript
// Basic usage
const logger = new ConsoleLogger();
logger.info('Hello world');

// With configuration
const logger = new ConsoleLogger({
  logLevel: EConsoleLoggerLevel.DEBUG,
  colorize: true,
  includeTimestamp: true,
});

// With namespaces
const logger = new ConsoleLogger({}, ['app', 'service']);
logger.info('Service started'); // Output: [timestamp] INFO (app / service): Service started
```

## Implements

- [`ILogger`](../interfaces/ILogger.md)

## Constructors

### Constructor

> **new ConsoleLogger**(`options`, `namespaces`): `ConsoleLogger`

Creates a new ConsoleLogger instance with the specified configuration and namespaces.

#### Parameters

##### options

[`IConsoleLoggerOptions`](../interfaces/IConsoleLoggerOptions.md) = `{}`

Configuration options for the logger behavior and formatting

##### namespaces

Single namespace string or array of namespace strings for message categorization

`string` | `string`[]

#### Returns

`ConsoleLogger`

#### Throws

When any namespace is empty or contains invalid characters

#### Example

```typescript
// Default logger
const logger = new ConsoleLogger();

// Configured logger
const logger = new ConsoleLogger({
  logLevel: EConsoleLoggerLevel.WARN,
  colorize: false,
  includeTimestamp: true,
});

// Logger with namespaces
const logger = new ConsoleLogger({}, ['api', 'auth']);
const logger2 = new ConsoleLogger({}, 'database');
```

## Methods

### createLogger()

> **createLogger**(`ns`): [`ILogger`](../interfaces/ILogger.md)

Creates a new child logger instance with an additional namespace.

The new logger inherits the configuration of the parent logger but appends
the given namespace to its namespace hierarchy. This is useful for creating
more specific loggers for different parts of an application.

#### Parameters

##### ns

`string`

The namespace string to append to the current logger's namespaces.

#### Returns

[`ILogger`](../interfaces/ILogger.md)

A new `ILogger` instance with the extended namespace.

#### Example

```typescript
const appLogger = new ConsoleLogger({}, 'app');
const serviceLogger = appLogger.createLogger('service');
serviceLogger.info('This message is from the service.');
// Output: [timestamp] INFO (app / service): This message is from the service.
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`createLogger`](../interfaces/ILogger.md#createlogger)

---

### debug()

> **debug**(`message`, ...`params`): `void`

Logs a debug message to the console with DEBUG level formatting.
Debug messages are typically used for detailed diagnostic information
that is only of interest when diagnosing problems.

#### Parameters

##### message

`unknown`

The primary message to log (any type, will be stringified if not a string)

##### params

...`unknown`[]

Additional parameters to log alongside the message

#### Returns

`void`

#### Example

```typescript
logger.debug('User authentication started');
logger.debug('Request data:', { userId: 123, action: 'login' });
logger.debug({ complex: 'object', data: [1, 2, 3] });
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`debug`](../interfaces/ILogger.md#debug)

---

### error()

> **error**(`message`, ...`params`): `void`

Logs an error message to the console with ERROR level formatting.
Error messages indicate serious problems that should be investigated immediately.

#### Parameters

##### message

`unknown`

The primary error message to log (any type, will be stringified if not a string)

##### params

...`unknown`[]

Additional parameters such as error objects, stack traces, or context data

#### Returns

`void`

#### Example

```typescript
logger.error('Database connection failed');
logger.error('Authentication error:', error);
logger.error('Critical system failure', { code: 500, details: errorDetails });
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`error`](../interfaces/ILogger.md#error)

---

### getLogLevel()

> **getLogLevel**(): [`EConsoleLoggerLevel`](../enumerations/EConsoleLoggerLevel.md)

Gets the current minimum log level of this logger instance.
Messages with levels below this threshold will be suppressed.

#### Returns

[`EConsoleLoggerLevel`](../enumerations/EConsoleLoggerLevel.md)

The current log level enum value

#### Example

```typescript
const logger = new ConsoleLogger({ logLevel: EConsoleLoggerLevel.WARN });
console.log(logger.getLogLevel()); // 2 (EConsoleLoggerLevel.WARN)
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`getLogLevel`](../interfaces/ILogger.md#getloglevel)

---

### getNamespaces()

> **getNamespaces**(): `string`[]

Gets the current namespaces of this logger instance.
Returns a defensive copy to prevent external modification of the internal namespace array.

#### Returns

`string`[]

A copy of the current namespaces array

#### Example

```typescript
const logger = new ConsoleLogger({}, ['app', 'service']);
const namespaces = logger.getNamespaces();
console.log(namespaces); // ['app', 'service']

// Modifying returned array doesn't affect logger
namespaces.push('modified');
console.log(logger.getNamespaces()); // Still ['app', 'service']
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`getNamespaces`](../interfaces/ILogger.md#getnamespaces)

---

### info()

> **info**(`message`, ...`params`): `void`

Logs an informational message to the console with INFO level formatting.
Info messages provide general information about application flow and important events.

#### Parameters

##### message

`unknown`

The primary informational message to log (any type, will be stringified if not a string)

##### params

...`unknown`[]

Additional parameters to provide context or supplementary information

#### Returns

`void`

#### Example

```typescript
logger.info('Application started successfully');
logger.info('User logged in:', { userId: 123, username: 'john_doe' });
logger.info('Processing completed', {
  recordsProcessed: 1500,
  duration: '2.3s',
});
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`info`](../interfaces/ILogger.md#info)

---

### warn()

> **warn**(`message`, ...`params`): `void`

Logs a warning message to the console with WARN level formatting.
Warning messages indicate potentially harmful situations that should be noted
but don't prevent the application from continuing.

#### Parameters

##### message

`unknown`

The primary warning message to log (any type, will be stringified if not a string)

##### params

...`unknown`[]

Additional parameters to provide context about the warning condition

#### Returns

`void`

#### Example

```typescript
logger.warn('API rate limit approaching');
logger.warn('Deprecated method used:', {
  method: 'oldFunction',
  alternative: 'newFunction',
});
logger.warn('Configuration missing, using defaults', {
  missingKeys: ['timeout', 'retries'],
});
```

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`warn`](../interfaces/ILogger.md#warn)
