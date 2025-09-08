/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IMessagesConfig {
  store?: boolean | IMessagesStorageConfig;
}

export interface IMessagesStorageConfigOptions {
  queueSize?: number;
  expire?: number;
}

export interface IMessagesStorageConfig {
  acknowledged?: boolean | IMessagesStorageConfigOptions;
  deadLettered?: boolean | IMessagesStorageConfigOptions;
}

export interface IMessagesStorageParsedConfigOptions
  extends Required<IMessagesStorageConfigOptions> {
  store: boolean;
}

export interface IMessagesStorageParsedConfig {
  acknowledged: IMessagesStorageParsedConfigOptions;
  deadLettered: IMessagesStorageParsedConfigOptions;
}
