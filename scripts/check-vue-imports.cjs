const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const vueApis = [
    'ref', 'computed', 'watch', 'watchEffect', 'onMounted', 'onUnmounted',
    'useAttrs', 'useSlots', 'inject', 'provide', 'nextTick', 'reactive',
    'toRefs', 'toRef', 'unref', 'isRef', 'shallowRef', 'triggerRef',
    'customRef', 'markRaw', 'toRaw', 'readonly', 'isReadonly', 'isReactive',
    'isProxy', 'getCurrentInstance', 'onBeforeMount', 'onBeforeUpdate',
    'onUpdated', 'onBeforeUnmount', 'onErrorCaptured', 'onRenderTracked',
    'onRenderTriggered', 'onActivated', 'onDeactivated', 'defineAsyncComponent'
];

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
    const missingApis = new Set();

    vueApis.forEach(api => {
        // If the api is used in the file as a word (with word boundaries)
        const usageRegex = new RegExp(`\\b${api}\\b`);
        if (usageRegex.test(content)) {
            // Let's check if it's imported
            const importRegex = new RegExp(`import\\s+{.*\\b${api}\\b.*}\\s+from\\s+['"]vue['"]`);
            if (!importRegex.test(content)) {
                // Wait, it might be an interface parameter, e.g. ref="..." in template. 
                // We should only consider it missing if it's inside <script> or it's a .ts file.
                // Actually, let's simplify: if it's used and not imported from 'vue'.
                // To avoid false positives (like ref="primevueInput" in template), let's check if it's followed by '(' for functions
                // EXCEPT for things like useAttrs, watch, computed.
                
                let isFunctionCall = new RegExp(`\\b${api}\\s*\\(`).test(content);
                // For `ref`, people often do `ref()` but also `const foo = ref;`. We will use `\bapi\(` or `\bapi<` 
                
                // Let's be safe: only add if we find `api(` or `api<`
                if (isFunctionCall || new RegExp(`\\b${api}\\s*<`).test(content)) {
                   missingApis.add(api);
                }
            }
        }
    });

    if (missingApis.size > 0) {
        console.log(`[!] ${path.basename(file)} is missing vue imports: ${Array.from(missingApis).join(', ')}`);
        
        // Add them to the file
        const importStr = `import { ${Array.from(missingApis).join(', ')} } from 'vue';`;
        if (file.endsWith('.vue')) {
            const scriptSetupRegex = /<script\s+setup[^>]*>/;
            if (scriptSetupRegex.test(content)) {
                content = content.replace(scriptSetupRegex, match => `${match}\n    ${importStr}`);
                fs.writeFileSync(file, content);
                totalModified++;
            }
        } else {
            content = `${importStr}\n` + content;
            fs.writeFileSync(file, content);
            totalModified++;
        }
    }
});

console.log(`Total files updated with vue imports: ${totalModified}`);
