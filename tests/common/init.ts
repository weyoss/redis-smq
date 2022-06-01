import { Message } from '../../src/lib/message/message';

export async function init() {
  Message.setDefaultConsumeOptions({ retryDelay: 0 });
}
