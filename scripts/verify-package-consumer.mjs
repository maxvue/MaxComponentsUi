import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Executa validação rigorosa de consumidor empacotando a biblioteca com npm pack
 * e instalando em projetos consumidores temporários isolados (sem repositórios irmãos
 * e sem --legacy-peer-deps):
 *
 * Valida todos os entrypoints públicos:
 * - '.'
 * - './stores'
 * - './styles'
 * - './preset' (quando UnoCSS estiver presente)
 * - './resolver'
 * - './style.css'
 * - './themes/*'
 */
export async function verifyPackageConsumer(cwd = process.cwd()) {
    console.log('📦 [verify-package-consumer] Gerando tarball com npm pack...');

    // Certifica que o build está atualizado
    if (!fs.existsSync(path.join(cwd, 'dist', 'index.es.js'))) {
        console.log('⚙️ [verify-package-consumer] dist ausente, executando npm run build...');
        execSync('npm run build', { cwd, stdio: 'inherit' });
    }

    const packOutput = execSync('npm pack', { cwd, encoding: 'utf-8' }).trim();
    const tarballFileName = packOutput.split('\n').filter(Boolean).pop();
    const tarballPath = path.resolve(cwd, tarballFileName);

    // Cenário 1: Consumidor padrão completo (com peers)
    await runConsumerScenario('Cenário 1: Consumidor com peers completos (incluindo UnoCSS)', tarballPath, {
        vue: '^3.5.11',
        pinia: '^4.0.2',
        'vue-router': '^5.2.0',
        unocss: '^66.7.5'
    }, true);

    // Cenário 2: Consumidor mínimo (sem peers opcionais como unocss)
    await runConsumerScenario('Cenário 2: Consumidor sem peers opcionais (sem UnoCSS)', tarballPath, {
        vue: '^3.5.11',
        pinia: '^4.0.2',
        'vue-router': '^5.2.0'
    }, false);

    try {
        if (fs.existsSync(tarballPath)) {
            fs.unlinkSync(tarballPath);
        }
    } catch (_err) {
        // ignora
    }

    console.log('\n🎉 [verify-package-consumer] Todos os cenários de consumidor validados com sucesso!');
}

async function runConsumerScenario(name, tarballPath, dependencies, hasUnoCss = true) {
    console.log(`\n▶️ [verify-package-consumer] ${name}...`);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'max-consumer-'));

    try {
        const consumerPkg = {
            name: 'test-consumer',
            version: '1.0.0',
            type: 'module',
            dependencies
        };

        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(consumerPkg, null, 2));

        console.log('⬇️ Instalando tarball sem --legacy-peer-deps e sem pacotes irmãos...');
        execSync(`npm install --no-audit --no-fund "${tarballPath}"`, {
            cwd: tmpDir,
            stdio: 'pipe'
        });

        console.log('🔍 Testando resolução de todos os entrypoints públicos declarados...');
        const testScript = `
import * as Main from '@maxvue/max-components-ui';
import * as Stores from '@maxvue/max-components-ui/stores';
import * as Styles from '@maxvue/max-components-ui/styles';
${hasUnoCss ? "import { presetMaxUno } from '@maxvue/max-components-ui/preset';" : ''}
import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// 1. Entrypoint principal
if (!Main.MaxButton || !Main.MaxInputText || !Main.MaxModal) {
    throw new Error('Componentes principais ausentes no entrypoint raiz.');
}

// 2. Stores
if (!Stores.useIconStore || !Stores.usePopoverStore || !Stores.useToastStore) {
    throw new Error('Stores ausentes no entrypoint ./stores.');
}

// 3. Styles
if (!Styles.MaxStyle) {
    throw new Error('MaxStyle ausente no entrypoint ./styles.');
}

${hasUnoCss ? `
// 4. Preset UnoCSS
if (!presetMaxUno || typeof presetMaxUno !== 'function') {
    throw new Error('presetMaxUno inválido no entrypoint ./preset.');
}
` : ''}

// 5. Resolver
if (!MaxComponentsUiResolver || typeof MaxComponentsUiResolver !== 'function') {
    throw new Error('MaxComponentsUiResolver inválido no entrypoint ./resolver.');
}

// 6. Arquivo CSS estático
const styleCssPath = require.resolve('@maxvue/max-components-ui/style.css');
if (!fs.existsSync(styleCssPath)) {
    throw new Error('Arquivo style.css não encontrado via package export.');
}
const cssContent = fs.readFileSync(styleCssPath, 'utf-8');
if (cssContent.length === 0) {
    throw new Error('style.css está vazio.');
}

// 7. Temas SCSS
const themeAllPath = require.resolve('@maxvue/max-components-ui/themes/all.scss');
if (!fs.existsSync(themeAllPath)) {
    throw new Error('dist/themes/all.scss não encontrado via package export.');
}

console.log('  ✅ Entrypoints testados e aprovados!');
`;

        fs.writeFileSync(path.join(tmpDir, 'test-verify.mjs'), testScript);
        execSync(`node test-verify.mjs`, { cwd: tmpDir, stdio: 'inherit' });
    } finally {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (_cleanupErr) {
            // ignora
        }
    }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
    verifyPackageConsumer()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ [verify-package-consumer] Falha:', err);
            process.exit(1);
        });
}
