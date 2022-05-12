const config = require('./config');
const { setLogger, setConfiguration, QueueManager } = require('../../..'); // require('redis-smq')
const { promisifyAll } = require('bluebird');

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

// Setting up a custom logger
// This step should be also done from your application bootstrap
setLogger(console);

const QueueManagerAsync = promisifyAll(QueueManager);

exports.init = async function init() {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  // We are going to create all the queues needed for this example using the QueueManager
  const queueManager = promisifyAll(
    await QueueManagerAsync.getSingletonInstanceAsync(),
  );

  const queueAsync = promisifyAll(queueManager.queue);

  // Creating a normal queue (a LIFO queue)
  await queueAsync.createAsync('test_queue', false);

  // Creating a priority queue
  await queueAsync.createAsync('another_queue', true);
};
