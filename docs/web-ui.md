# Web UI

![RedisSMQ Monitor Home](https://raw.githubusercontent.com/weyoss/redis-smq-monitor/master/screenshots/screenshot-00002.png)

[RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor) Web UI is an interface which lets you monitor, debug, and manage your RedisSMQ server from a web browser in
real-time.

## Configuration

```javascript
'use strict';

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

- `monitor.basePath` *(String): Optional.* Let the Web UI know that it is running behind a reverse proxy server and use a base path (for example `/monitor`) to render links and redirects correctly. See [Running the Web UI behind a reverse proxy](docs/web-ui.md#running-the-web-ui-behind-a-reverse-proxy). 

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

### Running the Web UI behind a reverse proxy

To run the Web UI behind a reverse proxy server you need first to configure correctly your server.

Depending on your setup, some extra steps may be required. The easiest way to start with is to serve the Web UI using a transparent proxy.

I am using Nginx as a proxy server, but you can use any other server depending on your preferences.

#### Transparent reverse proxy

Sample Nginx configuration:

```text
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
upstream redis-smq {
    server 127.0.0.1:3000;
}
server {
    listen       5000;
    listen  [::]:5000;
    location / {
        proxy_pass http://redis-smq;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

No additional configuration is required.

#### Reverse proxy with URL rewrite

Sample Nginx configuration:

```text
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
upstream redis-smq {
    server 127.0.0.1:3000;
}
server {
    listen       5000;
    listen  [::]:5000;
    location /monitor {
        proxy_pass http://redis-smq;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        rewrite  ^/monitor/(.*)  /$1 break;
    }
}
```

Additionally, you need to configure the Web UI.

Sample RedisSMQ configuration:

```javascript
'use strict';

module.exports = {
    monitor: {
        enabled: true,
        host: '127.0.0.1',
        port: 3000,
        basePath: '/monitor' // <-- using the base path
    },
};
```

