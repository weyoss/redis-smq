/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EExchangeType,
  type IExchangeStrategy,
} from '../../../contracts/index.js';
import { DirectStrategy } from './direct-strategy.js';
import { TopicStrategy } from './topic-strategy.js';
import { FanoutStrategy } from './fanout-strategy.js';

/**
 * Maps each exchange type to its strategy implementation.
 *
 * The registry exists because the exchange manager dispatches on a
 * runtime `EExchangeType` value: a caller who carries the type as a
 * parameter, a field on a config object, or an enum read from Redis
 * cannot use the concrete facades (`ExchangeDirect`, `ExchangeTopic`,
 * `ExchangeFanout`) without a switch statement that repeats the same
 * operation three times. The manager takes the type once and looks up
 * the strategy here.
 */

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

/**
 * Every exchange type mapped to its strategy singleton.
 *
 * Populated eagerly at module load. The three constructors take no
 * arguments and perform no I/O, so the eager construction cost is a
 * few microseconds — cheaper than the runtime check a lazy
 * initializer would require on every `getStrategy` call.
 *
 * The `Record` annotation enforces exhaustiveness at compile time; the
 * `Object.freeze` enforces it at runtime. See the file header for why
 * both matter.
 */
const strategies: Readonly<Record<EExchangeType, IExchangeStrategy>> =
  Object.freeze({
    [EExchangeType.DIRECT]: new DirectStrategy(),
    [EExchangeType.TOPIC]: new TopicStrategy(),
    [EExchangeType.FANOUT]: new FanoutStrategy(),
  });

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The strategy for the given exchange type.
 *
 * The lookup is a property access on a frozen object — the fastest
 * possible dispatch. The `!s` guard is defensive: `EExchangeType` is
 * a numeric enum, so a caller passing an untyped number (a value read
 * from Redis that was not validated, or a value produced by a
 * `Number(...)` cast) could produce a key that is not in the map. In
 * that case the code has gone wrong somewhere upstream, and the guard
 * reports it with a message that names the offending value so the
 * caller can trace where the wrong number came from.
 *
 * A caller who reaches this function with a value from the enum proper
 * will never hit the guard — TypeScript has already narrowed the type
 * to one of the three keys the map contains. The guard is for the
 * cases TypeScript cannot statically verify.
 *
 * The thrown error is a plain `Error`, not one of the framework's
 * named classes. A registry miss is a framework bug, not a caller
 * error — the caller did nothing wrong beyond passing a value that the
 * framework's own code should have validated. Plain `Error` is the
 * right signal: "this cannot happen if the code is correct; investigate
 * the framework, not the caller".
 */
export function getStrategy(type: EExchangeType): IExchangeStrategy {
  const strategy = strategies[type];
  if (!strategy) {
    throw new Error(
      `No exchange strategy registered for type ${String(type)}. ` +
        `This is a framework bug — every EExchangeType value must ` +
        `have a strategy registered in strategies/registry.ts.`,
    );
  }
  return strategy;
}
