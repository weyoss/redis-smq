/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { logger as factory } from 'redis-smq-common';
import { Configuration } from '../../src/config/configuration';

export const logger = factory.getLogger(Configuration.getSetConfig().logger);
