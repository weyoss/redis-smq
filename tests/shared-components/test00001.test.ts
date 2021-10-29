import { events } from '../../src/system/events';
import { Ticker } from '../../src/system/ticker';
import { delay } from 'bluebird';

describe('Ticker', () => {
  test('Case 1', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 1000);
    ticker.nextTick();

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));

    await delay(2000);
    expect(down).toBe(0);
    expect(changedFromTicker).toBe(1);
  });

  test('Case 2', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 0);

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));
    ticker.quit();

    await delay(1000);
    expect(down).toBe(1);
    expect(changedFromTicker).toBe(0);
  });

  test('Case 3', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 10000);
    ticker.nextTick();

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));
    ticker.quit();

    await delay(1000);
    expect(down).toBe(1);
    expect(changedFromTicker).toBe(0);
  });

  test('Case 4', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 3000);
    ticker.nextTick();

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));
    ticker.quit();

    await delay(5000);
    expect(down).toBe(1);
    expect(changedFromTicker).toBe(0);
  });

  test('Case 5', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 3000);
    ticker.runTimer();

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));
    ticker.quit();

    await delay(1000);
    expect(down).toBe(1);
    expect(changedFromTicker).toBe(0);
  });

  test('Case 6', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 3000);
    ticker.runTimer();

    let down = 0;
    ticker.once(events.DOWN, () => (down += 1));
    ticker.quit();

    await delay(5000);
    expect(down).toBe(1);
    expect(changedFromTicker).toBe(0);
  });

  test('Case 7', async () => {
    let changedFromTicker = 0;
    const ticker = new Ticker(() => (changedFromTicker += 1), 3000);
    ticker.runTimer();

    expect(() => ticker.runTimer()).toThrow('A timer is already running');
    expect(() => ticker.nextTick()).toThrow('A timer is already running');
    ticker.quit();
  });
});
