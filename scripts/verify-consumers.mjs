import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const projectRoot = process.cwd();
console.log('Project root:', projectRoot);

let tempDir;
let tarballPath;

try {
    console.log('--- Packaging project ---');
    const packOutput = execSync('npm pack', { cwd: projectRoot, encoding: 'utf-8' });
    const tarballName = packOutput.trim().split('\n').pop().trim();
    tarballPath = join(projectRoot, tarballName);
    console.log('Tarball created:', tarballPath);

    tempDir = mkdtempSync(join(tmpdir(), 'max-components-test-'));
    console.log('Temp dir created:', tempDir);

    const runTest = (name, script) => {
        console.log(`--- Testing ${name} ---`);
        const dir = join(tempDir, name.replace(/ /g, '_'));
        mkdirSync(dir);
        execSync('npm init -y', { cwd: dir, stdio: 'ignore' });
        script(dir);
        console.log(`${name} OK\n`);
    };

    runTest('Node ESM without optional deps', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(`npm install "${tarballPath}" vue@^3.6.0-rc.5 pinia vue-router --legacy-peer-deps`, { cwd: dir, stdio: 'ignore' });
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import '@maxvue/max-components-ui/styles';
            console.log('ESM Import without optional deps OK');
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    runTest('Node ESM with optional deps', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(`npm install "${tarballPath}" vue@^3.6.0-rc.5 pinia vue-router unocss --legacy-peer-deps`, { cwd: dir, stdio: 'ignore' });
        writeFileSync(join(dir, 'index.js'), `
            import * as UI from '@maxvue/max-components-ui';
            import { presetMaxUno } from '@maxvue/max-components-ui/preset';
            import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';
            import '@maxvue/max-components-ui/styles';
            
            console.log('ESM Import with optional deps OK');
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    runTest('TypeScript Consumer', (dir) => {
        execSync('npm install typescript --save-dev', { cwd: dir, stdio: 'ignore' });
        execSync(`npm install "${tarballPath}" vue@^3.6.0-rc.5 pinia vue-router unocss @vueuse/core unplugin-vue-components --legacy-peer-deps`, { cwd: dir, stdio: 'ignore' });
        writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                moduleResolution: 'bundler',
                target: 'esnext',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true
            }
        }));
        writeFileSync(join(dir, 'index.ts'), `
            import { MaxButton } from '@maxvue/max-components-ui';
            import { useModalStore } from '@maxvue/max-components-ui/stores';
            import { presetMaxUno } from '@maxvue/max-components-ui/preset';
            import { MaxComponentsUiResolver } from '@maxvue/max-components-ui/resolver';
        `);
        execSync('npx tsc --noEmit', { cwd: dir, stdio: 'inherit' });
    });
    
    runTest('Vite Consumer', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(`npm install "${tarballPath}" vue@^3.6.0-rc.5 pinia vue-router vite unocss --legacy-peer-deps`, { cwd: dir, stdio: 'ignore' });
        writeFileSync(join(dir, 'index.html'), '<div id="app"></div><script type="module" src="/main.js"></script>');
        writeFileSync(join(dir, 'main.js'), `
            import { createApp } from 'vue';
            import { MaxButton } from '@maxvue/max-components-ui';
            import granularBtn from '@maxvue/max-components-ui/components/MaxButton';
            
            console.log('Vite import ok', MaxButton, granularBtn);
        `);
        writeFileSync(join(dir, 'vite.config.js'), `
            export default {
                build: {
                    rollupOptions: {
                        external: ['vue']
                    }
                }
            };
        `);
        execSync('npx vite build', { cwd: dir, stdio: 'inherit' });
    });

    runTest('SSR Consumer', (dir) => {
        execSync('npm pkg set type="module"', { cwd: dir, stdio: 'ignore' });
        execSync(`npm install "${tarballPath}" vue@^3.6.0-rc.5 pinia vue-router @vue/server-renderer --legacy-peer-deps`, { cwd: dir, stdio: 'ignore' });
        writeFileSync(join(dir, 'index.js'), `
            import { createSSRApp } from 'vue';
            import { renderToString } from '@vue/server-renderer';
            import { MaxButton } from '@maxvue/max-components-ui';

            const app = createSSRApp({
                components: { MaxButton },
                template: \`<MaxButton>Test</MaxButton>\`
            });

            renderToString(app).then(html => {
                if (!html.includes('button')) {
                    throw new Error('SSR Failed: Button not rendered');
                }
                console.log('SSR OK');
            }).catch(err => {
                console.error(err);
                process.exit(1);
            });
        `);
        execSync('node index.js', { cwd: dir, stdio: 'inherit' });
    });

    console.log('--- All validation tests passed successfully ---');

} catch (err) {
    console.error('Validation failed:', err.message);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
} finally {
    console.log('--- Cleaning up ---');
    if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        console.log('Removed temp dir:', tempDir);
    }
    if (tarballPath) {
        rmSync(tarballPath, { force: true });
        console.log('Removed tarball:', tarballPath);
    }
}
