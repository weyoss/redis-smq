/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

// Define a type for the form values
export type QueueRateLimitFormValues = {
  limit: number;
  interval: number;
};

/**
 * Composable for managing queue rate limit form state and validation
 */
export function useQueueRateLimitForm() {
  // Define a zod schema for the form values
  const rateLimitSchema = z.object({
    limit: z
      .number()
      .int('Rate limit must be a whole number')
      .positive('Rate limit must be greater than 0')
      .max(1000000, 'Rate limit must be less than 1,000,000'),
    interval: z
      .number()
      .int('Interval must be a whole number')
      .positive('Interval must be greater than 0')
      .max(1000, 'Interval must be less than 1,000'),
  });

  // Convert the zod schema to a vee-validate schema
  const validationSchema = toTypedSchema(rateLimitSchema);

  // Initial values for the form
  const initialValues: QueueRateLimitFormValues = {
    limit: 100,
    interval: 1,
  };

  // Use the useForm hook from vee-validate
  const {
    errors,
    values,
    meta,
    resetForm,
    handleSubmit,
    setFieldValue,
    setValues,
  } = useForm<QueueRateLimitFormValues>({
    validationSchema,
    initialValues,
  });

  // Helper function to convert API rate limit to form values
  const fromRateLimitData = (
    data: QueueRateLimitFormValues | null,
  ): QueueRateLimitFormValues => {
    if (!data) {
      return initialValues;
    }

    return {
      limit: data.limit || 100,
      interval: data.interval || 1,
    };
  };

  return {
    // Reactive form state
    errors,
    values,
    meta,

    // Form methods
    resetForm,
    handleSubmit,
    setFieldValue,
    setValues,

    // Helper methods
    fromRateLimitData,

    // Static values
    initialValues,
    validationSchema,
  };
}
