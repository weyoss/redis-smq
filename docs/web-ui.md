# Web UI

![RedisSMQ Monitor Home](https://raw.githubusercontent.com/weyoss/redis-smq-monitor/master/screenshots/screenshot-00001.png)

![RedisSMQ Monitor Acknowledged messages](https://raw.githubusercontent.com/weyoss/redis-smq-monitor/master/screenshots/screenshot-00004.png)

[RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor) Web UI is an interface which let you monitor, debug, and manage your RedisSMQ server from a web browser in
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

`RedisSMQ Monitor` can be launched and used as shown in the example bellow:

```javascript
// filename: ./examples/javascript/monitor.js
'use strict';

const config = require('./config');
const { MonitorServer } = require('redis-smq');

MonitorServer(config).listen().then(() => {
    console.log('The server is up and running...')
});
```