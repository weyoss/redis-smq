/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConfigManager } from 'redis-smq';

export class ConfigurationService {
  protected configManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async getConfiguration() {
    return this.configManager.getConfig();
  }
}
