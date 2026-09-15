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
let packDir;
let tarballPath;

const CHUNK_WARNING = /(?:Some chunks are larger than|chunk size limit|chunk.*(?:warning|warn))/i;

function runWithoutChunkWarnings(command, options) {
    try {
        const output = execSync(command, { ...options, encoding: 'utf-8', stdio: 'pipe' });
        if (CHUNK_WARNING.test(output)) throw new Error(`Warning de chunk tratado como falha:\n${output}`);
        if (output.trim()) console.log(output.trim());
        return output;
    } catch (error) {
        const output = `${error.stdout?.toString() ?? ''}\n${error.stderr?.toString() ?? ''}`;
        if (CHUNK_WARNING.test(output)) throw new Error(`Warning de chunk tratado como falha:\n${output}`);
        throw error;
    }
}

// ───── Versões compatíveis com pinia@^4.0.2 (que requer vue@^3.5.11) ─────
const VUE_VERSION = '^3.5.11';
const PINIA_VERSION = '^4.0.2';
const VUE_ROUTER_VERSION = '^5.2.0';
const UNOCSS_VERSION = '^66.0.0';

try {
    console.log('\n--- Empacotando projeto com npm pack ---');

    // Garante que o build está presente antes de empacotar
    if (!existsSync(join(projectRoot, 'dist', 'index.es.js'))) {
        console.log('dist ausente — executando npm run build...');
        execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    }

    // O destino exclusivo elimina a colisão do nome fixo do tarball em execuções paralelas.
    packDir = mkdtempSync(join(tmpdir(), 'max-components-pack-'));
    const packOutput = execSync(`npm pack --json --pack-destination "${packDir}"`, { cwd: projectRoot, encoding: 'utf-8' });
    const packInfo = JSON.parse(packOutput);
    const packageInfo = Array.isArray(packInfo) ? packInfo[0] : Object.values(packInfo)[0];
    const { filename: tarballName } = packageInfo;
    tarballPath = join(packDir, tarballName);
    console.log('Tarball criado:', tarballPath);

    tempDir = mkdtempSync(join(tmpdir(), 'max-components-test-'));
    console.log('Diretório temporário:', tempDir);

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
            import '@maxvue/max-components-ui/themes/all.scss';
            import '@maxvue/max-components-ui/themes/app.scss';
            import '@maxvue/max-components-ui/themes/colors.scss';
            import '@maxvue/max-components-ui/themes/font.scss';
            import '@maxvue/max-components-ui/themes/params.scss';
            import '@maxvue/max-components-ui/themes/tokens.scss';

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
        runWithoutChunkWarnings('npx vite build', { cwd: dir });
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

            const html = await renderToString(app);
            if (!html.includes('button')) throw new Error('SSR: renderização falhou — botão não encontrado no HTML.');
            console.log('SSR renderizou:', html.slice(0, 80));
            console.log('SSR OK');
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    // ─── Cenário 6: Subpath desconhecido deve FALHAR ────────────────────────
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
                throw new Error('Subpath inexistente foi resolvido — não deveria!');
            } catch (err) {
                if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || err.code === 'MODULE_NOT_FOUND' || err.code === 'ERR_MODULE_NOT_FOUND') {
                    console.log('Subpath desconhecido corretamente rejeitado com:', err.code);
                } else {
                    throw new Error('Erro inesperado ao importar subpath desconhecido: ' + err.message);
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
    process.exitCode = 1;
} finally {
    // Cleanup garantido mesmo em caso de falha
    console.log('\n--- Limpando arquivos temporários ---');
    if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        console.log('Diretório temporário removido:', tempDir);
    }
    if (packDir) {
        rmSync(packDir, { recursive: true, force: true });
        console.log('Diretório do tarball removido:', packDir);
    }
}
