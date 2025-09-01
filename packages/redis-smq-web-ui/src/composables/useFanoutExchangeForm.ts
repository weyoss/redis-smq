/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { validateRedisKey } from '@/lib/validate';

export function useFanoutExchangeForm() {
  // Define a zod schema for the form values
  const fanoutExchangeSchema = z.object({
    fanOutName: z
      .string()
      .min(1, 'Exchange name is required.')
      .refine(validateRedisKey, {
        message:
          'Name must start with a letter and contain only letters, numbers, and single separators (-, _, .). It cannot end with a separator.',
      }),
  });

  // Convert the zod schema to a vee-validate schema
  const validationSchema = toTypedSchema(fanoutExchangeSchema);

  const { errors, handleSubmit, defineField, resetForm, meta } = useForm({
    validationSchema,
    initialValues: {
      fanOutName: '',
    },
  });

  // defineField provides v-model binding and attributes for the input
  const [fanOutName, fanOutNameAttrs] = defineField('fanOutName');

  return {
    errors,
    handleSubmit,
    resetForm,
    meta, // Contains form metadata like 'valid' state
    fanOutName,
    fanOutNameAttrs,
  };
}
