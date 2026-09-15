/** Confirma duas instalações determinísticas sem depender de worktrees irmãos. */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const workspace = mkdtempSync(join(tmpdir(), 'max-components-npm-ci-'));

try {
    for (let run = 1; run <= 2; run += 1) {
        const checkout = join(workspace, `checkout-${run}`);
        mkdirSync(checkout, { recursive: true });
        cpSync(join(root, 'package.json'), join(checkout, 'package.json'), { force: true });
        cpSync(join(root, 'package-lock.json'), join(checkout, 'package-lock.json'), { force: true });
        if (existsSync(join(root, '.npmrc'))) cpSync(join(root, '.npmrc'), join(checkout, '.npmrc'), { force: true });
        execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: checkout, stdio: 'inherit' });
        console.log(`✓ npm ci reprodutível ${run}/2 em checkout limpo.`);
    }
} finally {
    rmSync(workspace, { recursive: true, force: true });
}
