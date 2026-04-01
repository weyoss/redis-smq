/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defaultConfig } from './default-config.js';
import {
  ConfigurationMessageAuditExpireError,
  InvalidMessageAuditHistorySizeError,
  InvalidMessageAuditQueueSizeError,
} from '../errors/index.js';
import {
  IMessageAuditConfig,
  IMessageAuditParsedConfig,
  IMessageAuditMessagesConfig,
  IMessageAuditHistoryConfig,
} from '../message-manager/index.js';

function validateNumericValue(value: unknown): number | false {
  const numericValue = Number(value);
  if (isNaN(numericValue) || numericValue < 0) return false;
  return numericValue;
}

function parseMessageAuditMessagesConfig(
  config: boolean | Partial<IMessageAuditMessagesConfig> | undefined,
  defaultConfigOptions: IMessageAuditMessagesConfig,
): IMessageAuditMessagesConfig {
  // Handle undefined
  if (typeof config === 'undefined') {
    return { ...defaultConfigOptions, enabled: false };
  }

  // Handle boolean
  if (typeof config === 'boolean') {
    return {
      ...defaultConfigOptions,
      enabled: config,
    };
  }

  const queueSize = validateNumericValue(
    config.queueSize ?? defaultConfigOptions.queueSize,
  );
  if (queueSize === false) throw new InvalidMessageAuditQueueSizeError();

  const expire = validateNumericValue(
    config.expire ?? defaultConfigOptions.expire,
  );
  if (expire === false) throw new ConfigurationMessageAuditExpireError();

  return {
    enabled: true,
    queueSize,
    expire,
  };
}

function parseUnacknowledgementHistoryConfig(
  config: boolean | Partial<IMessageAuditHistoryConfig> | undefined,
  defaultConfigOptions: IMessageAuditHistoryConfig,
): IMessageAuditHistoryConfig {
  // Handle undefined
  if (typeof config === 'undefined') {
    return { ...defaultConfigOptions };
  }

  // Handle boolean
  if (typeof config === 'boolean') {
    return {
      ...defaultConfigOptions,
      enabled: config,
    };
  }

  const cfg: IMessageAuditHistoryConfig = {
    ...defaultConfigOptions,
    ...config,
  };

  if (validateNumericValue(cfg.maxSize) === false) {
    throw new InvalidMessageAuditHistorySizeError();
  }

  return cfg;
}

export function parseMessageAuditConfig(
  config: boolean | IMessageAuditConfig = {},
): IMessageAuditParsedConfig {
  // Extract configuration values
  let userConfig: IMessageAuditConfig;
  if (typeof config === 'boolean') {
    // If config is a boolean, apply it to all audit types
    userConfig = {
      acknowledgedMessages: config,
      deadLetteredMessages: config,
      unacknowledgementHistory: config,
    };
  } else {
    userConfig = config;
  }

  const defaultMessageAudit = defaultConfig.messageAudit;

  return {
    acknowledgedMessages: parseMessageAuditMessagesConfig(
      userConfig.acknowledgedMessages,
      defaultMessageAudit.acknowledgedMessages,
    ),
    deadLetteredMessages: parseMessageAuditMessagesConfig(
      userConfig.deadLetteredMessages,
      defaultMessageAudit.deadLetteredMessages,
    ),
    unacknowledgementHistory: parseUnacknowledgementHistoryConfig(
      userConfig.unacknowledgementHistory,
      defaultMessageAudit.unacknowledgementHistory,
    ),
  };
}
