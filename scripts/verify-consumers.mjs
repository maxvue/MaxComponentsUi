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
 *   6. Subpath desconhecido deve FALHAR (validação negativa)
 *
 * Integrado ao npm run verify via: npm run verify:consumers
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const projectRoot = process.cwd();
console.log('Diretório do projeto:', projectRoot);

let tempDir;
let tarballPath;

// ───── Versões compatíveis com pinia@^4.0.2 (que requer vue@^3.5.11) ─────
const VUE_VERSION = '^3.5.11';
const PINIA_VERSION = '^4.0.2';
const VUE_ROUTER_VERSION = '^5.2.0';
const UNOCSS_VERSION = '^66.0.0';

let exitCode = 0;

try {
    console.log('\n--- Executando build fresco obrigatório ---');
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

    tempDir = mkdtempSync(join(tmpdir(), `max-consumer-${process.pid}-`));
    console.log('Diretório temporário exclusivo por PID:', tempDir);

    console.log('\n--- Empacotando projeto com npm pack no diretório isolado ---');
    const packOutput = execSync(`npm pack --pack-destination "${tempDir}"`, { cwd: projectRoot, encoding: 'utf-8' });
    const tarballName = packOutput.trim().split('\n').pop().trim();
    tarballPath = join(tempDir, tarballName);
    console.log('Tarball isolado criado:', tarballPath);

    /**
     * Executa um cenário de teste isolado.
     * @param {string} name  - Nome descritivo do cenário
     * @param {(dir: string) => void} script - Função de teste
     */
    const runTest = (name, script) => {
        console.log(`\n--- Testando: ${name} ---`);
        const dir = join(tempDir, name.replace(/[/ ]/g, '_'));
        mkdirSync(dir, { recursive: true });
        execSync('npm init -y', { cwd: dir, stdio: 'ignore' });
        script(dir);
        console.log(`✅ ${name} — OK\n`);
    };

    // ─── Cenário 1: Node ESM sem deps opcionais ────────────────────────────
    runTest('Node ESM sem deps opcionais', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}"`,
            { cwd: dir, stdio: 'pipe' }
        );
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import '@maxvue/max-components-ui/styles';
            if (!UI.MaxButton) throw new Error('MaxButton ausente no entrypoint raiz.');
            console.log('ESM sem deps opcionais — OK');
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 2: Node ESM com deps opcionais (unocss) ──────────────────
    runTest('Node ESM com deps opcionais', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}" unocss@"${UNOCSS_VERSION}"`,
            { cwd: dir, stdio: 'pipe' }
        );
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
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 3: TypeScript Consumer ────────────────────────────────────
    runTest('TypeScript Consumer', (dir) => {
        execSync(
            `npm install --no-audit --no-fund typescript "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}" unocss@"${UNOCSS_VERSION}" @vueuse/core unplugin-vue-components`,
            { cwd: dir, stdio: 'pipe' }
        );
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
        execSync('npx tsc --noEmit', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 4: Vite Consumer ───────────────────────────────────────────
    runTest('Vite Consumer', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}" vite unocss@"${UNOCSS_VERSION}"`,
            { cwd: dir, stdio: 'pipe' }
        );
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
        execSync('npx vite build', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 5: SSR Consumer ────────────────────────────────────────────
    // CAUSA DA FALHA ANTERIOR: usar vue@^3.6.0-rc.5 que conflita com
    // pinia@4.0.3 (requer vue@^3.5.11). Corrigido usando vue@^3.5.11.
    runTest('SSR Consumer', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}" @vue/server-renderer`,
            { cwd: dir, stdio: 'pipe' }
        );
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
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 6: CSS Global e Temas SCSS ─────────────────────────────────
    runTest('CSS Global e Temas SCSS Consumer', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}"`,
            { cwd: dir, stdio: 'pipe' }
        );
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import { readFileSync, existsSync } from 'node:fs';
            import { resolve } from 'node:path';

            if (!UI.MaxButton) throw new Error('MaxButton ausente.');
            const cssPath = resolve('node_modules/@maxvue/max-components-ui/dist/style.css');
            if (!existsSync(cssPath)) throw new Error('dist/style.css não encontrado no pacote instalado.');
            const cssContent = readFileSync(cssPath, 'utf-8');
            if (!cssContent.includes('.max-button') && !cssContent.includes('--max-primary-')) {
                throw new Error('Conteúdo de dist/style.css inválido ou vazio.');
            }

            const themePath = resolve('node_modules/@maxvue/max-components-ui/dist/themes/all.scss');
            if (!existsSync(themePath)) throw new Error('Tema all.scss não encontrado no pacote instalado.');
            console.log('CSS e Temas SCSS — OK');
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 7: Subpath desconhecido deve FALHAR ────────────────────────
    // Validação negativa: import de caminho inexistente deve lançar erro.
    runTest('Subpath desconhecido deve falhar', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(
            `npm install --no-audit --no-fund "${tarballPath}" vue@"${VUE_VERSION}" pinia@"${PINIA_VERSION}" vue-router@"${VUE_ROUTER_VERSION}"`,
            { cwd: dir, stdio: 'pipe' }
        );
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
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    console.log('\n✅ --- Todos os cenários de validação passaram com sucesso ---\n');

} catch (err) {
    console.error('\n❌ Validação falhou:', err.message);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    exitCode = 1;
} finally {
    // Cleanup garantido mesmo em caso de falha antes de qualquer exit
    console.log('\n--- Limpando arquivos temporários ---');
    if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        console.log('Diretório temporário removido:', tempDir);
    }
}

if (exitCode !== 0) {
    process.exit(exitCode);
}
