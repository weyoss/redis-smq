/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
  ILogger,
  IRedisClient,
} from 'redis-smq-common';
import { Configuration } from '../config-manager/configuration.js';
import { withShared } from '../common/redis/connection-pool/with-shared.js';
import { keys } from '../common/redis/keys/keys.js';
import { validateRedisKey } from '../common/redis/keys/validator.js';
import {
  ExchangeNotFoundError,
  ExchangeTypeMismatchError,
  InvalidExchangeRoutingKeyError,
  InvalidFanoutExchangeParametersError,
  InvalidNamespaceError,
  NamespaceMismatchError,
} from '../errors/index.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import {
  _getExchangeParams,
  _parseExchangeParams,
} from './_/_parse-exchange-params.js';
import { _saveExchange } from './_/_save-exchange.js';
import { _getExchangeProperties } from './_/_get-exchange-properties.js';
import { _getRoutingKeys } from './_/_get-routing-keys.js';
import { _getRoutingPatterns } from './_/_get-routing-patterns.js';
import { _getBoundQueues } from './_/_get-bound-queues.js';
import { _getRoutingKeyBoundQueues } from './_/_get-routing-key-bound-queues.js';
import { _getRoutingPatternBoundQueues } from './_/_get-routing-pattern-bound-queues.js';
import { getStrategy } from './strategies/registry.js';
import { _bindQueue } from './_/_bind-queue.js';
import { _unbindQueue } from './_/_unbind-queue.js';
import { _deleteExchange } from './_/_delete-exchange.js';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  type IExchangeManager,
  type IExchangeParams,
  type IExchangeParsedParams,
  type IExchangeProperties,
  type IQueueParams,
  type TExchangeBindings,
} from '../../contracts/index.js';

/**
 * Unified manager for exchange operations across all three exchange
 * types.
 *
 * The exchange's type is a property of the exchange, not of the call.
 * Only `create` takes a type — the operation that establishes it.
 * Every other operation reads the stored type from Redis and
 * dispatches to the appropriate strategy. Callers who know the type at
 * compile time use the three facades (`ExchangeDirect`,
 * `ExchangeTopic`, `ExchangeFanout`); callers who carry the type as a
 * runtime value use this manager.
 *
 * Stateless between calls: every method acquires a pooled Redis client
 * via `withShared` and releases it before returning. The instance
 * holds only a logger.
 *
 * @example
 * const mgr = new ExchangeManager();
 * await mgr.create('events', EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD);
 * await mgr.bindQueue('orders', 'events', 'order.created');
 * const queues = await mgr.matchQueues('events', 'order.created');
 *
 * @implements {IExchangeManager}
 */
