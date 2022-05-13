const { Consumer } = require('../../..'); // require('redis-smq')

const consumer = new Consumer();

exports.consume = function consume(cb) {
  // starting the consumer and then registering a message handler
  consumer.run((err) => {
    if (err) cb(err);
    else
      consumer.consume(
        // Using the default namespace from the config
        // Same as { name: 'test_queue', ns: 'ns1' })
        'test_queue',
        (message, cb) => {
          /* eslint class-methods-use-this: 0 */
          //  console.log(`Got message to consume: `, JSON.stringify(message));
          //  throw new Error('TEST!');
          //  cb(new Error('TEST!'));
          //  const timeout = parseInt(Math.random() * 100);
          //  setTimeout(() => {
          //      cb();
          //  }, timeout);
          cb();
        },
        (err, isRunning) => {
          if (err) console.log(err);
          else {
            console.log(`Is running? ${isRunning}`); // true
            cb();
          }
        },
      );
  });

  // OR
  //
  // registering the message handler and then starting the consumer
  // consumer.consume(
  //   'test_queue',
  //   (message, cb) => cb(),
  //   (err, isRunning) => {
  //     if (err) console.log(err);
  //     else {
  //       console.log(`Is running? ${isRunning}`); // false
  //       consumer.run(cb);
  //     }
  //   },
  // );
};
