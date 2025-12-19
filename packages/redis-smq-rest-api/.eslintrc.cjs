/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

const { resolve } = require('path');
const { env } = require('redis-smq-common');
const dir = env.getCurrentDir();
module.exports = {
  extends: [resolve(dir, '../../.eslintrc.cjs')],
  rules: { '@typescript-eslint/no-empty-object-type': 'off' },
};
