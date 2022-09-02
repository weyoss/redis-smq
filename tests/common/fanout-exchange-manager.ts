import { FanOutExchangeManager } from '../../src/lib/exchange/fan-out-exchange-manager';
import { requiredConfig } from './config';
import { promisifyAll } from 'bluebird';

let instances: FanOutExchangeManager[] = [];

export async function getFanOutExchangeManager(cfg = requiredConfig) {
  const m = promisifyAll(FanOutExchangeManager);
  const i = promisifyAll(await m.createInstanceAsync(cfg));
  instances.push(i);
  return i;
}

export async function shutDownFanOutExchangeManager() {
  for (const i of instances) {
    await new Promise((resolve) => {
      i.quit(resolve);
    });
  }
  instances = [];
}
