import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const portable = fileURLToPath(new URL('../.tools/gitleaks/gitleaks.exe', import.meta.url));
const executable = existsSync(portable) ? portable : 'gitleaks';
for (const args of [['git', '--redact', '--no-banner'], ['dir', '.', '--redact', '--no-banner']]) {
  const result = spawnSync(executable, args, { stdio: 'inherit', shell: false });
  if (result.error) {
    console.error('Install gitleaks from https://github.com/gitleaks/gitleaks/releases and add it to PATH, then rerun npm run secrets:scan.');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
