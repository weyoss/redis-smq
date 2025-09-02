/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { main } from '@/router/main.ts';
import { pages } from '@/router/pages.ts';
import type { RouteRecordRaw } from 'vue-router';

export const routes: readonly RouteRecordRaw[] = [...main, ...pages];
