import { spawnSync } from 'node:child_process';

if (process.env.CI) {
  console.error('Snapshot updates are blocked in CI. Update snapshots locally and commit them.');
  process.exit(1);
}

const snapshotChannel = process.env.SNAPSHOT_CHANNEL ?? 'product';

if (!/^[a-z0-9-]+$/.test(snapshotChannel)) {
  console.error('SNAPSHOT_CHANNEL must use only lowercase letters, numbers, and hyphens.');
  process.exit(1);
}

const result = spawnSync('npx', ['playwright', 'test', '--update-snapshots'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    SNAPSHOT_CHANNEL: snapshotChannel,
  },
});

if (result.error) {
  console.error('Failed to spawn playwright:', result.error.message);
  process.exit(1);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
