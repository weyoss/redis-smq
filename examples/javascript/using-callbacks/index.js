const { init } = require('./setup');
const { produce } = require('./producer');
const { consume } = require('./consumer');

// For simplicity, we are using nested callbacks
init((err) => {
  if (err) throw err;
  produce((err) => {
    if (err) throw err;
    consume((err) => {
      if (err) throw err;
    });
  });
});
