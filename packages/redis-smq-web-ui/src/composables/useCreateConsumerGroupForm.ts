/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

const schema = z.object({
  consumerGroupName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(64, { message: 'Name must be at most 64 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Only letters, numbers, underscores, and hyphens are allowed',
    }),
});

export type FormValues = z.infer<typeof schema>;

export function useCreateConsumerGroupForm() {
  const validationSchema = toTypedSchema(schema);

  const {
    errors,
    values,
    meta,
    resetForm,
    handleSubmit,
    setFieldValue,
    setValues,
  } = useForm({
    validationSchema,
  });

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

    // Static values
    validationSchema,
  };
}