export class ExchangeManager implements IExchangeManager {
  protected readonly logger: ILogger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    this.logger.debug('instance initialized');
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /** @inheritdoc */
  create(
    exchange: string | IExchangeParams,
    type: EExchangeType,
    queuePolicy: EExchangeQueuePolicy,
  ): Promise<void>;
  /** @inheritdoc */
  create(
    exchange: string | IExchangeParams,
    type: EExchangeType,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ): void;
  create(
    exchange: string | IExchangeParams,
    type: EExchangeType,
    queuePolicy: EExchangeQueuePolicy,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(exchange, type);
      if (exchangeParams instanceof Error) {
        this.logger.error('create: invalid exchange params');
        return callback(exchangeParams);
      }
      withShared(
        (client, done) =>
          _saveExchange(client, exchangeParams, queuePolicy, done),
        callback,
      );
    });
  }

  /** @inheritdoc */
  delete(exchange: string | IExchangeParams): Promise<void>;
  /** @inheritdoc */
  delete(exchange: string | IExchangeParams, cb: ICallback): void;
  delete(
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withResolvedExchange(
        exchange,
        (client, parsed, done) =>
          _deleteExchange(client, parsed, this.logger, done),
        callback,
      );
    });
  }

  // =========================================================================
  // Bindings
  // =========================================================================

  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    binding?: string,
  ): Promise<void>;
  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    binding: string,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    bindingOrCb?: string | ICallback,
    cb?: ICallback,
  ): Promise<void> | void {
    const binding = typeof bindingOrCb === 'string' ? bindingOrCb : undefined;
    const callback = typeof bindingOrCb === 'function' ? bindingOrCb : cb;

    return async.withOptionalCallback(callback, (done) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error('bindQueue: invalid queue params');
        return done(queueParams);
      }
      const exchangeParams = _getExchangeParams(exchange);
      if (exchangeParams instanceof Error) {
        this.logger.error('bindQueue: invalid exchange params');
        return done(exchangeParams);
      }
      if (queueParams.ns !== exchangeParams.ns) {
        this.logger.error(
          `bindQueue: namespace mismatch q.ns=${queueParams.ns} ex.ns=${exchangeParams.ns}`,
        );
        return done(new NamespaceMismatchError());
      }

      const normalizedBinding = binding ?? null;

      withShared((client, finish) => {
        _getExchangeProperties(client, exchangeParams, (err, props) => {
          if (err) return finish(err);
          if (!props) return finish(new ExchangeNotFoundError());

          const parsed: IExchangeParsedParams = {
            ns: exchangeParams.ns,
            name: exchangeParams.name,
            type: props.type,
          };

          _bindQueue(
            client,
            queueParams,
            parsed,
            normalizedBinding,
            this.logger,
            finish,
          );
        });
      }, done);
    });
  }

  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    binding?: string,
  ): Promise<void>;
  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    binding: string,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    bindingOrCb?: string | ICallback,
    cb?: ICallback,
  ): Promise<void> | void {
    const binding = typeof bindingOrCb === 'string' ? bindingOrCb : undefined;
    const callback = typeof bindingOrCb === 'function' ? bindingOrCb : cb;

    return async.withOptionalCallback(callback, (done) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error('unbindQueue: invalid queue params');
        return done(queueParams);
      }
      const exchangeParams = _getExchangeParams(exchange);
      if (exchangeParams instanceof Error) {
        this.logger.error('unbindQueue: invalid exchange params');
        return done(exchangeParams);
      }
      if (queueParams.ns !== exchangeParams.ns) {
        this.logger.error(
          `unbindQueue: namespace mismatch q.ns=${queueParams.ns} ex.ns=${exchangeParams.ns}`,
        );
        return done(new NamespaceMismatchError());
      }

      const normalizedBinding = binding ?? null;

      withShared((client, finish) => {
        _getExchangeProperties(client, exchangeParams, (err, props) => {
          if (err) return finish(err);
          if (!props) return finish(new ExchangeNotFoundError());
          const parsed: IExchangeParsedParams = {
            ns: exchangeParams.ns,
            name: exchangeParams.name,
            type: props.type,
          };
          _unbindQueue(
            client,
            queueParams,
            parsed,
            normalizedBinding,
            this.logger,
            finish,
          );
        });
      }, done);
    });
  }

  // =========================================================================
  // Matching and bindings view
  // =========================================================================

  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey?: string,
  ): Promise<IQueueParams[]>;
  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  matchQueues(
    exchange: string | IExchangeParams,
    routingKeyOrCb?: string | ICallback<IQueueParams[]>,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    const routingKey =
      typeof routingKeyOrCb === 'string' ? routingKeyOrCb : undefined;
    const callback = typeof routingKeyOrCb === 'function' ? routingKeyOrCb : cb;

    return async.withOptionalCallback(callback, (done) => {
      const exchangeParams = _getExchangeParams(exchange);
      if (exchangeParams instanceof Error) {
        this.logger.error('matchQueues: invalid exchange params');
        return done(exchangeParams);
      }

      withShared((client, finish) => {
        _getExchangeProperties(client, exchangeParams, (err, props) => {
          if (err) return finish(err);
          if (!props) return finish(new ExchangeNotFoundError());

          const parsed: IExchangeParsedParams = {
            ns: exchangeParams.ns,
            name: exchangeParams.name,
            type: props.type,
          };

          // Arity check against the exchange's *stored* type. A fanout
          // exchange ignores the routing key; a direct or topic
          // exchange requires one.
          if (
            parsed.type === EExchangeType.FANOUT &&
            routingKey !== undefined
          ) {
            this.logger.error(
              'matchQueues: fanout exchanges do not accept a routing key',
            );
            return finish(new InvalidFanoutExchangeParametersError());
          }
          if (
            parsed.type !== EExchangeType.FANOUT &&
            routingKey === undefined
          ) {
            this.logger.error(
              'matchQueues: a routing key is required for this exchange type',
            );
            return finish(
              new InvalidExchangeRoutingKeyError({
                metadata: { exchange: parsed, routingKey: '' },
              }),
            );
          }

          const strategy = getStrategy(parsed.type);
          strategy.matchQueues(client, parsed, routingKey ?? null, finish);
        });
      }, done);
    });
  }

  /** @inheritdoc */
  getBindings(exchange: string | IExchangeParams): Promise<TExchangeBindings>;
  /** @inheritdoc */
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<TExchangeBindings>,
  ): void;
  getBindings(
    exchange: string | IExchangeParams,
    cb?: ICallback<TExchangeBindings>,
  ): Promise<TExchangeBindings> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _getExchangeParams(exchange);
      if (exchangeParams instanceof Error) {
        this.logger.error('getBindings: invalid exchange params');
        return callback(exchangeParams);
      }

      withShared((client, done) => {
        _getExchangeProperties(client, exchangeParams, (err, props) => {
          if (err) return done(err);
          if (!props) return done(new ExchangeNotFoundError());

          const parsed: IExchangeParsedParams = {
            ns: exchangeParams.ns,
            name: exchangeParams.name,
            type: props.type,
          };
          const strategy = getStrategy(parsed.type);
          const bindingsListKey = strategy.getBindingsListKey(
            parsed.ns,
            parsed.name,
          );

          if (!bindingsListKey) {
            _getBoundQueues(client, parsed, done);
            return;
          }

          client.smembers(bindingsListKey, (listErr, bindings) => {
            if (listErr) return done(listErr);
            const list = (bindings ?? []).filter(
              (b): b is string => typeof b === 'string' && b.length > 0,
            );
            const result: Record<string, IQueueParams[]> = {};

            if (list.length === 0) return done(null, result);

            async.eachOf(
              list,
              (b, _i, next) => {
                const queueSetKey = strategy.getBindingQueuesKey(
                  parsed.ns,
                  parsed.name,
                  b,
                );
                client.smembers(queueSetKey, (queueErr, queues) => {
                  if (queueErr) return next(queueErr);
                  result[b] = (queues ?? []).map((q): IQueueParams =>
                    JSON.parse(q),
                  );
                  next();
                });
              },
              (eachErr) => done(eachErr || null, result),
            );
          });
        });
      }, callback);
    });
  }

  /** @inheritdoc */
  getBindingQueues(
    exchange: string | IExchangeParams,
    binding?: string,
  ): Promise<IQueueParams[]>;
  /** @inheritdoc */
  getBindingQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  /** @inheritdoc */
  getBindingQueues(
    exchange: string | IExchangeParams,
    binding: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getBindingQueues(
    exchange: string | IExchangeParams,
    bindingOrCb?: string | ICallback<IQueueParams[]>,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    const binding = typeof bindingOrCb === 'string' ? bindingOrCb : undefined;
    const callback = typeof bindingOrCb === 'function' ? bindingOrCb : cb;

    return async.withOptionalCallback(callback, (done) => {
      const exchangeParams = _getExchangeParams(exchange);
      if (exchangeParams instanceof Error) {
        this.logger.error('getBindingQueues: invalid exchange params');
        return done(exchangeParams);
      }

      withShared((client, finish) => {
        _getExchangeProperties(client, exchangeParams, (err, props) => {
          if (err && !(err instanceof ExchangeNotFoundError)) {
            return finish(err);
          }
          if (!props) return finish(null, []);

          const parsed: IExchangeParsedParams = {
            ns: exchangeParams.ns,
            name: exchangeParams.name,
            type: props.type,
          };

          if (parsed.type === EExchangeType.DIRECT) {
            // Direct routing keys are normalized (lowercased) before
            // they become storage keys. An uppercase key would derive
            // a key that nothing wrote to.
            if (binding == null) {
              return finish(
                new InvalidExchangeRoutingKeyError({
                  metadata: { exchange: parsed, routingKey: '' },
                }),
              );
            }
            const validated = getStrategy(parsed.type).validateBinding(binding);
            if (validated instanceof Error) return finish(validated);
            return _getRoutingKeyBoundQueues(client, parsed, validated, finish);
          }
          if (parsed.type === EExchangeType.TOPIC) {
            // Patterns are stored verbatim; no normalization.
            return _getRoutingPatternBoundQueues(
              client,
              binding ?? '',
              parsed,
              finish,
            );
          }
          // Fanout: binding is ignored.
          _getBoundQueues(client, parsed, finish);
        });
      }, done);
    });
  }

  // =========================================================================
  // Type-specific reads
  // =========================================================================

  /** @inheritdoc */
  getRoutingKeys(exchange: string | IExchangeParams): Promise<string[]>;
  /** @inheritdoc */
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return this.withTypedExchange(
      exchange,
      EExchangeType.DIRECT,
      (client, parsed, done) => _getRoutingKeys(client, parsed, done),
      cb,
    );
  }

  /** @inheritdoc */
  getRoutingPatterns(exchange: string | IExchangeParams): Promise<string[]>;
  /** @inheritdoc */
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return this.withTypedExchange(
      exchange,
      EExchangeType.TOPIC,
      (client, parsed, done) => _getRoutingPatterns(client, parsed, done),
      cb,
    );
  }

  /** @inheritdoc */
  getBoundQueues(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  /** @inheritdoc */
  getBoundQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getBoundQueues(
    exchange: string | IExchangeParams,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return this.withTypedExchange(
      exchange,
      EExchangeType.FANOUT,
      (client, parsed, done) => _getBoundQueues(client, parsed, done),
      cb,
    );
  }

  // =========================================================================
  // Discovery
  // =========================================================================

  /** @inheritdoc */
  getProperties(
    exchange: string | IExchangeParams,
  ): Promise<IExchangeProperties>;
  /** @inheritdoc */
  getProperties(
    exchange: string | IExchangeParams,
    cb: ICallback<IExchangeProperties>,
  ): void;
  getProperties(
    exchange: string | IExchangeParams,
    cb?: ICallback<IExchangeProperties>,
  ): Promise<IExchangeProperties> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const params = _getExchangeParams(exchange);
      if (params instanceof Error) {
        this.logger.error('getProperties: invalid exchange params');
        return callback(params);
      }
      withShared(
        (client, done) => _getExchangeProperties(client, params, done),
        callback,
      );
    });
  }

  /** @inheritdoc */
  exists(exchange: string | IExchangeParams): Promise<boolean>;
  /** @inheritdoc */
  exists(exchange: string | IExchangeParams, cb: ICallback<boolean>): void;
  exists(
    exchange: string | IExchangeParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const params = _getExchangeParams(exchange);
      if (params instanceof Error) {
        this.logger.error('exists: invalid exchange params');
        return callback(params);
      }
      withShared(
        (client, done) =>
          _getExchangeProperties(client, params, (err) => {
            if (err instanceof ExchangeNotFoundError) {
              return done(null, false);
            }
            if (err) return done(err);
            done(null, true);
          }),
        callback,
      );
    });
  }

  /** @inheritdoc */
  getAllExchanges(): Promise<IExchangeParsedParams[]>;
  /** @inheritdoc */
  getAllExchanges(cb: ICallback<IExchangeParsedParams[]>): void;
  getAllExchanges(
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const { keyExchanges } = keys.getMainKeys();
      withShared((client, done) => {
        client.smembers(keyExchanges, (err, members) => {
          if (err) {
            this.logger.error(
              `getAllExchanges: redis error err=${err.message}`,
            );
            return done(err);
          }
          if (!members) return done(new CallbackEmptyReplyError());
          const exchanges: IExchangeParsedParams[] = [];
          for (const s of members) {
            try {
              const ex: IExchangeParsedParams = JSON.parse(s);
              if (ex && ex.ns && ex.name) exchanges.push(ex);
            } catch {
              this.logger.warn(
                'getAllExchanges: ignoring malformed exchange entry',
              );
            }
          }
          this.logger.debug(
            `getAllExchanges: found ${exchanges.length} exchange(s)`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }

  /** @inheritdoc */
  getNamespaceExchanges(ns: string): Promise<IExchangeParsedParams[]>;
  /** @inheritdoc */
  getNamespaceExchanges(
    ns: string,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void;
  getNamespaceExchanges(
    ns: string,
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const namespace = validateRedisKey(ns);
      if (namespace instanceof Error) {
        this.logger.error('getNamespaceExchanges: invalid namespace');
        return callback(new InvalidNamespaceError());
      }
      const { keyNamespaceExchanges } = keys.getNamespaceKeys(namespace);
      withShared((client, done) => {
        client.smembers(keyNamespaceExchanges, (err, members) => {
          if (err) {
            this.logger.error(
              `getNamespaceExchanges: redis error ns=${ns} err=${err.message}`,
            );
            return done(err);
          }
          if (!members) return done(new CallbackEmptyReplyError());
          const exchanges: IExchangeParsedParams[] = members.map((i) =>
            JSON.parse(i),
          );
          this.logger.debug(
            `getNamespaceExchanges: ns=${ns} count=${exchanges.length}`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }

  /** @inheritdoc */
  getQueueExchanges(
    queue: string | IQueueParams,
  ): Promise<IExchangeParsedParams[]>;
  /** @inheritdoc */
  getQueueExchanges(
    queue: string | IQueueParams,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void;
  getQueueExchanges(
    queue: string | IQueueParams,
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error('getQueueExchanges: invalid queue params');
        return callback(queueParams);
      }
      const { keyQueueExchangeBindings } = keys.getQueueKeys(
        queueParams.ns,
        queueParams.name,
        null,
      );
      withShared((client, done) => {
        client.smembers(keyQueueExchangeBindings, (err, members) => {
          if (err) {
            this.logger.error(
              `getQueueExchanges: redis error ns=${queueParams.ns} q=${queueParams.name} err=${err.message}`,
            );
            return done(err);
          }
          if (!members) return done(new CallbackEmptyReplyError());
          const exchanges: IExchangeParsedParams[] = members.map((i) =>
            JSON.parse(i),
          );
          this.logger.debug(
            `getQueueExchanges: ns=${queueParams.ns} q=${queueParams.name} count=${exchanges.length}`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }

  // =========================================================================
  // Internals
  // =========================================================================

  /**
   * Read the exchange's stored properties, resolve its type, run `fn`
   * with the pooled client and the fully-parsed
   * `IExchangeParsedParams`, and release the client.
   *
   * Rejects with `ExchangeNotFoundError` when the exchange is absent.
   * Callers who want "missing is not an error" (`getBindingQueues`,
   * `exists`) do not use this helper.
   */
  private withResolvedExchange<T>(
    exchange: string | IExchangeParams,
    fn: (
      client: IRedisClient,
      parsed: IExchangeParsedParams,
      cb: ICallback<T>,
    ) => void,
    cb: ICallback<T>,
  ): void {
    const params = _getExchangeParams(exchange);
    if (params instanceof Error) return cb(params);

    withShared((client, done) => {
      _getExchangeProperties(client, params, (err, properties) => {
        if (err) return done(err);
        if (!properties) return done(new ExchangeNotFoundError());
        const parsed: IExchangeParsedParams = {
          ns: params.ns,
          name: params.name,
          type: properties.type,
        };
        fn(client, parsed, done);
      });
    }, cb);
  }

  /**
   * Discover the exchange's stored type, verify it matches `required`,
   * then run `fn` with the fully-parsed `IExchangeParsedParams`.
   *
   * Used by the three type-specific read methods. Unlike the other
   * operations on the manager — which dispatch based on whatever type
   * is stored — these three methods require a specific type, because
   * the method name itself makes the type a part of the call. A
   * mismatch rejects with `ExchangeTypeMismatchError`.
   *
   * This is the sole remaining use of `ExchangeTypeMismatchError` in
   * the manager. `bindQueue`, `unbindQueue`, `matchQueues`,
   * `getBindings`, and `getBindingQueues` no longer produce it — they
   * dispatch on the stored type and reject only for arity mismatches
   * (a fanout exchange given a routing key, a direct/topic exchange
   * without one).
   */
  private withTypedExchange<T>(
    exchange: string | IExchangeParams,
    required: EExchangeType,
    fn: (
      client: IRedisClient,
      parsed: IExchangeParsedParams,
      cb: ICallback<T>,
    ) => void,
    cb?: ICallback<T>,
  ): Promise<T> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withResolvedExchange(
        exchange,
        (client, parsed, done) => {
          if (parsed.type !== required) {
            this.logger.error(
              `type mismatch: required=${EExchangeType[required]} ` +
                `actual=${EExchangeType[parsed.type]}`,
            );
            return done(
              new ExchangeTypeMismatchError({
                metadata: { expected: required, actual: parsed.type },
              }),
            );
          }
          fn(client, parsed, done);
        },
        callback,
      );
    });
  }
}
