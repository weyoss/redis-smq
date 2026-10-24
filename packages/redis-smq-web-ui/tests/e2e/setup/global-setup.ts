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
}
