import fs from 'node:fs';
import path from 'node:path';
import { snakeCase } from '@maxvue/max-use';
import { kebabCase } from '@maxvue/max-use';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.resolve(__dirname, '../components');
const outputFile = path.resolve(__dirname, '../components-manifest.json');
const tsconfigFile = path.resolve(__dirname, '../../tsconfig.json');
const primeIndexFile = path.resolve(__dirname, '../prime/index.ts');

// src/prime/index.ts só re-exporta um subconjunto do PrimeVue. Extraímos os
// nomes reais via regex (mesmo espírito tolerante do parsing do tsconfig.json
// acima) em vez de parsear TypeScript de verdade — é tudo que precisamos para
// saber quais nomes realmente existem em '@maxvue/max-components-ui/prime'.
const primeIndexContent = fs.readFileSync(primeIndexFile, 'utf-8');
const primeExportNames = new Set(
    [...primeIndexContent.matchAll(/export\s*\{\s*default as (\w+)\s*\}/g)].map((match) => match[1])
);

// tsconfig.json permite comentários (JSONC), então não é JSON puro. Em vez de
// fazer parsing completo do arquivo, extraímos apenas as entradas do array
// `exclude` que apontam para arquivos .vue dentro de src/components/ — é
// tudo que este script precisa para não listar componentes excluídos do
// build (ex.: arquivos órfãos deixados fora do tsconfig).
const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf-8');
const excludedComponentFiles = new Set(
    [...tsconfigContent.matchAll(/["']src\/components\/([^"']+\.vue)["']/g)].map((match) => match[1])
);

const files = fs.readdirSync(componentsDir);
const componentNames = files
    .filter((file) => file.endsWith('.vue') && !excludedComponentFiles.has(file))
    .map((file) => file.replace('.vue', ''));

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
    // Não cria o alias sem prefixo Max se ele colidir com um nome real
    // exportado por src/prime/index.ts (ex.: ColorPicker, Popover) — evita
    // que o alias esconda silenciosamente o componente PrimeVue cru.
    if (noMax !== name && !primeExportNames.has(noMax)) {
        aliases[noMax] = name;
        aliases[snakeCase(noMax)] = name;
        aliases[kebabCase(noMax)] = name;
    }
});

const manifest = {
    components: componentNames,
    aliases: aliases,
    primeExports: [...primeExportNames]
};

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));