import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const projectRoot = path.resolve(__dirname, '../../');
const fixtureRoot = path.join(projectRoot, '.vitest-attachments');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
};

interface Fixture {
    directory: string;
    logPath: string;
    cleanup: () => void;
}

function createFixture(): Fixture {
    fs.mkdirSync(fixtureRoot, { recursive: true });
    const directory = fs.mkdtempSync(path.join(fixtureRoot, 'test-command-'));
    const logPath = path.join(directory, 'calls.jsonl');
    const buildPath = path.join(directory, 'build.cjs');
    const vitestPath = path.join(directory, 'vitest.cjs');
    const fixturePackage = {
        name: 'test-command-contract-fixture',
        version: '1.0.0',
        scripts: {
            build: `node ${JSON.stringify(buildPath)}`,
            'test:built': `node ${JSON.stringify(vitestPath)}`,
            test: packageJson.scripts.test
        }
    };

    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(fixturePackage, null, 2));
    fs.writeFileSync(buildPath, [
        'const fs = require(\'node:fs\');',
        'const logPath = process.env.TEST_COMMAND_LOG;',
        'fs.appendFileSync(logPath, JSON.stringify({ command: \'build\', args: process.argv.slice(2) }) + \'\\n\');',
        'fs.writeFileSync(\'dist-artifact.txt\', \'fresh\');',
        'process.exit(Number(process.env.TEST_BUILD_EXIT || 0));'
    ].join('\n'));
    fs.writeFileSync(vitestPath, [
        'const fs = require(\'node:fs\');',
        'const logPath = process.env.TEST_COMMAND_LOG;',
        'fs.appendFileSync(logPath, JSON.stringify({ command: \'vitest\', args: process.argv.slice(2) }) + \'\\n\');',
        'if (!fs.existsSync(\'dist-artifact.txt\')) process.exit(41);',
        'process.exit(Number(process.env.TEST_VITEST_EXIT || 0));'
    ].join('\n'));

    return {
        directory,
        logPath,
        cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
    };
}

function runNpm(fixture: Fixture, args: string[], extraEnv: Record<string, string> = {}) {
    return cp.spawnSync('npm', args, {
        cwd: fixture.directory,
        env: {
            ...process.env,
            TEST_COMMAND_LOG: fixture.logPath,
            npm_config_audit: 'false',
            npm_config_fund: 'false',
            ...extraEnv
        },
        encoding: 'utf8',
        timeout: 15000
    });
}

function readCalls(fixture: Fixture): Array<{ command: string; args: string[] }> {
    if (!fs.existsSync(fixture.logPath)) return [];
    return fs.readFileSync(fixture.logPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

describe('Contrato dos comandos públicos de teste', () => {
    it('npm test constrói antes dos testes, inclusive com artefato anterior, e encaminha opções ao Vitest', () => {
        const fixture = createFixture();
        try {
            const result = runNpm(fixture, ['test', '--', '--reporter=dot', 'tests/example.test.ts']);
            expect(result.status).toBe(0);
            expect(readCalls(fixture)).toEqual([
                { command: 'build', args: [] },
                { command: 'vitest', args: ['--reporter=dot', 'tests/example.test.ts'] }
            ]);

            fs.writeFileSync(path.join(fixture.directory, 'dist-artifact.txt'), 'stale');
            const staleResult = runNpm(fixture, ['test']);
            expect(staleResult.status).toBe(0);
            expect(readCalls(fixture).map((call) => call.command)).toEqual(['build', 'vitest', 'build', 'vitest']);
        } finally {
            fixture.cleanup();
        }
    });

    it('interrompe a cadeia quando o build falha e propaga falha dos testes', () => {
        const buildFixture = createFixture();
        try {
            const buildResult = runNpm(buildFixture, ['test'], { TEST_BUILD_EXIT: '17' });
            expect(buildResult.status).not.toBe(0);
            expect(readCalls(buildFixture).map((call) => call.command)).toEqual(['build']);
        } finally {
            buildFixture.cleanup();
        }

        const testFixture = createFixture();
        try {
            const testResult = runNpm(testFixture, ['test'], { TEST_VITEST_EXIT: '19' });
            expect(testResult.status).not.toBe(0);
            expect(readCalls(testFixture).map((call) => call.command)).toEqual(['build', 'vitest']);
        } finally {
            testFixture.cleanup();
        }
    });

    it('mantém test:built como executor sem build, sem pretest oculto, e verify com um único build e todos os gates na ordem', () => {
        expect(packageJson.scripts['test:built']).toBe('vitest run');
        expect(packageJson.scripts.test).toBe('npm run build && npm run test:built --');
        expect(packageJson.scripts.pretest).toBeUndefined();

        const verifySteps = packageJson.scripts.verify.split(' && ');
        expect(verifySteps).toEqual([
            'npm run check:filenames',
            'npm run check:lockfile',
            'npm run optimize:svg:check',
            'npm run type-check',
            'npm run type-check:test',
            'npm run lint:check',
            'npm run build',
            'npm run test:built',
            'npm run test:coverage',
            'npm run test:browser',
            'npm run check:playground:bundle',
            'npm run test:benchmark',
            'npm run verify:consumers',
            'npm run check:npm-tree',
            'npm run check:audit'
        ]);
        expect(verifySteps.filter((step) => step === 'npm run build')).toHaveLength(1);
        expect(verifySteps).not.toContain('npm run test');
    });

    it('documenta a pré-condição dos executores que não preparam a distribuição', () => {
        const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
        expect(readme).toContain('`npm test`');
        expect(readme).toContain('`npm run test:built`');
        expect(readme).toContain('`npm run test:watch`');
        expect(readme).toContain('`npm run test:coverage`');
        expect(readme).toContain('`npx vitest`');
        expect(readme).toContain('`npm run verify`');
    });
});
