[RedisSMQ Common Library](../README.md) / Logger

# Logger

Logging is an essential part of any application for debugging, monitoring, and auditing purposes.
The redis-smq-common logging system provides a simple yet powerful interface to log messages with different severity
levels (debug, info, warn, error) and supports namespaces for better organization.

## Configuration

### Configuration Parameters

The logger can be configured using an [ILoggerConfig](api/interfaces/ILoggerConfig.md) object. The most important
configuration option is enabled, which determines whether logging is active or not.

### Configuration Example

```javascript
'use strict';

const path = require('path');

module.exports = {
  logger: {
    enabled: false,
  },
};
```

- `logger` _(object): Optional._ Configuration object for logging parameters.
- `logger.enabled` _(boolean): Optional._ Enable or disable logging. By default, logging is disabled.

## Usage

### Enabling Logging

By default, logging is disabled. Logging can affect message processing performance due to I/O operations.

To enable logging, set `cfg.enabled` to `true` in the configuration. This will initialize the Node.js console logger as
the default logger.

### Example

Here's a basic example of how to configure and use the logger:

```typescript
import { logger } from './logger';

// Configuration for enabling the logger
const config = {
  enabled: true,
};

// Get a logger instance with a namespace
const log = logger.getLogger(config, 'MyNamespace');

// Log messages
log.info('This is an info message');
log.warn('This is a warning message');
log.error('This is an error message');
log.debug('This is a debug message');
```

### Setting up a custom logger

To set up and use a custom logger:

#### 1. Create your custom logger:

First, create a custom logger that implements the `ILogger` interface. This interface is defined in the project as:

```typescript
export interface ILogger {
  info(message: unknown, ...params: unknown[]): void;
  warn(message: unknown, ...params: unknown[]): void;
  error(message: unknown, ...params: unknown[]): void;
  debug(message: unknown, ...params: unknown[]): void;
}
```

Your custom logger should implement these methods.

#### 2. Set the custom logger:

Use the `setLogger` function from the `logger` object to set your custom logger. This should be done before any other
parts of the application try to use the logger.

```typescript
import { logger } from 'path-to-logger-file';

// Assuming you have created a custom logger called MyCustomLogger
const myCustomLogger = new MyCustomLogger();

// Set the custom logger
logger.setLogger(myCustomLogger);
```

#### 3. Use the logger:

After setting the custom logger, you can use it throughout your application by calling `getLogger`:

```typescript
const myLogger = logger.getLogger({ enabled: true }, 'MyNamespace');

myLogger.info('This is an info message');
myLogger.warn('This is a warning');
myLogger.error('This is an error');
myLogger.debug('This is a debug message');
```

Note that the `getLogger` function takes two parameters:

- An `ILoggerConfig` object, which includes an `enabled` flag and optional `options`.
- An optional namespace string, which will be prepended to log messages.

#### 4. Clean up:

If needed, you can destroy the logger instance using:

```typescript
logger.destroy();
```

### Using a third party logging library

Any other library that fulfills the ILogger interface may be used the same way as using a custom logger.

Here's a step-by-step guide on how to do this, using Winston as an example:

#### 1. Install the new logging package:

```bash
npm install winston
```

#### 2. Set the winston logger as the default logger:

```typescript
import winston from 'winston';
import { logger } from 'redis-smq-common';

// Create an instance of the Winston logger wrapper
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Set it as the default logger
logger.setLogger(winstonLogger);
```

#### 3. Use the logger throughout your application:

```typescript
import { logger } from 'redis-smq-common';

const myLogger = logger.getLogger({ enabled: true }, 'MyNamespace');

myLogger.info('This is an info message');
myLogger.warn('This is a warning');
myLogger.error('This is an error');
myLogger.debug('This is a debug message');
```

Remember that you can only set the logger once. If you try to set it again, it will throw a `LoggerError` with the
message "Logger has been already initialized."
