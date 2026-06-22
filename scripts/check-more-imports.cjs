const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname);
let totalModified = 0;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.vue') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    const missingVueTypes = new Set();
    const missingMaska = new Set();

    ['Ref', 'ComputedRef', 'ShallowRef', 'ShallowComputedRef', 'PropType'].forEach(type => {
        const usageRegex = new RegExp(`\\b${type}\\b`);
        if (usageRegex.test(content)) {
            const importRegex = new RegExp(`import\\s+{.*\\b${type}\\b.*}\\s+from\\s+['"]vue['"]`);
            if (!importRegex.test(content)) {
                missingVueTypes.add(type);
            }
        }
    });

    if (/v-maska/.test(content)) {
        if (!/import\s+{.*vMaska.*}\s+from\s+['"]maska\/vue['"]/.test(content)) {
            missingMaska.add('vMaska');
        }
    }

    if (missingVueTypes.size > 0 || missingMaska.size > 0) {
        let importsToAdd = [];
        if (missingVueTypes.size > 0) {
            importsToAdd.push(`import type { ${Array.from(missingVueTypes).join(', ')} } from 'vue';`);
        }
        if (missingMaska.size > 0) {
            importsToAdd.push(`import { vMaska } from 'maska/vue';`);
        }

        const importStr = importsToAdd.join('\n    ');
        
        if (file.endsWith('.vue')) {
            const scriptSetupRegex = /<script\s+setup[^>]*>/;
            if (scriptSetupRegex.test(content)) {
                content = content.replace(scriptSetupRegex, match => `${match}\n    ${importStr}`);
                fs.writeFileSync(file, content);
                totalModified++;
                console.log(`[!] ${path.basename(file)} fixed: ${Array.from(missingVueTypes).join(',')} ${Array.from(missingMaska).join(',')}`);
            }
        } else {
            content = `${importStr}\n` + content;
            fs.writeFileSync(file, content);
            totalModified++;
            console.log(`[!] ${path.basename(file)} fixed: ${Array.from(missingVueTypes).join(',')} ${Array.from(missingMaska).join(',')}`);
        }
    }
});

console.log(`Total files updated with type/maska imports: ${totalModified}`);
