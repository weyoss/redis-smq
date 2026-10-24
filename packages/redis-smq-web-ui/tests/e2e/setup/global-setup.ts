/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Runs after Playwright's `webServer` has started `scripts/dev.js` (which
 * writes `.env.local`) and before worker processes fork. Populates
 * `process.env` so worker-side apiClient instances know the API URL.
 *
 * Vite embeds `.env.local` into the browser bundle at startup — the SPA
 * gets the right API URL automatically. `page.request` and the apiClient
 * fixtures run in the Node worker, which does NOT read Vite's env files.
 * Without this setup step they would fall back to a hardcoded port and
 * get ECONNREFUSED.
 *
 * Also normalizes the server-side config that the E2E suite depends on
 * (message-audit features — see `enableAuditFeatures` below).
 */
export default async function globalSetup(): Promise<void> {
  const envPath = resolve(process.cwd(), '.env.local');

  let raw: string;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    throw new Error(
      `[globalSetup] ${envPath} not found. ` +
        `Playwright's webServer should have run scripts/dev.js first — ` +
        `check playwright.config.ts webServer.timeout.`,
    );
  }

  // Simple .env parser — no multiline values, no escapes, no expansion.
  // Matches what scripts/dev.js writes.
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    // Don't override shell-provided values (CI sets them explicitly).
    if (process.env[key] === undefined) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  if (!process.env.VITE_API_URL) {
    throw new Error(
      `[globalSetup] VITE_API_URL is not set in ${envPath}. ` +
        `Did scripts/dev.js finish writing before Playwright read it?`,
    );
  }

  await enableAuditFeatures(process.env.VITE_API_URL);
}

/**
 * Enable the three message-audit features. redis-smq's browse endpoints
 * gate on these:
 *   - `deadLetteredMessages.enabled` → `?status=dead-lettered` returns
 *     412 DeadLetterAuditDisabledError when off. This blocks
 *     `MSGACT-3` / `MSGACT-3b` (requeue flow requires browsing the
 *     Dead-lettered tab first).
 *   - `acknowledgedMessages.enabled` → same for `?status=acknowledged`.
 *     No test currently browses that tab directly, but keeping it
 *     enabled avoids the same failure mode if a future test does.
 *   - `unacknowledgementHistory.enabled` → `GET /api/messages/:id/
 *     unack-history` returns 412 UnacknowledgmentHistoryDisabledError
 *     when off. `DETAIL-8` tolerates both states; enabling it just
 *     exercises the enabled path.
 *
 * The config is process-global server state and persists for the life
 * of the API instance. PATCHing here normalizes it at the start of every
 * Playwright run (including reuseExistingServer=true locally, where the
 * API from a previous session may have leftover state). Individual tests
 * that mutate config (CONFIG-4/5/6/7) restore it via try/finally.
 *
 * Boolean `true` is valid input per the schema — the server coerces it
 * to `{ enabled: true, ...defaults }`.
 */
async function enableAuditFeatures(apiUrl: string): Promise<void> {
  const base = apiUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/config`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messageAudit: {
        acknowledgedMessages: true,
        deadLetteredMessages: true,
        unacknowledgementHistory: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>');
    throw new Error(
      `[globalSetup] failed to enable message-audit features on ${base}: ` +
        `HTTP ${res.status} — ${body}`,
    );
  }
}
