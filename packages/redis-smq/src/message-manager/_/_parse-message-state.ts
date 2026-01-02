/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageState } from '../../message/message-state.js';
import {
  EMessageProperty,
  TMessageStateProperty,
  TMessageStatePropertyType,
} from '../../message/index.js';
import { PanicError } from 'redis-smq-common';

/**
 * Parses a value into a number.
 * @param value - The value to parse.
 * @param required - If true, the function will throw a PanicError if the value is null, undefined, or NaN.
 * @returns A number, or null if the value is not required and is invalid.
 */
function number(value: unknown, required: true): number;
function number(value: unknown, required?: false): number | null;
function number(value: unknown, required?: boolean): number | null;
function number(value: unknown, required = false): number | null {
  if (value === null || value === undefined || value === '') {
    if (required)
      throw new PanicError({ message: `Expected a required number value.` });
    return null;
  }
  const num = Number(value);
  if (isNaN(num)) {
    if (required)
      throw new PanicError({
        message: `Expected a numeric value, but got '${value}'.`,
      });
    return null;
  }
  return num;
}

/**
 * Parses a value into a boolean.
 * @param value - The value to parse.
 * @param required - If true, the function will throw a PanicError if the value is null or undefined.
 * @returns A boolean, or null if the value is not required and is invalid.
 */
function boolean(value: unknown, required: true): boolean;
function boolean(value: unknown, required?: false): boolean | null;
function boolean(value: unknown, required?: boolean): boolean | null;
function boolean(value: unknown, required = false): boolean | null {
  if (value === null || value === undefined || value === '') {
    if (required)
      throw new PanicError({ message: `Expected a required boolean value.` });
    return null;
  }
  return Boolean(Number(value));
}

/**
 * Parses a value into a string.
 * @param value - The value to parse.
 * @param required - If true, the function will throw a PanicError if the value is null or undefined.
 * @returns A string, or null if the value is not required and is invalid.
 */
function string(value: unknown, required: true): string;
function string(value: unknown, required?: false): string | null;
function string(value: unknown, required?: boolean): string | null;
function string(value: unknown, required = false): string | null {
  if (value === null || value === undefined || value === '') {
    if (required)
      throw new PanicError({ message: `Expected a required string value.` });
    return null;
  }
  return String(value);
}

function requiredNumber(value: unknown): number {
  return number(value, true);
}

function requiredString(value: unknown): string {
  return string(value, true);
}

function requiredBoolean(value: unknown): boolean {
  return boolean(value, true);
}

/**
 * A mapped type that defines the structure of the property configuration object.
 * For each property P, it specifies the exact types for its parser and setter.
 */
type TPropertyConfigs = {
  [P in TMessageStateProperty]: {
    parser: (value: unknown) => TMessageStatePropertyType<P>;
    setter: (
      instance: MessageState,
      value: NonNullable<TMessageStatePropertyType<P>>,
    ) => void;
  };
};

/**
 * A registry mapping message properties to their parsing and setting configuration.
 * This object conforms to the TPropertyConfigs mapped type, ensuring that each
 * parser and setter has the correct signature for its corresponding property.
 */
export const propertyConfigs: TPropertyConfigs = {
  [EMessageProperty.ID]: {
    parser: requiredString,
    setter: (s, v) => s.setId(v),
  },
  [EMessageProperty.PUBLISHED_AT]: {
    parser: number,
    setter: (s, v) => s.setPublishedAt(v),
  },
  [EMessageProperty.SCHEDULED_AT]: {
    parser: number,
    setter: (s, v) => s.setScheduledAt(v),
  },
  [EMessageProperty.REQUEUED_AT]: {
    parser: number,
    setter: (s, v) => s.setRequeuedAt(v),
  },
  [EMessageProperty.REQUEUE_COUNT]: {
    parser: requiredNumber,
    setter: (s, v) => s.setRequeueCount(v),
  },
  [EMessageProperty.LAST_REQUEUED_AT]: {
    parser: number,
    setter: (s, v) => s.setLastRequeuedAt(v),
  },
  [EMessageProperty.ACKNOWLEDGED_AT]: {
    parser: number,
    setter: (s, v) => s.setAcknowledgedAt(v),
  },
  [EMessageProperty.UNACKNOWLEDGED_AT]: {
    parser: number,
    setter: (s, v) => s.setUnacknowledgedAt(v),
  },
  [EMessageProperty.LAST_UNACKNOWLEDGED_AT]: {
    parser: number,
    setter: (s, v) => s.setLastUnacknowledgedAt(v),
  },
  [EMessageProperty.DEAD_LETTERED_AT]: {
    parser: number,
    setter: (s, v) => s.setDeadLetteredAt(v),
  },
  [EMessageProperty.PROCESSING_STARTED_AT]: {
    parser: number,
    setter: (s, v) => s.setProcessingStartedAt(v),
  },
  [EMessageProperty.LAST_SCHEDULED_AT]: {
    parser: number,
    setter: (s, v) => s.setLastScheduledAt(v),
  },
  [EMessageProperty.LAST_RETRIED_ATTEMPT_AT]: {
    parser: number,
    setter: (s, v) => s.setLastRetriedAttemptAt(v),
  },
  [EMessageProperty.SCHEDULED_CRON_FIRED]: {
    parser: requiredBoolean,
    setter: (s, v) => s.setScheduledCronFired(v),
  },
  [EMessageProperty.ATTEMPTS]: {
    parser: requiredNumber,
    setter: (s, v) => s.setAttempts(v),
  },
  [EMessageProperty.SCHEDULED_REPEAT_COUNT]: {
    parser: requiredNumber,
    setter: (s, v) => s.setScheduledRepeatCount(v),
  },
  [EMessageProperty.EXPIRED]: {
    parser: requiredBoolean,
    setter: (s, v) => s.setExpired(v),
  },
  [EMessageProperty.EFFECTIVE_SCHEDULED_DELAY]: {
    parser: requiredNumber,
    setter: (s, v) => s.setEffectiveScheduledDelay(v),
  },
  [EMessageProperty.SCHEDULED_TIMES]: {
    parser: requiredNumber,
    setter: (s, v) => s.setScheduledTimes(v),
  },
  [EMessageProperty.SCHEDULED_MESSAGE_PARENT_ID]: {
    parser: string,
    setter: (s, v) => s.setScheduledMessageParentId(v),
  },
  [EMessageProperty.REQUEUED_MESSAGE_PARENT_ID]: {
    parser: string,
    setter: (s, v) => s.setRequeuedMessageParentId(v),
  },
};

/**
 * Parses a key-value record from Redis into a MessageState instance.
 * This function handles all supported properties from the EMessageProperty enum.
 *
 * @param keyValue - A record of property keys and their raw values.
 * @returns A populated MessageState instance.
 */
export function _parseMessageState(
  keyValue: Record<string, unknown>,
): MessageState {
  const msgState = new MessageState();
  for (const key in keyValue) {
    const property = Number(key) as TMessageStateProperty;
    if (property in propertyConfigs) {
      const config = propertyConfigs[property];
      const rawValue = keyValue[key];
      const parsedValue = config.parser(rawValue);
      if (parsedValue !== null && parsedValue !== '') {
        // A type assertion is acceptable here because we are bridging the dynamic,
        // untyped world of Redis keys with our static type system.
        // type-coverage:ignore-next-line
        const setter = config.setter as (
          s: MessageState,
          v: string | number | boolean,
        ) => void;
        setter(msgState, parsedValue);
      }
    }
  }
  return msgState;
}
