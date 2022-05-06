import { init } from './setup';
import { produce } from './producer';
import { consume } from './consumer';

async function main(): Promise<void> {
  await init();
  await produce();
  await consume();
}

main().catch((err) => console.log(err));
