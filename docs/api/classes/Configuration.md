[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Configuration

# Class: Configuration

Configuration class for managing and setting up the RedisSMQ message queue.
This class is responsible for creating and managing instances of other configuration classes,
such as Namespace, Redis, Logger, Messages, and EventBus.

## Table of contents

### Methods

- [getConfig](Configuration.md#getconfig)
- [getSetConfig](Configuration.md#getsetconfig)
- [reset](Configuration.md#reset)

## Methods

### getConfig

▸ **getConfig**(): [`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

Retrieves the current configuration settings for the RedisSMQ library.

#### Returns

[`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

An object containing the required configuration properties:
- `namespace`: An instance of the Namespace class, representing the namespace for Redis keys.
- `redis`: An instance of the Redis class, managing the Redis connection.
- `logger`: An instance of the Logger class, responsible for logging messages.
- `messages`: An instance of the Messages class, managing message templates.
- `eventBus`: An instance of the EventBus class, handling event subscriptions and notifications.

**`Example`**

```typescript
const myConfig = Configuration.getSetConfig();
console.log(myConfig.namespace); // Output: Namespace instance
console.log(myConfig.redis); // Output: Redis instance
console.log(myConfig.logger); // Output: Logger instance
console.log(myConfig.messages); // Output: Messages instance
console.log(myConfig.eventBus); // Output: EventBus instance
```

___

### getSetConfig

▸ **getSetConfig**(`config?`): [`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

A static method that returns the singleton instance of the Configuration class.
If an instance does not exist, it creates a new one using the provided configuration.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md) | An optional configuration object for the RedisSMQ. If not provided, an empty object is used. |

#### Returns

[`IRedisSMQConfigRequired`](../interfaces/IRedisSMQConfigRequired.md)

The singleton instance of the Configuration class,
containing the required configuration properties.

**`Example`**

```typescript
const config = {
  namespace: 'myNamespace',
  redis: {
    host: 'localhost',
    port: 6379,
  },
};

const myConfig = Configuration.getSetConfig(config);
console.log(myConfig); // Output: { namespace: 'myNamespace', redis: { host: 'localhost', port: 6379 }, ... }
```

___

### reset

▸ **reset**(): `void`

Resets the singleton instance of the Configuration class.
This method is used to clear the current configuration and allow for a new instance to be created.

#### Returns

`void`

**`Remarks`**

This method is useful when testing or when changing the configuration settings dynamically.
After calling this method, the next time `getSetConfig` is called, a new instance of the Configuration class will be created.

**`Example`**

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
