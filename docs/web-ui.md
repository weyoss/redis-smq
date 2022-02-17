# Web UI

![RedisSMQ Monitor Home](https://raw.githubusercontent.com/weyoss/redis-smq-monitor/master/screenshots/screenshot-00002.png)

[RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor) Web UI is an interface which lets you monitor, debug, and manage your RedisSMQ server from a web browser in
real-time.

## Configuration

```javascript
'use strict';

const path = require('path');

module.exports = {
    monitor: {
        enabled: true,
        host: '127.0.0.1',
        port: 3000,
        socketOpts: {
            // ...
        }
    },
};
```

**Parameters**

- `monitor` *(Object): Optional.* RedisSMQ monitor parameters.

- `monitor.enabled` *(Boolean/Integer): Optional.* Enable/Disable the monitor. By default, disabled.

- `monitor.host` *(String): Optional.* IP address of the monitor server. By default, `0.0.0.0`.

- `monitor.port` *(Integer): Optional.* Port of the monitor server. By default, `7210`.

- `monitor.socketOpts` *(Object): Optional.* WebSocket parameters for `socket.io`. See [https://socket.io/docs/v4/server-api/#new-serverport-options](https://socket.io/docs/v4/server-api/#new-serverport-options) for more details.

## Usage 

The Web UI can be launched and used as shown in the example bellow:

```javascript
// filename: ./examples/javascript/monitor.js
'use strict';
const config = require('./config');
const { MonitorServer, setLogger, setConfiguration } = require('../..'); // require('redis-smq');

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);
setLogger(console);

const server = new MonitorServer();
server.listen();

// Shutting down the server after 10s
setTimeout(() => server.quit(), 10000);
```

When running the example above, the expected output should be:

```text
[MonitorServer] Going up...
[MonitorServer] Up and running on 127.0.0.1:3000...
[MonitorServer] Going down...
[MonitorServer] Down.
```