/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Configuration } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ConfigurationService {
  protected configuration;

  constructor(configuration: Configuration) {
    this.configuration = promisifyAll(configuration);
  }

  async getConfiguration() {
    return this.configuration.getConfig();
  }
}
