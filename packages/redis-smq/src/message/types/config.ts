/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IMessageAuditConfigOptions {
  queueSize?: number;
  expire?: number;
}

export interface IMessageAuditParsedConfigOptions {
  enabled: boolean;
  queueSize: number;
  expire: number;
}

export interface IMessageAuditConfig {
  acknowledgedMessages?: boolean | IMessageAuditConfigOptions;
  deadLetteredMessages?: boolean | IMessageAuditConfigOptions;
}

export interface IMessageAuditParsedConfig {
  acknowledgedMessages: IMessageAuditParsedConfigOptions;
  deadLetteredMessages: IMessageAuditParsedConfigOptions;
}
