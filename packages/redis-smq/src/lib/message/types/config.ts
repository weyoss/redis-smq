/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IMessagesConfig {
  store?: boolean | IMessagesConfigStorage;
}

export interface IMessagesConfigStorageOptions {
  queueSize?: number;
  expire?: number;
}

export interface IMessagesConfigStorage {
  acknowledged?: boolean | IMessagesConfigStorageOptions;
  deadLettered?: boolean | IMessagesConfigStorageOptions;
}

export interface IMessagesConfigStorageOptionsRequired
  extends Required<IMessagesConfigStorageOptions> {
  store: boolean;
}

export interface IMessagesConfigStorageRequired {
  acknowledged: IMessagesConfigStorageOptionsRequired;
  deadLettered: IMessagesConfigStorageOptionsRequired;
}
