import { spawnSync } from 'node:child_process';

if (!process.env.CI) {
  const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'pipe' });
  if (result.status !== 0) console.warn('Hook setup skipped. Run: git config core.hooksPath .githooks');
}
