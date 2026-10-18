#!/usr/bin/env node

/*
 * Dev orchestrator: starts the API server, waits for it to write
 * .env.local, then starts Vite. Both children are killed on exit.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env.local');

// Remove stale env so we know when the fresh one lands.
if (fs.existsSync(envPath)) fs.unlinkSync(envPath);

console.log('[dev] Starting API server...');
const api = spawn(process.execPath, ['scripts/run-api-server.js'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

let vite = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[dev] Shutting down...');
  vite?.kill('SIGINT');
  api.kill('SIGINT');
  setTimeout(() => process.exit(code), 1500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

api.on('exit', (code, signal) => {
  if (shuttingDown) return;
  console.error(`[dev] API server exited (code=${code}, signal=${signal})`);
  shutdown(code ?? 1);
});

// Wait for .env.local — up to 30s.
await new Promise((resolve, reject) => {
  const started = Date.now();
  const timer = setInterval(() => {
    if (fs.existsSync(envPath)) {
      clearInterval(timer);
      resolve();
    } else if (Date.now() - started > 30_000) {
      clearInterval(timer);
      reject(new Error('API server did not write .env.local within 30s'));
    }
  }, 200);
}).catch((err) => {
  console.error(`[dev] ${err.message}`);
  shutdown(1);
});

console.log('[dev] Starting Vite...');
vite = spawn('vite', [], { stdio: 'inherit', shell: true, cwd: process.cwd() });

vite.on('exit', (code) => {
  if (shuttingDown) return;
  shutdown(code ?? 0);
});
