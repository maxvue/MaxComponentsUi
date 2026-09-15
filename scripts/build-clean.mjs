import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// `dist` nunca pode sobreviver ao início de uma verificação de distribuição.
rmSync('dist', { recursive: true, force: true });
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
