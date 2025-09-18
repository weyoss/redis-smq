[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

RedisSMQ offers multiple ways to configure your message queue system, from simple setup to advanced Redis-persistent
configurations. This guide covers all configuration approaches, from the simplified API to advanced configuration
management.

## Quick Start with Simplified API (Recommended)

The easiest way to get started is using the simplified `RedisSMQ` API that handles configuration globally:

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize once with Redis connection details
RedisSMQ.initialize(
  'my-app',
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
      return;
    }

    // Now create producers and consumers without Redis config repetition
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();

    producer.run(() => console.log('Producer ready'));
    consumer.run(() => console.log('Consumer ready'));
  },
);
```

## Advanced Configuration with Redis Storage

RedisSMQ supports storing configuration in Redis for persistence and sharing across application instances:

### Loading Configuration from Redis

```typescript
import { Configuration } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Load configuration directly from Redis
Configuration.loadFromRedis(
  'my-app',
  {
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379 },
    },
  },
  (err, configInstance) => {
    if (err) {
      console.error('Failed to load config from Redis:', err);
    } else {
      console.log('Configuration loaded from Redis');
      const config = configInstance.getConfig();
    }
  },
);
```

### Saving Configuration to Redis

```typescript
// Create configuration and save to Redis
const config = Configuration.getSetConfig({
  namespace: 'my-app',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  logger: { enabled: true },
  messages: { store: true },
});

Configuration.saveCurrentToRedis((err) => {
  if (!err) {
    console.log('Configuration saved to Redis');
  }
});
```

## Configuration API Reference

For more detailed information, please refer to the [Configuration Class](api/classes/Configuration.md).

## Configuration parameters

Here’s an example of a complete RedisSMQ configuration:

```typescript
import { IRedisSMQConfig } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

const config: IRedisSMQConfig = {
  namespace: 'my_project_name',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000, // 1 hour
    },
  },
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.INFO,
      //...
    },
  },
  messages: {
    store: false, // Set to true to enable message storage
  },
  eventBus: {
    enabled: false, // Set to true to enable the event bus
  },
};
```

### Message Storage Configuration

RedisSMQ supports flexible message storage configuration for acknowledged and dead-lettered messages:

#### Simple Boolean Configuration

```typescript
const config: IRedisSMQConfig = {
  // ... other config
  messages: {
    store: true, // Enables storage for all message types with default settings
  },
};
```

#### Advanced Storage Configuration

```typescript
const config: IRedisSMQConfig = {
  // ... other config
  messages: {
    store: {
      acknowledged: {
        queueSize: 1000, // Maximum number of messages to store
        expire: 3600, // Message expiration time in seconds (1 hour)
      },
      deadLettered: {
        queueSize: 500, // Store up to 500 dead-lettered messages
        expire: 86400, // Keep for 24 hours
      },
    },
  },
};
```

#### Mixed Storage Configuration

```typescript
const config: IRedisSMQConfig = {
  // ... other config
  messages: {
    store: {
      acknowledged: true, // Enable with default settings
      deadLettered: {
        queueSize: 100,
        expire: 7200, // 2 hours
      },
    },
  },
};
```

#### Selective Storage Configuration

```typescript
const config: IRedisSMQConfig = {
  // ... other config
  messages: {
    store: {
      acknowledged: false, // Disable acknowledged message storage
      deadLettered: {
        // Enable only dead-lettered message storage
        queueSize: 200,
        expire: 604800, // 7 days
      },
    },
  },
};
```

### Configuration Management Methods

The Configuration class provides several methods for managing configuration:

#### Updating Configuration

```typescript
const config = Configuration.getInstance();

// Update specific configuration parts
config.updateConfig(
  {
    logger: { enabled: false },
    messages: {
      store: {
        acknowledged: { queueSize: 2000 },
      },
    },
  },
  (err) => {
    if (!err) console.log('Configuration updated and saved to Redis');
  },
);
```

#### Checking Configuration Existence

```typescript
const config = Configuration.getInstance();

config.exists((err, exists) => {
  if (exists) {
    console.log('Configuration exists in Redis');
  } else {
    console.log('No configuration found in Redis');
  }
});
```

#### Resetting Configuration

```typescript
const config = Configuration.getInstance();

config.reset((err) => {
  if (!err) {
    console.log('Configuration removed from Redis');
  }
});
```

### Configuration Best Practices

1. **Use the Simplified API**: For most applications, `RedisSMQ.initialize()` provides the best developer experience.

2. **Redis Storage for Persistence**: Store configuration in Redis for applications that need to share configuration
   across multiple instances.

3. **NamespaceManager Isolation**: Use different namespaces for different applications/environments.

4. **Message Storage Planning**: Configure message storage based on your debugging and monitoring needs:
   - Enable for development/staging environments
   - Configure appropriate retention policies for production
   - Consider storage costs for high-volume applications

For an in-depth understanding of configuration options,
see [IRedisSMQConfig Interface](api/interfaces/IRedisSMQConfig.md).
