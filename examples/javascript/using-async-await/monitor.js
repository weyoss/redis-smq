const { MonitorServer, setConfiguration, setLogger } = require('../../..'); // require('redis-smq');
const config = require('./config');

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

setLogger(console);

const server = new MonitorServer();
server.listen().catch((err) => console.log(err));

// Shutting down the server after 10s
// setTimeout(() => server.quit(), 10000);
