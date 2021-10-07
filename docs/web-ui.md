# Web UI

> ☝️ **Important Note**: The Web UI is stable but many management features are missing. Currently, it is still a work in progress with frequent, maybe breaking, API changes. 

The RedisSMQ Monitor is an interface which let you monitor, debug, and manage your RedisSMQ server from a web browser in
real-time.

Starting with v1.1.0, the frontend part of the RedisSMQ Monitor has split up into a standalone project and
is packaged under [RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor)

Being an integral part of the MQ, the monitor can be launched and used by starting first the monitor server as shown
in the example bellow:

```javascript
// filename: ./examples/javascript/monitor.js
'use strict';

const config = require('./config');
const { MonitorServer } = require('redis-smq');

MonitorServer(config).listen(() => {
    console.log('It works!');
});
```

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