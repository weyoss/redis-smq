# End-to-end tests

## TODO

- Only Chromium runs. Firefox and WebKit projects
  are trivial to add (`projects` array in `playwright.config.ts`) if
  cross-browser coverage becomes a requirement.
- The API has no auth; if that changes, every test needs a
  login fixture.
- Full-stack coverage (queues, messages, exchanges, configuration
  interactions).

## Prerequisites

1. **Chromium browser** — install once per machine:

   ```bash
   pnpm -F redis-smq-web-ui-refactor exec playwright install chromium
   ```

2. **`redis-server` on PATH** — `scripts/dev.js` starts a Redis instance
   for the API server. On macOS: `brew install redis`. On Debian/Ubuntu:
   `sudo apt install redis-server`. On Windows: use WSL2 or a Docker
   Redis.

3. **Ports 5173 free** — the config assumes Vite's default port. If you
   have a dev server running on it, Playwright's `webServer` reuses it
   (see below).

## Running

From the package root:

```bash
pnpm -F redis-smq-web-ui-refactor test:e2e
```

The config has a `webServer` block that runs `node scripts/dev.js`
automatically — Redis + REST API + Vite all start, tests run, everything
shuts down. **You do not need to run `pnpm dev` in another terminal.**

If you _are_ already running `pnpm dev`, `reuseExistingServer: true`
detects the running Vite and skips the auto-start. Faster iteration, but
the API server is whatever your existing dev session started.

Interactive UI (recommended for debugging):

```bash
pnpm -F redis-smq-web-ui-refactor exec playwright test --ui
```

Single test:

```bash
pnpm -F redis-smq-web-ui-refactor exec playwright test -g "404"
```

Single file, headed:

```bash
pnpm -F redis-smq-web-ui-refactor exec playwright test tests/e2e/smoke.spec.ts --headed
```

## How `webServer` works

`playwright.config.ts`:

```ts
webServer: {
  command: 'node scripts/dev.js',
  port: 5173,
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
},
```

- `command` uses `node scripts/dev.js` directly, not `pnpm dev`.
  Reason: `pnpm` doesn't reliably forward `SIGTERM` to grandchildren on
  all platforms. `node` direct + `dev.js`'s signal cascade means Ctrl+C
  in Playwright kills both Vite and the API server cleanly.
- `port: 5173` — Playwright waits for that port before running tests.
  `dev.js` writes `.env.local` before Vite starts, so the API URL is
  already correct by the time tests hit the page.
- `reuseExistingServer: !CI` — locally, if `5173` is already responding,
  Playwright skips its own `webServer`. On CI it always starts fresh,
  so tests never race a stray dev server.

## Artifacts

Failures produce:

- `test-results/` — screenshots, videos, traces for the failing test.
- `playwright-report/` — HTML report (open with
  `pnpm exec playwright show-report`).

Both are gitignored. On CI, `reporter: 'html'` means the report is
published as a build artifact (see your CI config).

Trace on retry: `trace: 'on-first-retry'`. Locally, `retries: 0`, so
traces don't get recorded unless you change `retries` or pass
`--trace on`:

```bash
pnpm -F redis-smq-web-ui-refactor exec playwright test --trace on
```

## Writing a new test

Keep tests in `tests/e2e/`. Name the file `<feature>.spec.ts` — `smoke`
is reserved for the route-render checks.

Minimal shape:

```ts
import { test, expect } from '@playwright/test';

test.describe('queue detail', () => {
  test('renders stats and config for an existing queue', async ({ page }) => {
    // Arrange: create a queue via the UI so the test is self-contained
    await page.goto('/queues');
    // ...create or assume a queue exists

    // Act
    await page.goto('/ns/prod/queues/my-queue');

    // Assert
    await expect(page.locator('h1')).toContainText('Queue: my-queue@prod');
    await expect(page.getByText('Message statistics')).toBeVisible();
  });
});
```

**Two rules to keep the suite fast and non-flaky:**

1. **No shared state across tests.** Each test creates the data it needs
   or navigates to a URL that doesn't depend on other tests. Parallelism
   isn't enabled today (`workers: 1`) but that shouldn't become a
   prerequisite for adding a test.
2. **Prefer role + text selectors** (`getByRole`, `getByText`,
   `getByLabel`) over CSS classes. Class-based selectors break when the
   primitives are refactored, which is exactly what this package is
   prone to.

If you need a queue with consumers or a specific operational state,
use the API directly from the test (`page.request.post('/api/queues',
{ data: {...} })`) rather than clicking through the UI. The API base URL
is in `.env.local`; you can read it via `process.env.VITE_API_URL` in
the test process if `dev.js` already wrote it, or hardcode it against
the fixed `dev.js` port from the test's `baseURL`-relative request.

## CI

`process.env.CI` triggers:

- `forbidOnly: true` — a stray `test.only` fails the build.
- `retries: 2` — flaky network hiccups retry twice before failing.
- `workers: 1` — tests run serially.
- `reuseExistingServer: false` — `webServer` always starts fresh.
- `headless: true` — no display required.

Two things CI must provide:

1. **Chromium installed.** Most Playwright Docker images bundle it. If
   you're on a bare runner, add `pnpm exec playwright install --with-deps
chromium` as a pre-test step.
2. **`redis-server` on PATH.** Otherwise `dev.js` → `run-api-server.js`
   → `RedisServer` can't start the API, and `webServer` times out.

If your CI can't run Redis, either:

- Skip `test:e2e` in CI for now and keep it local-only (the seven
  assertions aren't load-bearing enough to justify a container).
- Or replace `webServer.command` with `node scripts/run-api-server.js &
vite` if you don't need a clean shutdown — not recommended, leaves
  orphans on failed tests.

## Debugging a failed CI run

1. Download the `playwright-report/` artifact from the CI job.
2. `pnpm exec playwright show-report path/to/report`
3. For a specific test, open the trace: it shows every action, network
   request, and DOM snapshot on that step. This is usually enough to see
   _why_ an assertion failed without re-running.
