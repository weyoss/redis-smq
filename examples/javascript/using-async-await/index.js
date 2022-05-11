const { init } = require('./setup');
const { produce } = require('./producer');
const { consume } = require('./consumer');

async function main() {
  await init();
  await produce();
  await consume();
}

main().catch((err) => console.log(err));
