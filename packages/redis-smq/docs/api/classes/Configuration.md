[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Configuration

# Class: Configuration

Configuration class for managing and setting up the RedisSMQ message queue.

This class provides a centralized way to manage RedisSMQ configuration with Redis persistence.
It follows the singleton pattern to ensure consistent configuration across the application.

Features:
- Persistent configuration storage in Redis
- Automatic configuration loading and saving
- Configuration validation and parsing
- Namespace-based configuration isolation
- Redis connection management

## Example

```typescript
// Initialize configuration
Configuration.initialize((err) => {
  if (err) {
    console.error('Failed to initialize configuration:', err);
    return;
  }

  // Get configuration instance
  const config = Configuration.getInstance();
  const currentConfig = config.getConfig();

  // Update configuration
  config.updateConfig({ logger: { enabled: false } }, (err) => {
    if (!err) console.log('Configuration updated');
  });
});
```

## Methods

### exists()

> **exists**(`cb`): `void`

Checks if configuration exists in Redis for the current namespace.

This method queries Redis to determine whether a configuration has been
previously saved for the current namespace. It's useful for determining
whether to load existing configuration or create a new one.

#### Parameters

##### cb

`ICallback`\<`boolean`\>

Callback function called with the existence check result

#### Returns

`void`

#### Throws

When Redis client initialization fails or Redis operations fail

#### Example

```typescript
const config = Configuration.getInstance();

config.exists((err, exists) => {
  if (err) {
    console.error('Failed to check configuration existence:', err);
    return;
  }

  if (exists) {
    console.log('Configuration exists in Redis');
    config.load((loadErr, loadedConfig) => {
      if (!loadErr) console.log('Configuration loaded');
    });
  } else {
    console.log('No configuration found, using defaults');
    config.saveCurrentConfig((saveErr) => {
      if (!saveErr) console.log('Default configuration saved');
    });
  }
});
```

***

### getConfig()

> **getConfig**(): [`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Gets the current configuration object.

This method returns the current parsed and validated configuration.
The returned object is a read-only representation of the configuration
and should not be modified directly. Use `updateConfig()` to make changes.

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The current parsed configuration containing all RedisSMQ settings

#### Example

```typescript
const config = Configuration.getInstance();
const currentConfig = config.getConfig();

console.log('NamespaceManager:', currentConfig.namespace);
console.log('Logger enabled:', currentConfig.logger.enabled);
console.log('Redis host:', currentConfig.redis.options.host);
console.log('Event bus enabled:', currentConfig.eventBus.enabled);
```

***

### load()

> **load**(`cb`): `void`

Loads configuration from Redis for the current namespace.

This method retrieves the stored configuration from Redis and updates the current
instance with the loaded values. The configuration is automatically parsed and
validated during the loading process.

#### Parameters

##### cb

`ICallback`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Callback function called with the loaded configuration or an error

#### Returns

`void`

#### Throws

When no configuration exists in Redis for the namespace

#### Throws

When Redis client initialization fails or JSON parsing fails

#### Example

```typescript
const config = Configuration.getInstance();
config.load((err, loadedConfig) => {
  if (err) {
    if (err instanceof ConfigurationNotFoundError) {
      console.log('No configuration found in Redis');
    } else {
      console.error('Failed to load configuration:', err);
    }
    return;
  }

  console.log('Configuration loaded:', loadedConfig.namespace);
});
```

***

### reset()

> **reset**(`cb`): `void`

#### Parameters

##### cb

`ICallback`

#### Returns

`void`

***

### save()

> **save**(`config`, `cb`): `void`

Saves the provided configuration to Redis.

This method validates, parses, and stores the configuration in Redis.
The configuration is automatically serialized to JSON format for storage.
After successful save, the current instance configuration is updated.

#### Parameters

##### config

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

The configuration object to save. This will be validated and parsed
               before being stored in Redis.

##### cb

`ICallback`

Callback function called when the save operation completes

#### Returns

`void`

#### Throws

When Redis client initialization fails or Redis operations fail

#### Example

```typescript
const config = Configuration.getInstance();
const newConfig = {
  namespace: 'my-app',
  logger: { enabled: true, options: { level: 'info' } },
  eventBus: { enabled: false }
};

config.save(newConfig, (err) => {
  if (err) {
    console.error('Failed to save configuration:', err);
    return;
  }

  console.log('Configuration saved successfully');
});
```

***

### saveCurrentConfig()

> **saveCurrentConfig**(`cb`): `void`

Saves the current instance configuration to Redis.

This is a convenience method that saves the current configuration without
needing to pass it as a parameter. It's particularly useful when you've
made changes to the configuration and want to persist them.

#### Parameters

##### cb

`ICallback`

Callback function called when the save operation completes

#### Returns

`void`

#### Throws

When Redis client initialization fails or Redis operations fail

#### Example

```typescript
const config = Configuration.getInstance();

// Modify configuration in memory
config.getConfig().logger.enabled = false;

// Save the current state to Redis
config.saveCurrentConfig((err) => {
  if (err) {
    console.error('Failed to save current configuration:', err);
    return;
  }

  console.log('Current configuration saved to Redis');
});
```

***

### updateConfig()

> **updateConfig**(`updates`, `cb`): `void`

Updates the current configuration with new values and saves to Redis.

This method merges the provided configuration updates with the current
configuration and saves the result to Redis. Only the provided fields
will be updated; other fields will retain their current values.

The configuration is validated and parsed before being saved, ensuring
that the updated configuration is valid and consistent.

#### Parameters

##### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Configuration updates to apply. Can be a partial configuration
                object containing only the fields you want to change.

##### cb

`ICallback`\<`void`\>

Callback function called when the update operation completes

#### Returns

`void`

#### Throws

When configuration validation fails or Redis operations fail

#### Example

```typescript
const config = Configuration.getInstance();

// Update only logger settings
config.updateConfig({
  logger: {
    enabled: false,
    options: { level: 'error' }
  }
}, (err) => {
  if (err) {
    console.error('Failed to update configuration:', err);
    return;
  }

  console.log('Logger configuration updated');
});

// Update multiple settings
config.updateConfig({
  logger: { enabled: true },
  eventBus: { enabled: true }
}, (err) => {
  if (!err) console.log('Multiple settings updated');
});
```

***

### getConfig()

> `static` **getConfig**(): [`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Gets the current configuration object.

This is a convenience method that combines `getInstance()` and `getConfig()`.

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The current parsed configuration

#### Throws

When the configuration has not been initialized

#### Example

```typescript
const config = Configuration.getConfig();
console.log('Current namespace:', config.namespace);
console.log('Redis host:', config.redis.options.host);
```

***

### getInstance()

> `static` **getInstance**(): `Configuration`

Gets the singleton instance of the Configuration class.

#### Returns

`Configuration`

The Configuration instance

#### Throws

When the configuration has not been initialized

#### Example

```typescript
try {
  const config = Configuration.getInstance();
  console.log('Configuration is ready');
} catch (err) {
  console.error('Configuration not initialized:', err.message);
}
```

***

### initialize()

> `static` **initialize**(`cb`): `void`

Initializes the Configuration singleton with the specified namespace and Redis configuration.

This method attempts to load existing configuration from Redis. If no configuration
is found, it creates and saves a default configuration. This ensures that the
configuration is always persisted and available for subsequent application starts.

#### Parameters

##### cb

`ICallback`\<`Configuration`\>

Callback function called when initialization completes

#### Returns

`void`

#### Throws

When the configuration is already initialized

#### Example

```typescript
Configuration.initialize((err) => {
  if (err) {
    console.error('Configuration initialization failed:', err);
    return;
  }

  console.log('Configuration initialized successfully');
  const config = Configuration.getConfig();
});
```

***

### initializeWithConfig()

> `static` **initializeWithConfig**(`config`, `cb`): `void`

#### Parameters

##### config

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

##### cb

`ICallback`

#### Returns

`void`

***

### shutdown()

> `static` **shutdown**(`cb`): `void`

Shuts down the Configuration singleton.

This method performs a clean shutdown by resetting the singleton instance to null.

After calling this method, you can call `initialize` again to create a new
configuration instance. This is particularly useful for testing scenarios,
application restarts, or when you need to reconfigure the application at runtime.

#### Parameters

##### cb

`ICallback`

Callback function called when the shutdown operation completes.

#### Returns

`void`

#### Example

```typescript
// Basic shutdown with error handling
Configuration.shutdown((err) => {
  if (err) {
    console.error('Failed to shutdown configuration:', err);
    return;
  }

  console.log('Configuration shutdown successfully');

  // Now safe to reinitialize
  Configuration.initialize((err) => {
    if (!err) {
      console.log('Configuration reinitialized');
    }
  });
});

// Shutdown in testing scenarios
afterEach((done) => {
  Configuration.shutdown(done);
});

// Shutdown during application exit
process.on('SIGTERM', () => {
  Configuration.shutdown((err) => {
    if (err) console.error('Shutdown error:', err);
    process.exit(err ? 1 : 0);
  });
});
```
