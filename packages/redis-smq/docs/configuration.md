[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

RedisSMQ must be initialized once per process before creating any producers, consumers, or managers.

Required initialization options:
- RedisSMQ.initialize(redisConfig, cb)
- RedisSMQ.initializeWithConfig(redisSMQConfig, cb)

After global initialization, using the Configuration class is optional. You can read or update the persisted configuration if needed, but you do not need to call Configuration.initialize directly; it is handled internally by RedisSMQ.initialize or RedisSMQ.initializeWithConfig.

This guide covers:
- Global initialization (required)
- Optional configuration persistence and management
- Example configuration shapes and best practices

## Global Initialization (required)

Initialize RedisSMQ once at startup.

### Option A: Initialize with Redis connection (recommended for most)

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize once with Redis connection details
RedisSMQ.initialize(
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

    // Now create producers and consumers without repeating Redis config
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();

    producer.run((e) => {
      if (e) return console.error('Producer start failed:', e);
      console.log('Producer ready');
    });

    consumer.run((e) => {
      if (e) return console.error('Consumer start failed:', e);
      console.log('Consumer ready');
    });
  },
);
```

### Option B: Initialize with full RedisSMQ configuration (persisted in Redis)

Use when you want configuration to be persisted and shared across processes. On first run, the configuration is saved to Redis. Subsequent processes can simply call RedisSMQ.initialize(...) or initializeWithConfig(...) to reuse it.

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

RedisSMQ.initializeWithConfig(
  {
    namespace: 'my_project_name',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
    logger: {
      enabled: true,
      options: {
        logLevel: EConsoleLoggerLevel.INFO,
      },
    },
    messages: {
      store: false,
    },
    eventBus: {
      enabled: false,
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize with config:', err);
      return;
    }
    console.log('RedisSMQ initialized (configuration persisted in Redis)');
  },
);
```

Note
- Do not call Configuration.initialize in application code. RedisSMQ.initialize or RedisSMQ.initializeWithConfig will load or persist configuration and prepare the singleton for you.

## Optional: Inspecting and Managing Configuration

After RedisSMQ has been initialized, you may read or update the configuration via the Configuration class.

### Read current configuration

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize({ /* redis config */ } as any, (err) => {
  if (err) return console.error('Init failed:', err);

  const cfg = Configuration.getConfig(); // parsed, validated config
  console.log('Namespace:', cfg.namespace);
  console.log('Redis host:', cfg.redis.options.host);
  console.log('EventBus enabled:', cfg.eventBus.enabled);
});
```

### Update selected fields and persist

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize({ /* redis config */ } as any, (err) => {
  if (err) return console.error('Init failed:', err);

  const manager = Configuration.getInstance();
  manager.updateConfig(
    {
      logger: { enabled: true },
      messages: {
        store: {
          acknowledged: { queueSize: 2000 },
        },
      },
    },
    (updateErr) => {
      if (updateErr) return console.error('Update failed:', updateErr);
      console.log('Configuration updated and saved to Redis');
    },
  );
});
```

### Save a new configuration object

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize({ /* redis config */ } as any, (err) => {
  if (err) return console.error('Init failed:', err);

  const manager = Configuration.getInstance();
  manager.save(
    {
      logger: { enabled: false },
    },
    (saveErr) => {
      if (saveErr) return console.error('Save failed:', saveErr);
      console.log('Configuration saved to Redis');
    },
  );
});
```

### Check if configuration exists in Redis

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize({ /* redis config */ } as any, (err) => {
  if (err) return console.error('Init failed:', err);

  const manager = Configuration.getInstance();
  manager.exists((existsErr, exists) => {
    if (existsErr) return console.error('Exists check failed:', existsErr);
    console.log(exists ? 'Configuration exists in Redis' : 'No configuration found in Redis');
  });
});
```

### Reset to defaults and persist

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize({ /* redis config */ } as any, (err) => {
  if (err) return console.error('Init failed:', err);

  const manager = Configuration.getInstance();
  manager.reset((resetErr) => {
    if (resetErr) return console.error('Reset failed:', resetErr);
    console.log('Configuration reset to defaults and persisted to Redis');
  });
});
```

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
      // ...
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

RedisSMQ supports flexible message storage configuration for acknowledged and dead-lettered messages.

- Simple boolean

```typescript
import { IRedisSMQConfig } from 'redis-smq';

const config: IRedisSMQConfig = {
  // ... other config
  messages: {
    store: true, // Enables storage for all message types with default settings
  },
};
```

- Advanced storage

```typescript
import { IRedisSMQConfig } from 'redis-smq';

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

- Mixed storage

```typescript
import { IRedisSMQConfig } from 'redis-smq';

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

- Selective storage

```typescript
import { IRedisSMQConfig } from 'redis-smq';

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

## Configuration Best Practices

1. Initialize once per process using RedisSMQ.initialize(...) or RedisSMQ.initializeWithConfig(...). This is required.
2. Use Redis-backed configuration (initializeWithConfig) when:
    - Multiple processes must share the same settings
    - You want configuration to persist across restarts
3. Use clear, environment-specific namespaces to avoid collisions (e.g., my_app_dev, my_app_staging, my_app_prod).
4. Plan message storage carefully:
    - Enable in development/staging when you need visibility
    - Set retention and queue sizes appropriate for production load
5. Treat the object returned by Configuration.getConfig() as read-only. Use updateConfig or save to persist changes safely.

For detailed API, see:
- Configuration class: [API Reference](api/classes/Configuration.md)
- IRedisSMQConfig: [Interface](api/interfaces/IRedisSMQConfig.md)
