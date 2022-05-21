import { promisifyAll } from 'bluebird';
import { MessageManager } from '../../src/lib/message-manager/message-manager';

test('MessageManager: getSingletonInstance()/quit()', async () => {
  const m = await promisifyAll(MessageManager);
  const instance = promisifyAll(await m.getSingletonInstanceAsync());
  await instance.quitAsync();
});
