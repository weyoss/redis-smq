/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Return a string error message from any error shape the app might see:
 * a plain string, an Error instance, an Orval API envelope
 * ({ error: { code, message } }), or an AxiosError wrapping that envelope.
 * Always returns a string (empty for nullish), never an object.
 */
export function getErrorMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;

  const e = err as Record<string, unknown>;

  if (isEnvelope(e.error)) return e.error.message;

  const axiosData = (e.response as { data?: unknown } | undefined)?.data;
  if (axiosData && typeof axiosData === 'object') {
    const inner = (axiosData as Record<string, unknown>).error;
    if (isEnvelope(inner)) return inner.message;
  }

  if (typeof e.message === 'string') return e.message;

  return 'An unexpected error occurred';
}

function isEnvelope(v: unknown): v is { code: number; message: string } {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).message === 'string'
  );
}
