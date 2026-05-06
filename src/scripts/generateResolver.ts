import fs from 'node:fs';
import path from 'node:path';
import { snakeCase } from '@maxvue/max-use';
import { kebabCase } from '@maxvue/max-use';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.resolve(__dirname, '../components');
const outputFile = path.resolve(__dirname, '../components-manifest.json');

const files = fs.readdirSync(componentsDir);
const componentNames = files.filter((file) => file.endsWith('.vue')).map((file) => file.replace('.vue', ''));

const aliases: Record<string, string> = {
    'Botao': 'MaxButton',
    'InputField': 'MaxInputText',
    'InputPhone': 'MaxPhoneField',
    'T1': 'MaxTitle1',
    'T2': 'MaxTitle2'
};

for (const k of Object.keys(aliases)) {
    aliases[snakeCase(k)] = aliases[k];
    aliases[kebabCase(k)] = aliases[k];
    const noMax = aliases[k].replace(/^Max/, '');
    if (noMax !== aliases[k]) {
        aliases[noMax] = aliases[k];
        aliases[snakeCase(noMax)] = aliases[k];
        aliases[kebabCase(noMax)] = aliases[k];
    }
}

componentNames.forEach((name: string) => {

    aliases[name] = name;
    aliases[snakeCase(name)] = name;
    aliases[kebabCase(name)] = name;

    const noMax = name.replace(/^Max/, '');
    if (noMax !== name) {
        aliases[noMax] = name;
        aliases[snakeCase(noMax)] = name;
        aliases[kebabCase(noMax)] = name;
    }
});

const manifest = {
    components: componentNames,
    aliases: aliases
};

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));