/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ref, computed } from 'vue';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { EQueueStateTransitionReason } from '@/api/model';

// Types for metadata entries
interface MetadataEntry {
  key: string;
  value: string;
}

// Props for the composable
interface UseQueueStateChangeFormProps {
  reasonEnum: Record<string, string>;
  defaultReason?: string;
  maxDescriptionLength?: number;
}

/**
 * Composable for handling queue state change forms (pause, stop, resume)
 * Provides form validation, metadata management, and reason selection
 */
export function useQueueStateChangeForm({
  reasonEnum,
  defaultReason = EQueueStateTransitionReason.MANUAL,
  maxDescriptionLength = 500,
}: UseQueueStateChangeFormProps) {
  // Create validation schema
  const validationSchema = toTypedSchema(
    z.object({
      reason: z.enum(Object.values(reasonEnum) as [string, ...string[]], {
        required_error: 'Please select a reason',
      }),
      description: z
        .string()
        .max(
          maxDescriptionLength,
          `Description must be less than ${maxDescriptionLength} characters`,
        )
        .optional(),
    }),
  );

  // Initialize form
  const { handleSubmit, resetForm, errors, meta } = useForm({
    validationSchema,
    initialValues: {
      reason: defaultReason,
      description: '',
    },
  });

  // Form fields
  const { value: reason, errorMessage: reasonError } =
    useField<string>('reason');
  const { value: description, errorMessage: descriptionError } =
    useField<string>('description');

  // Advanced options state
  const showAdvanced = ref<boolean>(false);
  const metadataKey = ref<string>('');
  const metadataValue = ref<string>('');
  const metadataEntries = ref<MetadataEntry[]>([]);

  // Computed properties
  const isFormValid = computed(() => meta.value.valid);

  // Reason options with formatted labels
  const reasonOptions = computed(() => {
    return Object.entries(reasonEnum).map(([key, value]) => ({
      value,
      label: key
        .split('_')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' '),
    }));
  });

  // Metadata management
  function addMetadataEntry(): void {
    if (metadataKey.value.trim() && metadataValue.value.trim()) {
      metadataEntries.value.push({
        key: metadataKey.value.trim(),
        value: metadataValue.value.trim(),
      });
      metadataKey.value = '';
      metadataValue.value = '';
    }
  }

  function removeMetadataEntry(index: number): void {
    metadataEntries.value.splice(index, 1);
  }

  function getMetadataObject(): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};
    metadataEntries.value.forEach((entry) => {
      if (entry.key.trim()) {
        metadata[entry.key.trim()] = entry.value;
      }
    });
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  // Custom reset that also clears metadata
  function resetFormWithMetadata(): void {
    resetForm();
    metadataEntries.value = [];
    metadataKey.value = '';
    metadataValue.value = '';
    showAdvanced.value = false;
  }

  return {
    // Form state
    reason,
    reasonError,
    description,
    descriptionError,

    // Form metadata
    errors,
    meta,
    isFormValid,

    // Form actions
    handleSubmit,
    resetForm: resetFormWithMetadata,

    // Metadata management
    metadataEntries,
    metadataKey,
    metadataValue,
    addMetadataEntry,
    removeMetadataEntry,
    getMetadataObject,

    // Advanced options
    showAdvanced,

    // Reason options
    reasonOptions,
  };
}
