import { promisifyAll } from 'bluebird';
import { MessageManager } from '../../../src/lib/message-manager/message-manager';
import { config } from '../../common/config';

test('MessageManager: createInstance()/quit()', async () => {
  const m = await promisifyAll(MessageManager);
  const instance = promisifyAll(await m.createInstanceAsync(config));
  await instance.quitAsync();
});
