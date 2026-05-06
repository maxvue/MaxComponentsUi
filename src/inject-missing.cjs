const fs = require('fs');
const path = require('path');

const injections = {
    'InputBase.vue': { maxuse: ['hasContent'] },
    'MaxIconButton.vue': { maxuse: ['hasContent', 'getRouteByName'] },
    'MaxInputAutoCompleteApi.vue': { maxuse: ['hasContent', 'toSearchableString', 'apiGetRoute', 'toArray', 'isBlank', 'size'] },
    'MaxInputAutoComplete.vue': { maxuse: ['hasContent', 'toSearchableString'] },
    'MaxInputCep.vue': { maxuse: ['formatCep', 'onlyNumbers', 'cepIsValid'] },
    'MaxInputCheckbox.vue': { maxuse: ['Random'] },
    'MaxInputCoordinateDecimalLat.vue': { maxuse: ['toNumber'] },
    'MaxInputCoordinateDecimalLng.vue': { maxuse: ['toNumber'] },
    'MaxInputCpfCnpj.vue': { maxuse: ['onlyNumbers'], vueuse: ['watchDebounced'], vue: ['useTemplateRef'] },
    'MaxInputPhoneMail.vue': { maxuse: ['onlyNumbers', 'onlyLetters'] },
    'MaxInputRadio.vue': { maxuse: ['Random'] },
    'MaxInputText.vue': { maxuse: ['toSearchableString', 'hasContent'] },
    'MaxMaps.vue': { maxuse: ['toNumber'] },
    'MaxPhoneField.vue': { vueuse: ['watchDebounced', 'refAutoReset'] },
};

Object.keys(injections).forEach(filename => {
    const file = path.join(__dirname, 'components', filename);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        const reqs = injections[filename];
        
        let importsToAdd = [];
        if (reqs.maxuse) {
            importsToAdd.push(`import { ${reqs.maxuse.join(', ')} } from '@maxvue/max-use';`);
        }
        if (reqs.vueuse) {
            importsToAdd.push(`import { ${reqs.vueuse.join(', ')} } from '@vueuse/core';`);
        }
        if (reqs.vue) {
            // Check if there's an existing import from 'vue'
            const vueRegex = /import\s+{[^}]+}\s+from\s+['"]vue['"];?/;
            if (vueRegex.test(content)) {
                content = content.replace(vueRegex, match => {
                    return match.replace('{', `{ ${reqs.vue.join(', ')}, `);
                });
            } else {
                importsToAdd.push(`import { ${reqs.vue.join(', ')} } from 'vue';`);
            }
        }
        
        if (importsToAdd.length > 0) {
            const importStr = importsToAdd.join('\n    ');
            const scriptSetupRegex = /<script\s+setup[^>]*>/;
            if (scriptSetupRegex.test(content)) {
                content = content.replace(scriptSetupRegex, match => `${match}\n    ${importStr}`);
            } else {
                content = `${importStr}\n` + content;
            }
        }
        
        fs.writeFileSync(file, content);
        console.log(`[+] Updated ${filename}`);
    }
});
