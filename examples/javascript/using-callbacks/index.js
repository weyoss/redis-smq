const { init } = require('./setup');
const { produce } = require('./producer');
const { consume } = require('./consumer');

// To simplify the example, we are ignoring errors from callbacks
init(() => produce(() => consume(() => void 0)));
