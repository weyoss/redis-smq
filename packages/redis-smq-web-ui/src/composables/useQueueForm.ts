/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueDeliveryModel, EQueueType } from '@/types/index.ts';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { validateRedisKey } from '@/lib/validate.ts';

// Define a type for the form values based on the zod schema
export type QueueFormValues = {
  name: string;
  ns: string;
  type: EQueueType;
  deliveryModel: EQueueDeliveryModel;
};

// Define a type for partial initial values
export type QueueFormInitialValues = Partial<QueueFormValues>;

/**
 * Composable for managing queue form state and validation
 * @param customInitialValues - Optional partial initial values to override defaults
 */
export function useQueueForm(customInitialValues?: QueueFormInitialValues) {
  // Define a zod schema for the form values
  const queueSchema = z.object({
    name: z
      .string()
      .min(1, 'Queue name is required')
      .max(100, 'Queue name must be less than 100 characters')
      .refine(validateRedisKey, {
        message:
          'Name must start with a letter and contain only letters, numbers, and single separators (-, _, .). It cannot end with a separator.',
      }),
    ns: z
      .string()
      .min(1, 'Namespace is required')
      .max(100, 'Namespace must be less than 100 characters')
      .refine(validateRedisKey, {
        message:
          'Namespace must start with a letter and contain only letters, numbers, and single separators (-, _, .). It cannot end with a separator.',
      }),
    type: z.nativeEnum(EQueueType, {
      errorMap: () => ({ message: 'Please select a valid queue type' }),
    }),
    deliveryModel: z.nativeEnum(EQueueDeliveryModel, {
      errorMap: () => ({ message: 'Please select a valid delivery model' }),
    }),
  });

  // Convert the zod schema to a vee-validate schema
  const validationSchema = toTypedSchema(queueSchema);

  // Default initial values for the form
  const defaultInitialValues: QueueFormValues = {
    name: '',
    ns: '',
    type: EQueueType.FIFO_QUEUE,
    deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
  };

  // Merge default values with custom initial values
  const initialValues: QueueFormValues = {
    ...defaultInitialValues,
    ...customInitialValues,
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
  } = useForm<QueueFormValues>({
    validationSchema,
    initialValues,
  });

  // Enhanced resetForm that can accept new initial values
  const resetFormWithValues = (newInitialValues?: QueueFormInitialValues) => {
    const resetValues = newInitialValues
      ? { ...defaultInitialValues, ...newInitialValues }
      : initialValues;

    resetForm({
      values: resetValues,
    });
  };

  return {
    // Reactive form state
    errors,
    values,
    meta,

    // Form methods
    resetForm,
    resetFormWithValues,
    handleSubmit,
    setFieldValue,
    setValues,

    // Static values
    initialValues,
    defaultInitialValues,
    validationSchema,
  };
}
