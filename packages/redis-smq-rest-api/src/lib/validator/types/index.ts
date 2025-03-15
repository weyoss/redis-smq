/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { JSONSchema7 } from 'json-schema';

export type TResponseSchemaMapItem = {
  schema: JSONSchema7;
  responseCode: number;
};

export type TResponseSchemaMap = Map<string, TResponseSchemaMapItem>;
