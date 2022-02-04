# Logs

> By default, logging is disabled. Logging can affect message processing performance (due to I/O operations). To enable logging, set `logger.enabled` to true in your configuration object. 

## Built-in RedisSMQ logger

RedisSMQ comes with a built-in JSON logger using [Bunyan](https://github.com/trentm/node-bunyan).

You can make use of the built-in RedisSMQ logger by enabled it and also setting up its configuration parameters. 

When the built-in logger is used, you can make use of the bunyan utility to pretty format the output:

```text
$ node consumer | ./node_modules/.bin/bunyan
```

### Configuration

```javascript
'use strict';

const path = require('path');

module.exports = {
    logger: {
        enabled: false,
        options: {
            level: 'info',
            /*
            streams: [
                {
                    path: path.normalize(`${__dirname}/../logs/redis-smq.log`)
                },
            ],
            */
        },
    },
};
```

**Parameters**

- `logger` *(object): Optional.* Configuration placeholder object for logging parameters.

- `logger.enabled` *(boolean): Optional.* Enable/disable logging. By default logging is disabled.

- `logger.options` *(object): Optional.* All valid Bunyan configuration options are accepted. See [Bunyan repository](https://github.com/trentm/node-bunyan) for more details.

## Setting up a custom logger

You can tell RedisSMQ to use your own logger instance by registering it using `setLogger()` method.

Any Node.js logging package, such as Winston, can be used. The logger instance is required to have the following methods:

```javascript
info(message, ...optionalParams);
warn(message, ...optionalParams);
error(message, ...optionalParams);
debug(message, ...optionalParams);
```

A winston logger instance, for example, can be registered as shown bellow:

```javascript
const { setLogger, setConfiguration } = require('redis-smq');
const winston = require('winston');

setConfiguration({
  logger: {
    enabled: true, // Do not forget to enable logging
  }
});


const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

setLogger(logger);
```
## Example log file

```text
[2022-01-27T14:04:29.199Z]  INFO: redis-smq/165159 on leno: [MonitorServer] Going up...
[2022-01-27T14:04:29.328Z]  INFO: redis-smq/165159 on leno: [MonitorServer] Up and running on 127.0.0.1:3000...
[2022-01-27T14:04:29.331Z]  INFO: redis-smq/165159 on leno: [Producer/97b68c1f-8c31-4fe6-8606-7a28cb3f8435] Going up...
[2022-01-27T14:04:29.331Z]  INFO: redis-smq/165159 on leno: [Producer/97b68c1f-8c31-4fe6-8606-7a28cb3f8435] Up and running...
[2022-01-27T14:04:29.360Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Message handler with parameters ({"queue":{"name":"test_queue","ns":"testing"},"usePriorityQueuing":false}) has been registered.
[2022-01-27T14:04:29.435Z]  INFO: redis-smq/165159 on leno: [Producer/97b68c1f-8c31-4fe6-8606-7a28cb3f8435] Message (ID 63326dab-20a2-46f7-b196-8163380d9b71) has been enqueued.
[2022-01-27T14:04:29.436Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Going up...
[2022-01-27T14:04:29.437Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Up and running...
[2022-01-27T14:04:30.538Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Created a new instance (ID: 4f8bae2f-27a1-4953-9131-ba1fe216ade0) for MessageHandler ({"queue":{"name":"test_queue","ns":"testing"},"usePriorityQueuing":false}).
[2022-01-27T14:04:30.546Z]  INFO: redis-smq/165159 on leno: [MessageHandler/4f8bae2f-27a1-4953-9131-ba1fe216ade0] Up and running...
[2022-01-27T14:04:30.549Z]  INFO: redis-smq/165159 on leno: [MessageHandler/4f8bae2f-27a1-4953-9131-ba1fe216ade0] Consuming message (ID 63326dab-20a2-46f7-b196-8163380d9b71) with properties ({"queue":{"name":"test_queue","ns":"testing"},"ttl":0,"retryThreshold":3,"retryDelay":0,"consumeTimeout":0,"body":{"hello":"world"},"priority":null,"scheduledCron":null,"scheduledDelay":null,"scheduledRepeatPeriod":null,"scheduledRepeat":0,"publishedAt":1643292269426,"scheduledAt":null,"scheduledCronFired":false,"attempts":0,"scheduledRepeatCount":0,"delayed":false,"expired":false,"createdAt":1643292269362,"uuid":"63326dab-20a2-46f7-b196-8163380d9b71"})
[2022-01-27T14:04:30.551Z]  INFO: redis-smq/165159 on leno: [MessageHandler/4f8bae2f-27a1-4953-9131-ba1fe216ade0] Message (ID 63326dab-20a2-46f7-b196-8163380d9b71) acknowledged
[2022-01-27T14:04:30.580Z]  INFO: redis-smq/165159 on leno: [MessageManager] Acknowledged message (ID 63326dab-20a2-46f7-b196-8163380d9b71) has been deleted
[2022-01-27T14:04:30.590Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Going down...
[2022-01-27T14:04:30.590Z]  INFO: redis-smq/165159 on leno: [Consumer/eec6061a-b60f-4bb7-a5f9-066d4b5022cf] Down.
[2022-01-27T14:04:30.647Z]  INFO: redis-smq/165159 on leno: [MessageHandler/4f8bae2f-27a1-4953-9131-ba1fe216ade0] Down.
[2022-01-27T14:04:30.652Z]  INFO: redis-smq/165159 on leno: [Producer/97b68c1f-8c31-4fe6-8606-7a28cb3f8435] Going down...
[2022-01-27T14:04:30.652Z]  INFO: redis-smq/165159 on leno: [Producer/97b68c1f-8c31-4fe6-8606-7a28cb3f8435] Down.
[2022-01-27T14:04:30.654Z]  INFO: redis-smq/165159 on leno: [MonitorServer] Going down...
[2022-01-27T14:04:30.675Z]  INFO: redis-smq/165159 on leno: [MonitorServer] Down.

```

