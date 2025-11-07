[RedisSMQ Common Library](../README.md) / Logger

# Logger

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Basic Logging](#basic-logging)
  - [Namespaced Logging](#namespaced-logging)
  - [Disabled Logging](#disabled-logging)
- [Log Levels](#log-levels)
- [API Reference](#api-reference)

---

## Overview

The `redis-smq-common` logger provides a simple, configurable logging solution with support for:

- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Hierarchical namespacing
- Colorized console output
- Timestamp formatting
- Performance-optimized dummy logger when disabled

## Installation

```bash
npm install redis-smq-common
```

## Configuration

Configure the logger using an `ILoggerConfig` object:

```typescript
import { ILoggerConfig, EConsoleLoggerLevel } from 'redis-smq-common';

const config: ILoggerConfig = {
  enabled: true, // Enable/disable logging
  options: {
    logLevel: EConsoleLoggerLevel.INFO, // Minimum log level
    colorize: true, // Enable colored output
    includeTimestamp: true, // Include timestamps
  },
};
```

## Usage

### Basic Logging

```typescript
import { createLogger, ILoggerConfig } from 'redis-smq-common';

const config: ILoggerConfig = {
  enabled: true,
  options: {
    logLevel: 'INFO',
    colorize: true,
    includeTimestamp: true,
  },
};

const logger = createLogger(config);

// Log messages at different levels
logger.debug('Debug information');
logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred');
```

### Namespaced Logging

Create loggers with namespaces for better message categorization:

```typescript
import { createLogger } from 'redis-smq-common';

const config = {
  enabled: true,
  options: { colorize: true, includeTimestamp: true },
};

// Single namespace
const dbLogger = createLogger(config, 'database');
dbLogger.info('Connection established');
// Output: [timestamp] INFO (database): Connection established

// Multiple namespaces
const apiLogger = createLogger(config, ['app', 'api', 'auth']);
apiLogger.warn('Rate limit exceeded');
// Output: [timestamp] WARN (app / api / auth): Rate limit exceeded
```

### Disabled Logging

When logging is disabled, the logger methods become no-ops while preserving the ConsoleLogger structure:

```typescript
import { createLogger, ConsoleLogger } from 'redis-smq-common';

// Disabled logger configuration
const config = {
  enabled: false, // Disable logging
  options: { colorize: true, includeTimestamp: true },
};

const logger = createLogger(config, 'service') as ConsoleLogger;

// All logging calls become no-ops (zero performance impact)
logger.debug('This will not be logged');
logger.info('This will not be logged');
logger.warn('This will not be logged');
logger.error('This will not be logged');

// But you can still create child loggers and access other methods
const childLogger = logger.createChild('database');
const namespaces = logger.getNamespaces(); // ['service']
const logLevel = logger.getLogLevel();
```

### Advanced Configuration

```typescript
import { createLogger, EConsoleLoggerLevel, ConsoleLogger } from 'redis-smq-common';

const config = {
  enabled: true,
  options: {
    logLevel: EConsoleLoggerLevel.WARN, // Only WARN and ERROR messages
    colorize: false, // Disable colors for production
    includeTimestamp: true,
  },
};

const logger = createLogger(config, 'production-service') as ConsoleLogger;

logger.debug('Debug message'); // Will not be logged (below WARN level)
logger.info('Info message');   // Will not be logged (below WARN level)
logger.warn('Warning message'); // Will be logged
logger.error('Error message');  // Will be logged

// Check if a level would be logged
if (logger.isLevelEnabled(EConsoleLoggerLevel.DEBUG)) {
  logger.debug('Expensive debug operation');
}
```

## Log Levels

The logger supports the following log levels (in ascending order of severity):

```typescript
enum EConsoleLoggerLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

You can specify log levels using either the enum or string values:

```typescript
// Using enum
const config1 = {
  enabled: true,
  options: { logLevel: EConsoleLoggerLevel.DEBUG },
};

// Using string
const config2 = {
  enabled: true,
  options: { logLevel: 'DEBUG' },
};
```

## API Reference

See [createLogger](api/functions/createLogger.md) for more details.
