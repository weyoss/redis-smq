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
  ConfigurationMessageAuditQueueSizeError,
  ConfigurationMessageAuditExpireError,
} from '../errors/index.js';
import {
  IMessageAuditConfig,
  IMessageAuditConfigOptions,
  IMessageAuditParsedConfig,
  IMessageAuditParsedConfigOptions,
} from '../message/index.js';

/**
 * @fileoverview Message configuration parsing utilities for RedisSMQ.
 *
 * This module provides functions to parse and validate message audit configuration,
 * including acknowledged and dead-lettered message audit settings. It handles
 * configuration validation, default value assignment, and error reporting.
 */

function validateNumericValue(
  value: unknown,
  ErrorCtor: new (m: string) => Error,
): number {
  const numericValue = Number(value);

  if (isNaN(numericValue)) {
    throw new ErrorCtor(`Value must be a valid number, got: ${value}`);
  }

  if (numericValue < 0) {
    throw new ErrorCtor(`Value must be >= 0, got: ${numericValue}`);
  }

  return numericValue;
}

function getMessageStorageConfig(
  config: boolean | IMessageAuditConfig | undefined,
  key: keyof IMessageAuditConfig,
): boolean | IMessageAuditConfigOptions {
  // Handle undefined store configuration
  if (typeof config === 'undefined') {
    return false;
  }

  // Handle boolean store configuration (applies to all storage types)
  if (typeof config === 'boolean') {
    return config;
  }

  // Handle IMessagesStorageConfig object
  // The store is an object with acknowledged/deadLettered properties
  return config[key] ?? false;
}

function getMessageAuditParams(
  config: boolean | IMessageAuditConfig,
  key: keyof IMessageAuditConfig,
): IMessageAuditParsedConfigOptions {
  const params = getMessageStorageConfig(config, key);
  const defaultParams = defaultConfig.messageAudit[key];
  if (typeof params === 'boolean') {
    return {
      ...defaultParams,
      enabled: params,
    };
  }
  const queueSize = validateNumericValue(
    params.queueSize ?? defaultParams.queueSize,
    ConfigurationMessageAuditQueueSizeError,
  );
  const expire = validateNumericValue(
    params.expire ?? defaultParams.expire,
    ConfigurationMessageAuditExpireError,
  );
  return {
    enabled: true,
    queueSize,
    expire,
  };
}

/**
 * Parses and validates message audit configuration.
 *
 * This function processes the complete message audit configuration,
 * handling both acknowledged and dead-lettered message audit settings.
 * It validates all parameters and returns a fully parsed configuration object.
 *
 * @param config - The messages configuration object containing storage settings
 * @returns Parsed and validated storage configuration for all message types
 *
 * @throws {ConfigurationMessageAuditQueueSizeError} When any queueSize is invalid
 * @throws {ConfigurationMessageAuditExpireError} When any expire value is invalid
 *
 * @example
 * ```typescript
 * // Simple boolean configuration (applies to all storage types)
 * const config1 = { acknowledgedMessages: true, deadLetteredMessages: true };
 * const parsed1 = parseMessageStorageConfig(config1);
 * // Returns: {
 * //   acknowledged: { enabled: true, queueSize: 0, expire: 0 },
 * //   deadLettered: { enabled: true, queueSize: 0, expire: 0 }
 * // }
 *
 * // Boolean false configuration (disables all storage)
 * const config1b = { acknowledgedMessages: false, deadLetteredMessages: false };
 * const parsed1b = parseMessageStorageConfig(config1b);
 * // Returns: {
 * //   acknowledged: { enabled: false, queueSize: 0, expire: 0 },
 * //   deadLettered: { enabled: false, queueSize: 0, expire: 0 }
 * // }
 *
 * // Detailed object configuration with specific settings per type
 * const config2 = {
 *   acknowledgedMessages: { queueSize: 1000, expire: 3600 },
 *   deadLetteredMessages: { queueSize: 500, expire: 7200 }
 * };
 * const parsed2 = parseMessageStorageConfig(config2);
 * // Returns: {
 * //   acknowledgedMessages: { enabled: true, queueSize: 1000, expire: 3600 },
 * //   deadLetteredMessages: { enabled: true, queueSize: 500, expire: 7200 }
 * // }
 *
 * // Mixed configuration with different types
 * const config3 = {
 *     acknowledgedMessages: { queueSize: 100 }, // expire defaults to 0
 *     deadLetteredMessages: false // explicitly disabled
 * };
 * const parsed3 = parseMessageStorageConfig(config3);
 * // Returns: {
 * //   acknowledgedMessages: { enabled: true, queueSize: 100, expire: 0 },
 * //   deadLetteredMessages: { enabled: false, queueSize: 0, expire: 0 }
 * // }
 *
 * // Partial object configuration (missing keys default to false)
 * const config4 = {
 *   store: {
 *     acknowledgedMessages: true // only acknowledged specified
 *     // deadLetteredMessages is undefined, defaults to false
 *   }
 * };
 * const parsed4 = parseMessageStorageConfig(config4);
 * // Returns: {
 * //   acknowledgedMessages: { enabled: true, queueSize: 0, expire: 0 },
 * //   deadLetteredMessages: { enabled: false, queueSize: 0, expire: 0 }
 * // }
 * ```
 */
export function parseMessageAuditConfig(
  config: boolean | IMessageAuditConfig = {},
): IMessageAuditParsedConfig {
  return {
    acknowledgedMessages: getMessageAuditParams(config, 'acknowledgedMessages'),
    deadLetteredMessages: getMessageAuditParams(config, 'deadLetteredMessages'),
  };
}
