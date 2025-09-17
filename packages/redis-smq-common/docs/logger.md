
[RedisSMQ Common Library](../README.md) / Logger

# Logger

## Overview

Logging is an essential part of any application for debugging, monitoring, and auditing purposes.
The redis-smq-common logging system provides a simple yet powerful interface to log messages with different severity
levels (debug, info, warn, error) and supports namespaces for better organization.

## Table of Contents

- [Basic Usage](#basic-usage)
    - [Enabling Logging](#enabling-logging)
    - [Logging Messages](#logging-messages)
    - [Cleaning Up](#cleaning-up)
- [Configuration](#configuration)
    - [Configuration Parameters](#configuration-parameters)
    - [Configuration Example](#configuration-example)
- [Built-in Console Logger](#built-in-console-logger)
    - [Log Levels](#log-levels)
    - [Advanced Configuration](#advanced-configuration)
- [Performance Considerations](#performance-considerations)

## Basic Usage

### Enabling Logging

By default, logging is disabled to optimize performance. Logging can affect message processing performance due to I/O operations.

To enable logging, set `cfg.enabled` to `true` in the configuration. This will initialize the builtin `ConsoleLogger` as
the default logger.

```typescript
import { logger } from 'redis-smq-common';

// Configuration for enabling the logger
const config = {
  enabled: true,
};

// Get a logger instance with a namespace
const log = logger.getLogger(config, 'MyNamespace');
```

### Logging Messages

Once you have a logger instance, you can log messages at different severity levels:

```typescript
// Log messages at different levels
log.info('This is an info message');
log.warn('This is a warning message');
log.error('This is an error message');
log.debug('This is a debug message');

// Log with additional parameters
log.info('User logged in', { userId: 123, timestamp: new Date() });
log.error('Operation failed', new Error('Database connection error'));
```

### Cleaning Up

If needed, you can destroy the logger instance using:

```typescript
logger.destroy();
```

This is particularly useful in testing environments or when you need to reset the logger configuration.

## Configuration

### Configuration Parameters

The logger can be configured using an [ILoggerConfig](api/interfaces/ILoggerConfig.md) object with the following properties:

| Property  | Type    | Required | Default | Description                                   |
|-----------|---------|----------|---------|-----------------------------------------------|
| `enabled` | boolean | No       | `false` | Determines whether logging is active          |
| `options` | object  | No       | `{}`    | Configuration options for the built-in logger |

### Configuration Example

```typescript
import { ILoggerConfig } from 'redis-smq-common';

const loggerConfig: ILoggerConfig = {
  enabled: true,
  options: {
    // Built-in logger options (see next section)
  }
};
```

## Built-in Console Logger

The redis-smq-common package comes with a built-in `ConsoleLogger` that provides basic logging functionality.

### Log Levels

The built-in logger supports the following log levels (in order of increasing severity):

| Level   | Description                                                      | Method        |
|---------|------------------------------------------------------------------|---------------|
| `DEBUG` | Detailed information for debugging purposes                      | `log.debug()` |
| `INFO`  | General information about application progress                   | `log.info()`  |
| `WARN`  | Warning messages that don't prevent the application from working | `log.warn()`  |
| `ERROR` | Error messages that might require attention                      | `log.error()` |

Only messages at or above the configured log level will be displayed.

### Advanced Configuration

The built-in `ConsoleLogger` can be configured with several options. 

#### Example 

```typescript
import { ILoggerConfig } from 'redis-smq-common';

const loggerConfig: ILoggerConfig = {
  enabled: true,
  options: {
    includeTimestamp: true,                 // Include timestamps in log messages
    colorize: true,                         // Use colors for different log levels
    logLevel: EConsoleLoggerLevel.INFO,     // Only show INFO level and above
  }
};
```

See [ILoggerConfig](api/interfaces/ILoggerConfig.md) for more details.

## Performance Considerations

For high-throughput applications, consider disabling logging in production or implementing log batching for third-party integrations.
