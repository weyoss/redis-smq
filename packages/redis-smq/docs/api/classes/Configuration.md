[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Configuration

# Class: Configuration

Configuration class for managing and setting up the RedisSMQ message queue.

## Methods

### getConfig()

> **getConfig**(): [`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

Retrieves the current configuration settings for the RedisSMQ library.

#### Returns

[`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

An object containing the required configuration properties including
`namespace`, `redis`, `logger`, `messages`, and `eventBus`.

#### Example

```typescript
const myConfig = Configuration.getSetConfig();
console.log(myConfig);
```

***

### getSetConfig()

> `static` **getSetConfig**(`config`): [`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

A static method that returns the singleton instance of the Configuration class.
If an instance does not exist, it creates a new one using the provided configuration.

#### Parameters

##### config

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md) = `{}`

An optional configuration object for the RedisSMQ.
If not provided, an empty object is used.

#### Returns

[`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

The singleton instance of the Configuration class,
containing the required configuration properties.

#### Example

```typescript
const config = {
  namespace: 'myNamespace',
  redis: {
    host: 'localhost',
    port: 6379,
  },
};

const myConfig = Configuration.getSetConfig(config);
console.log(myConfig);
```

***

### reset()

> `static` **reset**(): `void`

Resets the singleton instance of the Configuration class.
This method is used to clear the current configuration and allow for a new instance to be created.

#### Returns

`void`

#### Remarks

This method is useful when testing or when changing the configuration settings dynamically.
After calling this method, the next time `getSetConfig` is called, a new instance of the Configuration class will be created.

#### Example

```typescript
// Create a configuration instance
const config = {
  namespace: 'myNamespace',
  redis: {
    host: 'localhost',
    port: 6379,
  },
};

const myConfig = Configuration.getSetConfig(config);

// Reset the configuration
Configuration.reset();

// Create a new configuration instance
const newConfig = Configuration.getSetConfig();
```
