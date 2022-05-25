const config = require('./config');
const { setLogger, QueueManager } = require('../../..'); // require('redis-smq')

// Setting up a custom logger
// This step should be also done from your application bootstrap
setLogger(console);

exports.init = function init(cb) {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  QueueManager.createInstance(config, (err, queueManager) => {
    if (err) throw err;
    else if (!queueManager)
      throw new Error('Expected an instance of QueueManager');
    else
      queueManager.queue.create('test_queue', false, (err) => {
        if (err) cb(err);
        else queueManager.quit(cb);
      });
  });
};
