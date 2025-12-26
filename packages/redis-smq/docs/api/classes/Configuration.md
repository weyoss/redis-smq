[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Configuration

# Class: Configuration

Configuration class for managing and setting up the RedisSMQ message queue.

This class provides a centralized way to manage RedisSMQ configuration with Redis persistence.
It follows the singleton pattern to ensure consistent configuration across the application.

Features:

- Persistent configuration storage in Redis
- Automatic configuration loading and saving
- Configuration validation and parsing

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

### getConfig()

> **getConfig**(): [`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Returns the current parsed configuration.

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The current configuration object

---

### load()

> **load**(`cb`): `void`

Loads the configuration from Redis. If not found, returns ConfigurationNotFoundError.

#### Parameters

##### cb

`ICallback`

Callback function called with the loaded configuration or error

#### Returns

`void`

---

### saveCurrentConfig()

> **saveCurrentConfig**(`cb`): `void`

Persists the current in-memory parsed configuration into Redis.

#### Parameters

##### cb

`ICallback`

Callback function called when save completes

#### Returns

`void`

---

### updateConfig()

> **updateConfig**(`updates`, `cb`): `void`

Updates the configuration with new values and persists to Redis.

This method merges the provided configuration updates with the current
configuration, validates the result, and saves it to Redis.

#### Parameters

##### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Partial configuration object with updates

##### cb

`ICallback`

Callback function called when update completes

#### Returns

`void`

#### Example

```typescript
const config = Configuration.getInstance();
config.updateConfig(
  {
    logger: { enabled: false },
    redis: { options: { host: 'new-host' } },
  },
  (err) => {
    if (err) {
      console.error('Failed to update configuration:', err);
      return;
    }
    console.log('Configuration updated successfully');
  },
);
```

---

### getConfig()

> `static` **getConfig**(): [`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Convenience accessor that returns the current parsed configuration
from the singleton instance.

Equivalent to Configuration.getInstance().getConfig().

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The current parsed configuration

#### Throws

When the configuration has not been initialized

#### Example

```typescript
const config = Configuration.getConfig();
console.log('Redis host:', config.redis.options.host);
```

---

### getInstance()

> `static` **getInstance**(): `Configuration`

Gets the already-initialized singleton instance of Configuration.

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

---

### initialize()

> `static` **initialize**(`cb`): `void`

Initializes the Configuration singleton.

This method attempts to load existing configuration from Redis. If no configuration
is found, it creates and saves a default configuration. This ensures that the
configuration is always persisted and available for subsequent application starts.

#### Parameters

##### cb

`ICallback`

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

---

### initializeWithConfig()

> `static` **initializeWithConfig**(`config`, `cb`): `void`

Initializes the Configuration singleton with a specific configuration.

This method allows you to initialize the configuration with a custom config object
instead of loading from Redis. The provided configuration will be validated, parsed,
and saved to Redis for persistence.

#### Parameters

##### config

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Configuration object to initialize with

##### cb

`ICallback`

Callback function called when initialization completes

#### Returns

`void`

#### Throws

When the configuration is already initialized

#### Example

```typescript
const customConfig = {
  namespace: 'production',
  redis: { options: { host: 'redis.example.com' } },
  logger: { enabled: true },
};

Configuration.initializeWithConfig(customConfig, (err) => {
  if (err) {
    console.error('Configuration initialization failed:', err);
    return;
  }

  console.log('Configuration initialized with custom config');
  const config = Configuration.getConfig();
});
```

---

### shutdown()

> `static` **shutdown**(`cb`): `void`

Shuts down the Configuration singleton and cleans up resources.

This method safely shuts down the configuration instance, ensuring that
any ongoing operations complete before cleanup. It prevents new operations
from starting during shutdown.

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
Configuration.shutdown((err) => {
  if (err) {
    console.error('Configuration shutdown failed:', err);
    return;
  }
  console.log('Configuration shut down successfully');
});
```
