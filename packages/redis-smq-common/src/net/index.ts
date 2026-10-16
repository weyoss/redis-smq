/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createServer, type AddressInfo } from 'net';

// Ports already handed out by this process — prevents concurrent
// getRandomPort() calls from returning the same port.
const reservedPorts = new Set<number>();

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server
      .once('error', (err: NodeJS.ErrnoException) => {
        // EADDRINUSE  -> in use
        // EACCES/EADDRNOTAVAIL -> unusable, treat as "in use"
        resolve(err.code === 'EADDRINUSE' || err.code === 'EACCES');
      })
      .once('listening', () => {
        server.close(() => resolve(false));
      })
      // No host: bind to :: / 0.0.0.0 — matches the real server.
      .listen({ port });
  });
}

// Ask the OS for a free ephemeral port. The kernel keeps these unique,
// so collisions are far less likely than random sampling.
function getEphemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

async function getRandomPort(): Promise<number> {
  const MAX_ATTEMPTS = 100;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const port = await getEphemeralPort();
    if (reservedPorts.has(port)) continue;
    if (await isPortInUse(port)) continue;

    reservedPorts.add(port);
    return port;
  }

  throw new Error('Unable to find an available port after multiple attempts');
}

export const net = { isPortInUse, getRandomPort };
