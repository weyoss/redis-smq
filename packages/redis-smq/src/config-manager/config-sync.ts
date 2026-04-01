/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ICallback, Runnable } from 'redis-smq-common';
import { Configuration } from './configuration.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';
import { IRedisSMQParsedConfig } from './types/index.js';

/**
 * ConfigSync handles cross-instance synchronization
 */
export class ConfigSync extends Runnable {
  private static instance: ConfigSync | null = null;

  protected readonly logger;

  protected constructor() {
    super();
    const config = Configuration.getConfig();
    this.logger = createLogger(
      config.logger,
      `${this.constructor.name}-${this.getId()}`,
    );
  }

  protected onLocalConfigUpdated = (
    cfg: IRedisSMQParsedConfig,
    version: number,
  ) => {
    this.logger.debug('Publishing local config update...', cfg);
    EventMultiplexer.getInstance().publish(
      'configuration.updated',
      cfg,
      version,
    );
  };

  protected onEventBusConfigUpdated = (
    cfg: IRedisSMQParsedConfig,
    version: number,
  ) => {
    this.logger.debug('Received remote config update...');
    const configInstance = Configuration.getInstance();
    const config = configInstance.getConfig();

    // Only apply if the remote version is strictly newer.
    // This prevents loops and ensures monotonic version progression.
    if (version > config.version) {
      this.logger.debug(
        `Configuration has been updated from elsewhere to v${version}. Reloading...`,
      );
      return configInstance.updateConfigFromEvent(cfg, version, (err) => {
        if (err) {
          this.logger.error('Failed to update config from event', err);
        }
      });
    }
  };

  protected setupEventListeners() {
    const configInstance = Configuration.getInstance();
    configInstance.on('configuration.updated', this.onLocalConfigUpdated);
    InternalEventBus.getInstance().on(
      'configuration.updated',
      this.onEventBusConfigUpdated,
    );
  }

  protected cleanupEventListeners() {
    const configInstance = Configuration.getInstance();
    configInstance.removeListener(
      'configuration.updated',
      this.onLocalConfigUpdated,
    );
    InternalEventBus.getInstance().removeListener(
      'configuration.updated',
      this.onEventBusConfigUpdated,
    );
  }

  protected override goingUp(): Array<(cb: ICallback) => void> {
    return super.goingUp().concat([
      (cb) => {
        this.setupEventListeners();
        cb();
      },
    ]);
  }

  protected override goingDown(): Array<(cb: ICallback) => void> {
    return [
      (cb: ICallback) => {
        this.cleanupEventListeners();
        cb();
      },
    ].concat(super.goingDown());
  }

  static initialize(cb: ICallback): void {
    if (!this.instance) {
      this.instance = new ConfigSync();
      return this.instance.run(cb);
    }
    cb();
  }

  static shutdown(cb: ICallback): void {
    if (this.instance) {
      return this.instance.shutdown(() => {
        this.instance = null;
        cb();
      });
    }
    cb();
  }
}
