# Logs

This package is using JSON log format, thanks to [Bunyan](https://github.com/trentm/node-bunyan).

The structured data format of JSON allows analytics tools to take place but also helps to monitor and troubleshoot
issues easier and faster.

By default all logs are disabled. Logging can affect performance (due to I/O operations). When enabled you can
use bunyan utility to pretty format the output.

Unless configured otherwise, the standard output is the console which launched the consumer.

```text
$ node consumer | ./node_modules/.bin/bunyan
```

## Configuration


```javascript
'use strict';

const path = require('path');

module.exports = {
    log: {
        enabled: 0,
        options: {
            level: 'trace',
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

- `log` (Object): Optional. Configuration placeholder object for logging parameters.

- `log.enabled` *(Integer/Boolean): Optional.* Enable/disable logging. By default logging is disabled.

- `log.options` *(Object): Optional.* All valid Bunyan configuration options are accepted. Please look at the
  [Bunyan Repository](https://github.com/trentm/node-bunyan) for more details.