import { defineConfig, devices } from '@playwright/test';

const snapshotChannel = process.env.SNAPSHOT_CHANNEL ?? 'product';
const isSnapshotUpdate = process.argv.some((arg) => arg.startsWith('--update-snapshots'));

if (!/^[a-z0-9-]+$/.test(snapshotChannel)) {
  throw new Error('SNAPSHOT_CHANNEL must use only lowercase letters, numbers, and hyphens.');
}

if (process.env.CI && isSnapshotUpdate && !process.env.ALLOW_SNAPSHOT_UPDATE) {
  throw new Error('Snapshot updates are blocked in CI. Update snapshots locally and commit them.');
}

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: `{testDir}/{testFilePath}-snapshots/{arg}-${snapshotChannel}-{projectName}{ext}`,
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
