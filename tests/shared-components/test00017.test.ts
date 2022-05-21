import { promisifyAll } from 'bluebird';
import { MessageManager } from '../..';

test('MessageManager: getSingletonInstance()/quit()', async () => {
  const m = await promisifyAll(MessageManager);
  const instance = promisifyAll(await m.getSingletonInstanceAsync());
  await instance.quitAsync();
});
