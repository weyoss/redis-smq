/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IAPIError } from '@/types';

/**
 * Type guard to check if a value is a non-null object
 */
function isNonNullObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for objects with a string message property
 */
function hasStringMessage(value: unknown): value is { message: string } {
  return (
    isNonNullObject(value) &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for objects with a details object property
 */
function hasObjectDetails(
  value: unknown,
): value is { details: Record<string, unknown> } {
  return (
    isNonNullObject(value) &&
    'details' in value &&
    isNonNullObject((value as { details: unknown }).details)
  );
}

/**
 * Type guard for objects with an error property
 */
function hasErrorProperty(value: unknown): value is { error: unknown } {
  return isNonNullObject(value) && 'error' in value;
}

/**
 * Type guard for objects with a value property
 */
function hasValueProperty(value: unknown): value is { value: unknown } {
  return isNonNullObject(value) && 'value' in value;
}

/**
 * Type guard for Axios-like error with response data
 */
function hasResponseData(
  value: unknown,
): value is { response: { data: unknown } } {
  return (
    isNonNullObject(value) &&
    'response' in value &&
    isNonNullObject((value as { response: unknown }).response) &&
    'data' in ((value as { response: unknown }).response as object)
  );
}

/**
 * Type guard for Axios-like error with status code
 */
function hasStatusCode(value: unknown): value is { status: number } {
  return (
    isNonNullObject(value) &&
    'status' in value &&
    typeof (value as { status: unknown }).status === 'number'
  );
}

/**
 * Type guard for objects with a status property (for fetch API errors)
 */
function hasStatus(value: unknown): value is { status: number } {
  return (
    isNonNullObject(value) &&
    'status' in value &&
    typeof (value as { status: unknown }).status === 'number'
  );
}

/**
 * Get HTTP status text from status code
 */
function getStatusText(status: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statusMessages[status] || `HTTP ${status}`;
}

/**
 * Extract message from an unknown error object
 */
function extractMessage(error: unknown): string | null {
  // Handle strings
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || null;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message?.trim() || error.name || null;
  }

  // Handle objects with message property
  if (hasStringMessage(error)) {
    const trimmed = error.message.trim();
    if (trimmed) return trimmed;
  }

  // Handle objects with data.message property (API responses)
  if (
    isNonNullObject(error) &&
    'data' in error &&
    hasStringMessage(error.data)
  ) {
    const trimmed = error.data.message.trim();
    if (trimmed) return trimmed;
  }

  return null;
}

/**
 * Extract details from an unknown error object
 */
function extractDetails(error: unknown): Record<string, unknown> | undefined {
  const details: Record<string, unknown> = {};

  // Handle Error instances
  if (error instanceof Error) {
    details.name = error.name;
    if (error.stack) details.stack = error.stack;
  }

  // Handle objects with details property
  if (hasObjectDetails(error)) {
    Object.assign(details, error.details);
  }

  // Add status code if available
  if (hasStatusCode(error)) {
    details.status = error.status;
    details.statusText = getStatusText(error.status);
  } else if (hasStatus(error)) {
    details.status = error.status;
    details.statusText = getStatusText(error.status);
  }

  // Add response data if available
  if (hasResponseData(error)) {
    details.responseData = error.response.data;
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Extract error from nested structures (common in API responses)
 */
function extractNestedError(error: unknown): unknown {
  if (!isNonNullObject(error)) return error;

  let current: unknown = error;

  // Unwrap value property
  if (hasValueProperty(current)) {
    current = current.value;
  }

  // Unwrap error property
  if (hasErrorProperty(current)) {
    current = current.error;
  }

  return current;
}

/**
 * Format error message with context
 */
function formatErrorMessage(
  message: string,
  details?: Record<string, unknown>,
): string {
  if (!details?.status) return message;

  const status = details.status as number;
  if (status >= 400 && status < 500) {
    return `${message} (Client Error: ${getStatusText(status)})`;
  }
  if (status >= 500) {
    return `${message} (Server Error: ${getStatusText(status)})`;
  }

  return message;
}

/**
 * Get a formatted error message from any error object
 */
export function getErrorMessage(error: unknown): IAPIError | null {
  // Null/undefined => no error
  if (error == null) return null;

  try {
    // Extract nested error structure
    const extractedError = extractNestedError(error);

    // Extract message
    let message = extractMessage(extractedError);

    // Extract details
    const details = extractDetails(extractedError);

    // If no message found, try original error
    if (!message && extractedError !== error) {
      message = extractMessage(error);
    }

    // If still no message, return generic message
    if (!message) {
      return { message: 'An unexpected error occurred' };
    }

    // Format message with context
    const formattedMessage = formatErrorMessage(message, details);

    return {
      message: formattedMessage,
      details: details,
    };
  } catch (err) {
    // Fallback for any unexpected errors in error handling
    console.error('Error in getErrorMessage:', err);
    return { message: 'An unexpected error occurred' };
  }
}

/**
 * Get just the error message as a string
 */
export function getErrorMessageString(error: unknown): string {
  const result = getErrorMessage(error);
  return result?.message || 'An unexpected error occurred';
}
