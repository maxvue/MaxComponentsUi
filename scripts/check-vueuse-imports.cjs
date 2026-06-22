const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'components');
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
const vueuseCoreHooks = [
    'useWindowSize',
    'useElementSize',
    'useDropZone',
    'useVModel',
    'useMouse',
    'useClipboard',
    'useStorage',
    'useDebounceFn',
    'useIntersectionObserver',
    'useResizeObserver',
    'useFocus'
];

const maxuseHooks = [
    'useMask',
    'useMaxToast',
    'useNumberFormat',
    'useCep',
    'useFormatDate',
    'useScreen',
    'useMaxDialog'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    const missingVueuse = [];
    const missingMaxuse = [];

    vueuseCoreHooks.forEach(hook => {
        if (new RegExp(`\\b${hook}\\b`).test(content) && !content.includes(hook) && !content.includes(`import { ${hook} }`)) {
            // this check is slightly buggy but we can just use regex properly
        }
    });
});
