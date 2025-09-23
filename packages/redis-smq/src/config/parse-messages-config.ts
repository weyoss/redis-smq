/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { defaultConfig } from './default-config.js';
import {
  IMessagesConfig,
  IMessagesParsedConfig,
  IMessagesStorageConfig,
  IMessagesStorageConfigOptions,
  IMessagesStorageParsedConfig,
  IMessagesStorageParsedConfigOptions,
} from '../message/index.js';
import {
  ConfigurationMessageQueueSizeError,
  ConfigurationMessageStoreExpireError,
} from '../errors/index.js';

/**
 * @fileoverview Message configuration parsing utilities for RedisSMQ.
 *
 * This module provides functions to parse and validate message storage configuration,
 * including acknowledged and dead-lettered message storage settings. It handles
 * configuration validation, default value assignment, and error reporting.
 */

/**
 * Default values for message storage configuration.
 * These values are used when specific configuration is not provided.
 */
const DEFAULT_STORAGE_VALUES = {
  /** Default queue size when storage is enabled but no size is specified */
  QUEUE_SIZE: 0,
  /** Default expiration time when storage is enabled but no expiration is specified */
  EXPIRE: 0,
} as const;

/**
 * Validation constants for message storage configuration.
 */
const VALIDATION_LIMITS = {
  /** Minimum allowed queue size */
  MIN_QUEUE_SIZE: 0,
  /** Minimum allowed expiration time */
  MIN_EXPIRE: 0,
} as const;

/**
 * Validates a numeric configuration value.
 *
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @param minValue - The minimum allowed value
 * @returns The validated numeric value
 * @throws {Error} When the value is invalid
 */
function validateNumericValue(
  value: unknown,
  fieldName: string,
  minValue: number,
): number {
  const numericValue = Number(value ?? 0);

  if (isNaN(numericValue)) {
    throw new Error(`${fieldName} must be a valid number, got: ${value}`);
  }

  if (numericValue < minValue) {
    throw new Error(
      `${fieldName} must be >= ${minValue}, got: ${numericValue}`,
    );
  }

  return numericValue;
}

/**
 * Extracts message storage configuration for a specific storage type.
 *
 * This function handles different configuration formats for the `store` property:
 * - `undefined`: Returns false (storage disabled)
 * - `boolean`: Returns the boolean value (applies to all storage types)
 * - `IMessagesStorageConfig` object: Returns the specific storage configuration for the key
 *
 * @param config - The messages configuration object
 * @param key - The storage type key ('acknowledged' or 'deadLettered')
 * @returns The storage configuration (boolean or options object)
 */
function getMessageStorageConfig(
  config: IMessagesConfig,
  key: keyof IMessagesStorageConfig,
): boolean | IMessagesStorageConfigOptions {
  const { store } = config ?? {};

  // Handle undefined store configuration
  if (typeof store === 'undefined') {
    return false;
  }

  // Handle boolean store configuration (applies to all storage types)
  if (typeof store === 'boolean') {
    return store;
  }

  // Handle IMessagesStorageConfig object
  // The store is an object with acknowledged/deadLettered properties
  const storageConfig = store[key];

  // If the specific key is not defined, default to false (disabled)
  if (typeof storageConfig === 'undefined') {
    return false;
  }

  // Return the configuration for this specific storage type
  // This can be either a boolean or IMessagesStorageConfigOptions
  return storageConfig;
}

/**
 * Parses and validates message storage parameters for a specific storage type.
 *
 * This function converts raw configuration into validated, parsed parameters.
 * It performs validation on numeric values and throws appropriate errors
 * for invalid configurations.
 *
 * @param config - The messages configuration object
 * @param key - The storage type key ('acknowledged' or 'deadLettered')
 * @returns Parsed and validated storage parameters
 *
 * @throws {ConfigurationMessageQueueSizeError} When queueSize is invalid (NaN or negative)
 * @throws {ConfigurationMessageStoreExpireError} When expire is invalid (NaN or negative)
 */
function getMessageStorageParams(
  config: IMessagesConfig,
  key: keyof IMessagesStorageConfig,
): IMessagesStorageParsedConfigOptions {
  const params = getMessageStorageConfig(config, key);

  // Handle boolean configuration (storage disabled/enabled with defaults)
  if (typeof params === 'boolean') {
    return {
      store: params,
      queueSize: DEFAULT_STORAGE_VALUES.QUEUE_SIZE,
      expire: DEFAULT_STORAGE_VALUES.EXPIRE,
    };
  }

  // Parse and validate queueSize with improved error handling
  let queueSize: number;
  try {
    queueSize = validateNumericValue(
      params.queueSize,
      `queueSize for ${key}`,
      VALIDATION_LIMITS.MIN_QUEUE_SIZE,
    );
  } catch (error) {
    throw new ConfigurationMessageQueueSizeError(
      error instanceof Error ? error.message : `Invalid queueSize for ${key}`,
    );
  }

  // Parse and validate expire with improved error handling
  let expire: number;
  try {
    expire = validateNumericValue(
      params.expire,
      `expire for ${key}`,
      VALIDATION_LIMITS.MIN_EXPIRE,
    );
  } catch (error) {
    throw new ConfigurationMessageStoreExpireError(
      error instanceof Error ? error.message : `Invalid expire for ${key}`,
    );
  }

  return {
    store: true,
    queueSize,
    expire,
  };
}

