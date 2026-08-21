import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'backend/package.json',
  'frontend/package.json',
  'backend/.env.example',
  'frontend/.env.example',
  'docs/RELEASE_CHECKLIST.md'
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) {
    console.error(`Release check failed: missing ${file}`);
    process.exit(1);
  }
}

const steps = [
  { label: 'Backend tests', cwd: 'backend', args: ['test'] },
  { label: 'Frontend production build', cwd: 'frontend', args: ['run', 'build'] }
];

for (const step of steps) {
  console.log(`\n==> ${step.label}`);
  const result = spawnSync('npm', step.args, {
    cwd: resolve(root, step.cwd),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) {
    console.error(`Could not start ${step.label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${step.label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

console.log('\nAutomated release checks passed. Complete the manual checklist in docs/RELEASE_CHECKLIST.md before deployment.');
