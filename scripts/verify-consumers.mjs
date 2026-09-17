/**
 * verify-consumers.mjs
 *
 * Valida todos os entrypoints públicos da biblioteca empacotando via `npm pack`
 * e instalando em projetos consumidores temporários isolados, SEM --legacy-peer-deps.
 *
 * Cenários cobertos:
 *   1. Node ESM sem deps opcionais
 *   2. Node ESM com deps opcionais (unocss)
 *   3. TypeScript (verificação de tipos)
 *   4. Vite consumer (build)
 *   5. SSR — renderização server-side com @vue/server-renderer
 *   6. CSS Global e Temas SCSS compilados via sass
 *   7. Subpath desconhecido deve FALHAR (validação negativa)
 *
 * Suporte a concorrência e testes:
 *   --skip-build / SKIP_BUILD=1: reutiliza dist existente sem recompilar
 *   --force-fail / FORCE_FAIL=1: dispara falha controlada após criar tempDir para validar cleanup em finally
 *   --scenario=<N>: filtra execução por número ordinal ou nome de cenário
 *
 * Integrado ao npm run verify via: npm run verify:consumers
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const projectRoot = process.cwd();
console.log('Diretório do projeto:', projectRoot);

const skipBuild = process.argv.includes('--skip-build') || process.env.SKIP_BUILD === '1';
const forceFail = process.argv.includes('--force-fail') || process.env.FORCE_FAIL === '1';
const scenarioArg = process.argv.find((a) => a.startsWith('--scenario='));
const scenarioFilter = scenarioArg ? scenarioArg.split('=')[1] : process.env.SCENARIO;
const customBaseDir = process.env.CONSUMER_TEMP_DIR || tmpdir();

let tempDir;
let tarballPath;
let cleanedUp = false;
let activeChild;

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const runCommand = (command, args, { cwd, stdio = 'inherit' } = {}) => new Promise((resolve, reject) => {
    const child = spawn(command, args, {
        cwd,
        detached: process.platform !== 'win32',
        stdio: stdio === 'pipe' ? ['ignore', 'pipe', 'pipe'] : stdio
    });
    activeChild = child;

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });

    child.once('error', (error) => {
        if (activeChild === child) activeChild = undefined;
        reject(error);
    });
    child.once('close', (code, signal) => {
        if (activeChild === child) activeChild = undefined;
        if (code === 0) {
            resolve(stdout);
            return;
        }

        const error = new Error(`Comando ${command} falhou com código ${code ?? 'nulo'}${signal ? ` e sinal ${signal}` : ''}.`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
    });
});

const terminateActiveChild = (signal) => {
    if (!activeChild?.pid || activeChild.killed) return;
    try {
        if (process.platform === 'win32') activeChild.kill(signal);
        else process.kill(-activeChild.pid, signal);
    } catch {
        // O processo pode ter encerrado entre a verificação e o envio do sinal.
    }
};

// ───── Versões compatíveis com pinia@^4.0.2 (que requer vue@^3.5.11) ─────
const VUE_VERSION = '^3.5.11';
const PINIA_VERSION = '^4.0.2';
const VUE_ROUTER_VERSION = '^5.2.0';
const UNOCSS_VERSION = '^66.0.0';

let exitCode = 0;

const cleanup = () => {
    if (cleanedUp) return;
    if (tempDir && existsSync(tempDir)) {
        try {
            rmSync(tempDir, { recursive: true, force: true });
            console.log('Diretório temporário removido:', tempDir);
        } catch {
            // Silencioso se já tiver sido removido
        }
    }
    cleanedUp = true;
};

process.on('SIGINT', () => {
    console.log('\n[verify-consumers] Interrupção SIGINT recebida.');
    terminateActiveChild('SIGINT');
    cleanup();
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n[verify-consumers] Interrupção SIGTERM recebida.');
    terminateActiveChild('SIGTERM');
    cleanup();
    process.exit(143);
});

process.on('exit', () => {
    cleanup();
});

try {
    if (!skipBuild) {
        console.log('\n--- Executando build fresco obrigatório ---');
        await runCommand(npmCommand, ['run', 'build'], { cwd: projectRoot });
    } else {
        console.log('\n--- Reutilizando build fresco existente (--skip-build / SKIP_BUILD=1) ---');
    }

    tempDir = mkdtempSync(join(customBaseDir, `max-consumer-${process.pid}-`));
    console.log('Diretório temporário exclusivo por PID:', tempDir);

    if (forceFail) {
        throw new Error('Falha forçada controlada para teste de cleanup (--force-fail / FORCE_FAIL=1)');
    }

    console.log('\n--- Empacotando projeto com npm pack no diretório isolado ---');
    const packOutput = await runCommand(npmCommand, ['pack', '--pack-destination', tempDir], { cwd: projectRoot, stdio: 'pipe' });
    const tarballName = packOutput.trim().split('\n').pop().trim();
    tarballPath = join(tempDir, tarballName);
    console.log('Tarball isolado criado:', tarballPath);

    /**
     * Executa um cenário de teste isolado.
     * @param {string} name  - Nome descritivo do cenário
     * @param {(dir: string) => void} script - Função de teste
     * @param {number} [scenarioNum] - Número ordinal do cenário
     */
    const runTest = async (name, script, scenarioNum) => {
        if (scenarioFilter) {
            const matchesNum = scenarioNum !== undefined && String(scenarioNum) === String(scenarioFilter);
            const matchesName = name.toLowerCase().includes(scenarioFilter.toLowerCase());
            if (!matchesNum && !matchesName) {
                console.log(`\n--- Pulando cenário [${scenarioNum ?? '-'}] ${name} (filtro ativo: ${scenarioFilter}) ---`);
                return;
            }
        }
        console.log(`\n--- Testando: ${name} ---`);
        const dir = join(tempDir, name.replace(/[/ ]/g, '_'));
        mkdirSync(dir, { recursive: true });
        await runCommand(npmCommand, ['init', '-y'], { cwd: dir, stdio: 'ignore' });
        await script(dir);
        console.log(`✅ ${name} — OK\n`);
    };

    // ─── Cenário 1: Node ESM sem deps opcionais ────────────────────────────
    await runTest('Node ESM sem deps opcionais', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import '@maxvue/max-components-ui/styles';
            if (!UI.MaxButton) throw new Error('MaxButton ausente no entrypoint raiz.');
            console.log('ESM sem deps opcionais — OK');
        `);
        await runCommand(process.execPath, ['index.js'], { cwd: dir });
    }, 1);

    // ─── Cenário 2: Node ESM com deps opcionais (unocss) ──────────────────
    await runTest('Node ESM com deps opcionais', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`, `unocss@${UNOCSS_VERSION}`
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import { presetMaxUno } from '@maxvue/max-components-ui/preset';
            import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';
            import '@maxvue/max-components-ui/styles';

            if (!UI.MaxButton) throw new Error('MaxButton ausente.');
            if (typeof presetMaxUno !== 'function') throw new Error('presetMaxUno inválido.');
            if (typeof MaxComponentsUiResolver !== 'function') throw new Error('MaxComponentsUiResolver inválido.');
            console.log('ESM com deps opcionais — OK');
        `);
        await runCommand(process.execPath, ['index.js'], { cwd: dir });
    }, 2);

    // ─── Cenário 3: TypeScript Consumer ────────────────────────────────────
    await runTest('TypeScript Consumer', async (dir) => {
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', 'typescript', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`,
            `unocss@${UNOCSS_VERSION}`, '@vueuse/core', 'unplugin-vue-components'
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                moduleResolution: 'bundler',
                target: 'esnext',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
            },
        }, null, 2));
        writeFileSync(join(dir, 'index.ts'), `
            import { MaxButton } from '@maxvue/max-components-ui';
            import { useModalStore } from '@maxvue/max-components-ui/stores';
            import { presetMaxUno } from '@maxvue/max-components-ui/preset';
            import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';

            // Garante que os tipos estão presentes
            const _btn: typeof MaxButton = MaxButton;
            const _store = useModalStore;
            const _preset = presetMaxUno;
            const _resolver = MaxComponentsUiResolver;
        `);
        await runCommand(npxCommand, ['tsc', '--noEmit'], { cwd: dir });
    }, 3);

    // ─── Cenário 4: Vite Consumer ───────────────────────────────────────────
    await runTest('Vite Consumer', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`,
            'vite', `unocss@${UNOCSS_VERSION}`
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.html'), '<div id="app"></div><script type="module" src="/main.js"></script>');
        writeFileSync(join(dir, 'main.js'), `
            import { createApp } from 'vue';
            import { MaxButton } from '@maxvue/max-components-ui';
            import granularBtn from '@maxvue/max-components-ui/components/MaxButton';
            import '@maxvue/max-components-ui/style.css';

            console.log('Vite import ok', MaxButton, granularBtn);
        `);
        writeFileSync(join(dir, 'vite.config.js'), `
            export default {
                build: {
                    rollupOptions: {
                        external: ['vue'],
                    },
                },
            };
        `);
        await runCommand(npxCommand, ['vite', 'build'], { cwd: dir });
    }, 4);

    // ─── Cenário 5: SSR Consumer ────────────────────────────────────────────
    await runTest('SSR Consumer', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`,
            '@vue/server-renderer'
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.js'), `
            import { createSSRApp } from 'vue';
            import { renderToString } from '@vue/server-renderer';
            import { MaxButton } from '@maxvue/max-components-ui';
            import * as Stores from '@maxvue/max-components-ui/stores';
            import * as Styles from '@maxvue/max-components-ui/styles';

            // Valida que os módulos são importáveis em contexto SSR (Node.js puro)
            if (!MaxButton) throw new Error('SSR: MaxButton ausente.');
            if (!Stores.useToastStore) throw new Error('SSR: Stores ausentes.');
            if (!Styles.MaxStyle) throw new Error('SSR: MaxStyle ausente.');

            const app = createSSRApp({
                components: { MaxButton },
                template: \`<MaxButton>Test</MaxButton>\`,
            });

            renderToString(app).then(html => {
                if (!html.includes('button')) {
                    throw new Error('SSR: renderização falhou — botão não encontrado no HTML.');
                }
                console.log('SSR renderizou:', html.slice(0, 80));
                console.log('SSR OK');
            }).catch(err => {
                console.error('Erro SSR:', err);
                process.exit(1);
            });
        `);
        await runCommand(process.execPath, ['index.js'], { cwd: dir });
    }, 5);

    // ─── Cenário 6: CSS Global e Temas SCSS ─────────────────────────────────
    await runTest('CSS Global e Temas SCSS Consumer', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`, 'sass'
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import { readFileSync, existsSync } from 'node:fs';
            import { resolve, dirname } from 'node:path';
            import * as sass from 'sass';

            if (!UI.MaxButton) throw new Error('MaxButton ausente.');
            const cssPath = resolve('node_modules/@maxvue/max-components-ui/dist/style.css');
            if (!existsSync(cssPath)) throw new Error('dist/style.css não encontrado no pacote instalado.');
            const cssContent = readFileSync(cssPath, 'utf-8');
            if (!cssContent.includes('.max-button') && !cssContent.includes('--max-primary-')) {
                throw new Error('Conteúdo de dist/style.css inválido ou vazio.');
            }

            const themePath = resolve('node_modules/@maxvue/max-components-ui/dist/themes/all.scss');
            if (!existsSync(themePath)) throw new Error('Tema all.scss não encontrado no pacote instalado.');

            // Validação compilando o tema SCSS diretamente via sass.compile
            const compiledTheme = sass.compile(themePath);
            if (!compiledTheme.css.includes('--max-primary-500') || !compiledTheme.css.includes('--background-0')) {
                throw new Error('Tema compilado via sass não contém tokens semânticos esperados (--max-primary-500).');
            }

            // Validação compilando regras SCSS do consumidor que importam all.scss
            const consumerScss = \`
                @use "all.scss";
                .consumer-button {
                    background-color: var(--max-primary-500);
                }
            \`;
            const compiledConsumer = sass.compileString(consumerScss, {
                loadPaths: [dirname(themePath)]
            });
            if (!compiledConsumer.css.includes('.consumer-button') || !compiledConsumer.css.includes('--max-primary-500')) {
                throw new Error('Compilação SCSS de regra do consumidor falhou.');
            }

            console.log('CSS e Temas SCSS (compilados com sucesso via sass) — OK');
        `);
        await runCommand(process.execPath, ['index.js'], { cwd: dir });
    }, 6);

    // ─── Cenário 7: Subpath desconhecido deve FALHAR ────────────────────────
    // Validação negativa: import de caminho inexistente deve lançar erro.
    await runTest('Subpath desconhecido deve falhar', async (dir) => {
        await runCommand(npmCommand, ['pkg', 'set', 'type=module'], { cwd: dir, stdio: 'ignore' });
        await runCommand(npmCommand, [
            'install', '--no-audit', '--no-fund', tarballPath,
            `vue@${VUE_VERSION}`, `pinia@${PINIA_VERSION}`, `vue-router@${VUE_ROUTER_VERSION}`
        ], { cwd: dir, stdio: 'pipe' });
        writeFileSync(join(dir, 'index.js'), `
            // Este import DEVE falhar — subpath inexistente não deve ser resolvido.
            try {
                await import('@maxvue/max-components-ui/inexistente');
                console.error('FALHA: subpath inexistente foi resolvido — não deveria!');
                process.exit(1);
            } catch (err) {
                if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || err.code === 'MODULE_NOT_FOUND' || err.code === 'ERR_MODULE_NOT_FOUND') {
                    console.log('Subpath desconhecido corretamente rejeitado com:', err.code);
                } else {
                    console.error('Erro inesperado ao importar subpath desconhecido:', err.message);
                    process.exit(1);
                }
            }
        `);
        await runCommand(process.execPath, ['index.js'], { cwd: dir });
    }, 7);

    console.log('\n✅ --- Todos os cenários de validação passaram com sucesso ---\n');

} catch (err) {
    console.error('\n❌ Validação falhou:', err.message);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    exitCode = 1;
} finally {
    // Cleanup garantido mesmo em caso de falha antes de qualquer exit
    console.log('\n--- Limpando arquivos temporários ---');
    cleanup();
}

if (exitCode !== 0) {
    process.exit(exitCode);
}
