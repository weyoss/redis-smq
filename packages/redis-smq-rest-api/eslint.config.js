/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// Import parent config (which is an array)
import parentConfig from '../../eslint.config.js';

// Apply rule overrides to all configs in the parent array
export default parentConfig.map((config) => ({
  ...config,
  rules: {
    ...config.rules,
    '@typescript-eslint/no-empty-object-type': 'off',
  },
}));
