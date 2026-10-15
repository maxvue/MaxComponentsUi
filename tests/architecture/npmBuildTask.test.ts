import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const projectRoot = path.resolve(__dirname, '../../');
const tmpBaseDir = path.resolve(projectRoot, '.execution-tmp');

interface MinimalPackageJson {
    name: string;
    version: string;
    scripts?: Record<string, string>;
}

interface MinimalPackageLockJson {
    name: string;
    version: string;
    lockfileVersion: number;
    requires?: boolean;
    packages: Record<string, {
        name?: string;
        version: string;
        scripts?: Record<string, string>;
    }>;
}

function createFixture(fixtureName: string, initialVersion = '1.1.2', customScripts?: Record<string, string>) {
    if (!fs.existsSync(tmpBaseDir)) fs.mkdirSync(tmpBaseDir, { recursive: true });

    const fixtureDir = path.join(tmpBaseDir, `${fixtureName}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(fixtureDir, { recursive: true });

    const scripts: Record<string, string> = customScripts || {
        build: 'node -e "const fs = require(\'node:fs\'); fs.writeFileSync(\'build-ran.txt\', require(\'./package.json\').version);"'
    };

    const pkg: MinimalPackageJson = {
        name: 'test-fixture-pkg',
        version: initialVersion,
        scripts
    };

    const lock: MinimalPackageLockJson = {
        name: 'test-fixture-pkg',
        version: initialVersion,
        lockfileVersion: 3,
        requires: true,
        packages: {
            '': {
                name: 'test-fixture-pkg',
                version: initialVersion,
                scripts
            }
        }
    };

    fs.writeFileSync(path.join(fixtureDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    fs.writeFileSync(path.join(fixtureDir, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');

    return {
        fixtureDir,
        cleanup: () => {
            if (fs.existsSync(fixtureDir)) fs.rmSync(fixtureDir, { recursive: true, force: true });
        }
    };
}

function runShellInFixture(fixtureDir: string, command: string) {
    const env = {
        ...process.env,
        npm_config_cache: path.join(fixtureDir, '.npm-cache'),
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        npm_config_update_notifier: 'false',
        npm_config_offline: 'true'
    };

    return cp.spawnSync('bash', ['-c', command], {
        cwd: fixtureDir,
        env,
        encoding: 'utf8',
        timeout: 10000
    });
}

describe('R1–R6: Contrato Estático da Tarefa de Build (.vscode/tasks.json)', () => {
    it('existe uma tarefa inequívoca de build com o rótulo NPM RUN BUILD preservado', () => {
        const tasksPath = path.resolve(projectRoot, '.vscode/tasks.json');
        expect(fs.existsSync(tasksPath)).toBe(true);

        const tasksContent = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        const buildTask = tasksContent.tasks.find((t: { label: string }) => t.label === 'NPM RUN BUILD');

        expect(buildTask).toBeDefined();
        expect(buildTask.type).toBe('shell');
        expect(buildTask.isBackground).toBe(false);
    });

    it('os dois primeiros segmentos shell são versionamento com flags estritas e npm run build', () => {
        const tasksPath = path.resolve(projectRoot, '.vscode/tasks.json');
        const tasksContent = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        const buildTask = tasksContent.tasks.find((t: { label: string }) => t.label === 'NPM RUN BUILD');

        const segments = buildTask.command.split('&&').map((s: string) => s.trim());

        expect(segments[0]).toBe('npm version patch --no-git-tag-version --ignore-scripts');
        expect(segments[1]).toBe('npm run build');
    });

    it('o sufixo de notificações/som e as opções da tarefa permanecem preservados do baseline', () => {
        const tasksPath = path.resolve(projectRoot, '.vscode/tasks.json');
        const tasksContent = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        const buildTask = tasksContent.tasks.find((t: { label: string }) => t.label === 'NPM RUN BUILD');

        const segments = buildTask.command.split('&&').map((s: string) => s.trim());
        expect(segments).toHaveLength(4);
        expect(segments[2]).toBe('notify-send \'VS Code\' \'✅ MAX COMPONENTS UI - Build, Commit e Push realizados!\' -i software-update-available');
        expect(segments[3]).toBe('paplay /usr/share/sounds/freedesktop/stereo/service-login.oga');

        expect(buildTask.presentation).toEqual({
            reveal: 'silent',
            panel: 'new',
            focus: false,
            clear: true,
            close: true
        });

        expect(buildTask.options?.statusbar).toEqual({
            label: '✅ BUILD, COMMIT & PUSH',
            hide: false
        });
    });

    it('scripts.build em package.json não recebeu incremento e não foi criado prebuild/preversion', () => {
        const pkgPath = path.resolve(projectRoot, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        expect(pkg.scripts.build).toBe('vue-tsc && vite build');
        expect(pkg.scripts.prebuild).toBeUndefined();
        expect(pkg.scripts.preversion).toBeUndefined();
        expect(pkg.scripts.version).toBeUndefined();
        expect(pkg.scripts.postversion).toBeUndefined();
    });

    it('a tarefa NPM RUN RELEASE e o script release permanecem com seu encadeamento original intacto', () => {
        const tasksPath = path.resolve(projectRoot, '.vscode/tasks.json');
        const tasksContent = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
        const releaseTask = tasksContent.tasks.find((t: { label: string }) => t.label === 'NPM RUN RELEASE');

        expect(releaseTask).toBeDefined();
        expect(releaseTask.command).toBe(
            'npm run build && git add . && git commit -m \'feat: atualizando componentes\' && npm run release && notify-send \'VS Code\' \'🚀 MAX COMPONENTS UI - Release enviado com sucesso!\' -i software-update-available && paplay /usr/share/sounds/freedesktop/stereo/service-login.oga'
        );

        const pkgPath = path.resolve(projectRoot, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        expect(pkg.scripts.release).toBe(
            'npm run verify && npm version patch -m \'Upgrade to %s\' && git push origin main --follow-tags && npm publish --access public'
        );
    });
});

describe('R1–R5: Integração do Prefixo da Tarefa em Fixtures Isoladas', () => {
    it('avança unitariamente 1.1.2 -> 1.1.3 -> 1.1.4 sincronizando os 3 campos e o stub lê nova versão (R1 e R2)', () => {
        const fixture = createFixture('test-r1-r2-consecutive');
        try {
            const command = 'npm version patch --no-git-tag-version --ignore-scripts && npm run build';

            // Primeira execução: 1.1.2 -> 1.1.3
            const res1 = runShellInFixture(fixture.fixtureDir, command);
            expect(res1.status).toBe(0);

            const pkg1: MinimalPackageJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package.json'), 'utf8'));
            const lock1: MinimalPackageLockJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package-lock.json'), 'utf8'));
            const buildRan1 = fs.readFileSync(path.join(fixture.fixtureDir, 'build-ran.txt'), 'utf8');

            expect(pkg1.version).toBe('1.1.3');
            expect(lock1.version).toBe('1.1.3');
            expect(lock1.packages[''].version).toBe('1.1.3');
            expect(buildRan1).toBe('1.1.3');

            // Segunda execução: 1.1.3 -> 1.1.4
            const res2 = runShellInFixture(fixture.fixtureDir, command);
            expect(res2.status).toBe(0);

            const pkg2: MinimalPackageJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package.json'), 'utf8'));
            const lock2: MinimalPackageLockJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package-lock.json'), 'utf8'));
            const buildRan2 = fs.readFileSync(path.join(fixture.fixtureDir, 'build-ran.txt'), 'utf8');

            expect(pkg2.version).toBe('1.1.4');
            expect(lock2.version).toBe('1.1.4');
            expect(lock2.packages[''].version).toBe('1.1.4');
            expect(buildRan2).toBe('1.1.4');
        } finally {
            fixture.cleanup();
        }
    });

    it('avança caso extremo de 1.1.9 para 1.1.10 sem alterar major/minor (R1 extremos)', () => {
        const fixture = createFixture('test-r1-extreme', '1.1.9');
        try {
            const command = 'npm version patch --no-git-tag-version --ignore-scripts && npm run build';
            const res = runShellInFixture(fixture.fixtureDir, command);
            expect(res.status).toBe(0);

            const pkg: MinimalPackageJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package.json'), 'utf8'));
            const lock: MinimalPackageLockJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package-lock.json'), 'utf8'));

            expect(pkg.version).toBe('1.1.10');
            expect(lock.version).toBe('1.1.10');
            expect(lock.packages[''].version).toBe('1.1.10');
        } finally {
            fixture.cleanup();
        }
    });

    it('não executa hooks preversion/version/postversion devido a --ignore-scripts (R3)', () => {
        const fixture = createFixture('test-r3-ignore-scripts', '1.1.2', {
            preversion: 'node -e "require(\'node:fs\').writeFileSync(\'preversion-ran.txt\', \'ran\')"',
            version: 'node -e "require(\'node:fs\').writeFileSync(\'version-ran.txt\', \'ran\')"',
            postversion: 'node -e "require(\'node:fs\').writeFileSync(\'postversion-ran.txt\', \'ran\')"',
            build: 'node -e "require(\'node:fs\').writeFileSync(\'build-ran.txt\', \'ran\')"'
        });

        try {
            const command = 'npm version patch --no-git-tag-version --ignore-scripts && npm run build';
            const res = runShellInFixture(fixture.fixtureDir, command);
            expect(res.status).toBe(0);

            expect(fs.existsSync(path.join(fixture.fixtureDir, 'preversion-ran.txt'))).toBe(false);
            expect(fs.existsSync(path.join(fixture.fixtureDir, 'version-ran.txt'))).toBe(false);
            expect(fs.existsSync(path.join(fixture.fixtureDir, 'postversion-ran.txt'))).toBe(false);
            expect(fs.existsSync(path.join(fixture.fixtureDir, 'build-ran.txt'))).toBe(true);
        } finally {
            fixture.cleanup();
        }
    });

    it('interrompe o encadeamento e não executa o build quando o versionamento falha (R5)', () => {
        const fixture = createFixture('test-r5-version-fail', 'invalid-semver');
        try {
            const command = 'npm version patch --no-git-tag-version --ignore-scripts && npm run build';
            const res = runShellInFixture(fixture.fixtureDir, command);

            expect(res.status).not.toBe(0);
            expect(fs.existsSync(path.join(fixture.fixtureDir, 'build-ran.txt'))).toBe(false);
        } finally {
            fixture.cleanup();
        }
    });

    it('mantém versão incrementada e bloqueia etapas seguintes quando o build falha (R5)', () => {
        const fixture = createFixture('test-r5-build-fail', '1.1.2', {
            build: 'node -e "process.exit(13)"'
        });

        try {
            const command = 'npm version patch --no-git-tag-version --ignore-scripts && npm run build && node -e "require(\'node:fs\').writeFileSync(\'success-marker.txt\', \'ok\')"';
            const res = runShellInFixture(fixture.fixtureDir, command);

            expect(res.status).toBe(13);
            expect(fs.existsSync(path.join(fixture.fixtureDir, 'success-marker.txt'))).toBe(false);

            const pkg: MinimalPackageJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package.json'), 'utf8'));
            const lock: MinimalPackageLockJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package-lock.json'), 'utf8'));

            expect(pkg.version).toBe('1.1.3');
            expect(lock.version).toBe('1.1.3');
            expect(lock.packages[''].version).toBe('1.1.3');
        } finally {
            fixture.cleanup();
        }
    });

    it('build isolado sem o prefixo de versionamento não incrementa a versão (R4)', () => {
        const fixture = createFixture('test-r4-pure-build', '1.1.2');
        try {
            const command = 'npm run build';
            const res = runShellInFixture(fixture.fixtureDir, command);
            expect(res.status).toBe(0);

            const pkg: MinimalPackageJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package.json'), 'utf8'));
            const lock: MinimalPackageLockJson = JSON.parse(fs.readFileSync(path.join(fixture.fixtureDir, 'package-lock.json'), 'utf8'));

            expect(pkg.version).toBe('1.1.2');
            expect(lock.version).toBe('1.1.2');
            expect(lock.packages[''].version).toBe('1.1.2');
        } finally {
            fixture.cleanup();
        }
    });
});
