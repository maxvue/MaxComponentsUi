import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Executa um smoke test empacotando a biblioteca com npm pack e instalando
 * em um consumidor temporário para validar os 3 entrypoints:
 * - '.'
 * - './preset'
 * - './resolver'
 */
export async function verifyPackageConsumer(cwd = process.cwd()) {
    console.log('📦 [verify-package-consumer] Gerando tarball com npm pack...');

    // Certifica que dist existe
    if (!fs.existsSync(path.join(cwd, 'dist', 'index.es.js'))) {
        console.log('⚙️ [verify-package-consumer] dist ausente, executando npm run build...');
        execSync('npm run build', { cwd, stdio: 'inherit' });
    }

    const packOutput = execSync('npm pack', { cwd, encoding: 'utf-8' }).trim();
    const tarballFileName = packOutput.split('\n').filter(Boolean).pop();
    const tarballPath = path.resolve(cwd, tarballFileName);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'max-consumer-test-'));
    console.log(`📁 [verify-package-consumer] Diretório de teste temporário: ${tmpDir}`);

    try {
        const consumerPkg = {
            name: 'consumer-test',
            version: '1.0.0',
            type: 'module',
            dependencies: {
                vue: '^3.6.0-rc.5',
                pinia: '^4.0.2',
                'vue-router': '^5.2.0',
                unocss: '^66.7.5',
                '@maxvue/max-use': `file:${path.resolve(cwd, '../MaxUse')}`
            }
        };

        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(consumerPkg, null, 2));

        console.log('⬇️ [verify-package-consumer] Instalando tarball no projeto consumidor...');
        execSync(`npm install --no-audit --no-fund --legacy-peer-deps "${tarballPath}"`, {
            cwd: tmpDir,
            stdio: 'pipe'
        });

        console.log('🔍 [verify-package-consumer] Testando importação dos entrypoints publicados...');
        const testScript = `
import * as MaxComponents from '@maxvue/max-components-ui';
import { presetMaxUno } from '@maxvue/max-components-ui/preset';
import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';

if (!MaxComponents.MaxButton) {
    throw new Error("MaxButton não encontrado no entrypoint principal");
}
if (!presetMaxUno || typeof presetMaxUno !== 'function') {
    throw new Error("presetMaxUno não encontrado no entrypoint ./preset");
}
if (!MaxComponentsUiResolver || typeof MaxComponentsUiResolver !== 'function') {
    throw new Error("MaxComponentsUiResolver não encontrado no entrypoint ./resolver");
}

console.log("✅ Todos os 3 entrypoints importados e resolvidos com sucesso!");
`;

        const testScriptPath = path.join(tmpDir, 'test-consumer.mjs');
        fs.writeFileSync(testScriptPath, testScript);

        execSync(`node test-consumer.mjs`, { cwd: tmpDir, stdio: 'inherit' });
        console.log('🎉 [verify-package-consumer] Validação do consumidor bem-sucedida!');
    } finally {
        try {
            if (fs.existsSync(tarballPath)) {
                fs.unlinkSync(tarballPath);
            }
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (_cleanupErr) {
            // Ignora erro de limpeza temporária
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
