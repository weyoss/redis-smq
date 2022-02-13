import { promisifyAll } from 'bluebird';
import { MessageManager } from '../../src/message-manager';

test('MessageManager: getSingletonInstance()/quit()', async () => {
  const m = await promisifyAll(MessageManager);
  const instance = promisifyAll(await m.getSingletonInstanceAsync());
  await instance.quitAsync();
});
