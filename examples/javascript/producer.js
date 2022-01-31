'use strict';
const config = require('./config');
const { Producer, Message, setConfiguration } = require('../..'); // require('redis-smq');

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

const producer = new Producer();

const msg = new Message()
  .setScheduledCRON('*/20 * * * * *')
  .setBody({ hello: 'World!' })
  .setQueue('test_queue');

producer.produce(msg, (err) => {
  if (err) throw err;
  else console.log(`Successfully published`);
});