/**
 * Parses and validates message storage configuration for all storage types.
 *
 * This function processes the complete message storage configuration,
 * handling both acknowledged and dead-lettered message storage settings.
 * It validates all parameters and returns a fully parsed configuration object.
 *
 * @param config - The messages configuration object containing storage settings
 * @returns Parsed and validated storage configuration for all message types
 *
 * @throws {ConfigurationMessageQueueSizeError} When any queueSize is invalid
 * @throws {ConfigurationMessageStoreExpireError} When any expire value is invalid
 *
 * @example
 * ```typescript
 * // Simple boolean configuration (applies to all storage types)
 * const config1 = { store: true };
 * const parsed1 = parseMessageStorageConfig(config1);
 * // Returns: {
 * //   acknowledged: { store: true, queueSize: 0, expire: 0 },
 * //   deadLettered: { store: true, queueSize: 0, expire: 0 }
 * // }
 *
 * // Boolean false configuration (disables all storage)
 * const config1b = { store: false };
 * const parsed1b = parseMessageStorageConfig(config1b);
 * // Returns: {
 * //   acknowledged: { store: false, queueSize: 0, expire: 0 },
 * //   deadLettered: { store: false, queueSize: 0, expire: 0 }
 * // }
 *
 * // Detailed object configuration with specific settings per type
 * const config2 = {
 *   store: {
 *     acknowledged: { queueSize: 1000, expire: 3600 },
 *     deadLettered: { queueSize: 500, expire: 7200 }
 *   }
 * };
 * const parsed2 = parseMessageStorageConfig(config2);
 * // Returns: {
 * //   acknowledged: { store: true, queueSize: 1000, expire: 3600 },
 * //   deadLettered: { store: true, queueSize: 500, expire: 7200 }
 * // }
 *
 * // Mixed configuration with different types
 * const config3 = {
 *   store: {
 *     acknowledged: { queueSize: 100 }, // expire defaults to 0
 *     deadLettered: false // explicitly disabled
 *   }
 * };
 * const parsed3 = parseMessageStorageConfig(config3);
 * // Returns: {
 * //   acknowledged: { store: true, queueSize: 100, expire: 0 },
 * //   deadLettered: { store: false, queueSize: 0, expire: 0 }
 * // }
 *
 * // Partial object configuration (missing keys default to false)
 * const config4 = {
 *   store: {
 *     acknowledged: true // only acknowledged specified
 *     // deadLettered is undefined, defaults to false
 *   }
 * };
 * const parsed4 = parseMessageStorageConfig(config4);
 * // Returns: {
 * //   acknowledged: { store: true, queueSize: 0, expire: 0 },
 * //   deadLettered: { store: false, queueSize: 0, expire: 0 }
 * // }
 * ```
 */
export function parseMessageStorageConfig(
  config: IMessagesConfig,
): IMessagesStorageParsedConfig {
  try {
    return {
      acknowledged: getMessageStorageParams(config, 'acknowledged'),
      deadLettered: getMessageStorageParams(config, 'deadLettered'),
    };
  } catch (error) {
    // Re-throw with additional context about which configuration failed
    if (
      error instanceof ConfigurationMessageQueueSizeError ||
      error instanceof ConfigurationMessageStoreExpireError
    ) {
      throw error;
    }
    // Handle unexpected errors
    throw new Error(
      `Failed to parse message storage configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Parses and validates the complete messages configuration.
 *
 * This is the main entry point for parsing message configuration. It combines
 * user-provided configuration with default values, validates all settings,
 * and returns a complete, parsed configuration object ready for use.
 *
 * The function uses deep merging to combine user configuration with defaults,
 * ensuring that all required configuration properties are present even if
 * not explicitly provided by the user.
 *
 * @param userConfig - User-provided messages configuration (optional)
 * @returns Complete parsed and validated messages configuration
 *
 * @throws {ConfigurationMessageQueueSizeError} When any queueSize is invalid
 * @throws {ConfigurationMessageStoreExpireError} When any expire value is invalid
 *
 * @example
 * ```typescript
 * // Using defaults (no configuration provided)
 * const defaultParsed = parseMessagesConfig();
 * // Returns default configuration with storage disabled
 *
 * // Simple configuration
 * const simpleParsed = parseMessagesConfig({ store: true });
 * // Returns configuration with storage enabled using default values
 *
 * // Detailed configuration
 * const detailedConfig = {
 *   store: {
 *     acknowledged: {
 *       queueSize: 1000,
 *       expire: 3600 // 1 hour
 *     },
 *     deadLettered: {
 *       queueSize: 500,
 *       expire: 86400 // 24 hours
 *     }
 *   }
 * };
 * const detailedParsed = parseMessagesConfig(detailedConfig);
 * // Returns fully configured message storage settings
 *
 * // Partial configuration (mixed with defaults)
 * const partialConfig = {
 *   store: {
 *     acknowledged: { queueSize: 200 } // expire will use default (0)
 *     // deadLettered will use default settings
 *   }
 * };
 * const partialParsed = parseMessagesConfig(partialConfig);
 * // Returns configuration with user values merged with defaults
 * ```
 */
export default function parseMessagesConfig(
  userConfig: IMessagesConfig = {},
): IMessagesParsedConfig {
  try {
    const store = parseMessageStorageConfig(userConfig);

    // Deep merge user configuration with defaults
    // This ensures all required properties are present
    return _.merge({}, defaultConfig.messages, { store });
  } catch (error) {
    // Provide context about the configuration parsing failure
    if (
      error instanceof ConfigurationMessageQueueSizeError ||
      error instanceof ConfigurationMessageStoreExpireError
    ) {
      throw error;
    }

    // Handle unexpected errors with context
    throw new Error(
      `Failed to parse messages configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
