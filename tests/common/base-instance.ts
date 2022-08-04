import { events } from '../../src/common/events/events';
import { Base } from '../../src/lib/base';

export async function shutDownBaseInstance(i: Base): Promise<void> {
  if (i.isGoingUp()) {
    await new Promise((resolve) => {
      i.once(events.UP, resolve);
    });
  }
  if (i.isRunning()) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      i.shutdown(resolve);
    });
  }
}
