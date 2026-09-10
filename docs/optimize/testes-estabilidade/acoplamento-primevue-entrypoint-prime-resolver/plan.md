# Plano de Implementação: Eliminação do Acoplamento no Resolver e Descontinuação do Entry Point `@maxvue/max-components-ui/prime`

## 1. Diagnóstico e Objetivo

A biblioteca `@maxvue/max-components-ui` criou historicamente o entry point secundário `src/prime/index.ts` e o helper [src/helpers/MaxComponentsUiResolver.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/MaxComponentsUiResolver.ts) para facilitar a transição do PrimeVue. No entanto, essa abordagem gerou acoplamento estrutural severo:
1. `src/helpers/MaxComponentsUiResolver.ts` depende diretamente de `@primevue/auto-import-resolver` em tempo de execução.
2. Qualquer componente PrimeVue desconhecido é interceptado pelo resolver e remapeado como `@maxvue/max-components-ui/prime`. Isso mascara o uso de componentes legados de terceiros, fazendo desenvolvedores acreditarem que estão usando componentes nativos da biblioteca Max.
3. O pacote de produção declara `"@primevue/auto-import-resolver": "^4.5.5"` no bloco `dependencies` de [package.json](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json#L56), onerando instalações com dependências de terceiros desnecessárias.
4. O arquivo [vite.config.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/vite.config.ts#L36) mantém o bundle `dist/prime.es.js` em sua rotina de build contínua.
5. O script [src/scripts/generateResolver.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/scripts/generateResolver.ts#L13-L22) analisa `src/prime/index.ts` para injetar `primeExports` no manifesto de componentes.

**Objetivo:**
Eliminar completamente `@primevue/auto-import-resolver` e descontinuar o subpath `./prime`. O `MaxComponentsUiResolver` deve resolver exclusivamente componentes nativos Max e seus aliases legítimos listados em `components-manifest.json`.

---

## 2. Arquivos a Modificar

- [src/helpers/MaxComponentsUiResolver.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/MaxComponentsUiResolver.ts): Remover importação e chamada de `PrimeVueResolver`, operando exclusivamente com o manifesto nativo.
- [src/scripts/generateResolver.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/scripts/generateResolver.ts): Remover leitura de `src/prime/index.ts` e suprimir `primeExports` do manifesto.
- [vite.config.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/vite.config.ts): Remover a entrada `prime` em `build.lib.entry`.
- [package.json](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/package.json): Remover exportação `"./prime"` e retirar `@primevue/auto-import-resolver` de `dependencies`.
- [src/prime/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/prime/index.ts): Remover reexportações de componentes de `primevue/*`.
- [tests/helpers/MaxComponentsUiResolver.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/helpers/MaxComponentsUiResolver.test.ts): Criar suíte de testes unitários para validar a resolução estrita de componentes e aliases.

---

## 3. Especificação Técnica Cirúrgica

### A. Refatoração de `src/helpers/MaxComponentsUiResolver.ts`

Eliminar a dependência de `@primevue/auto-import-resolver` e processar a resolução via mapa estático do manifesto:

```typescript
import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';

const aliases = manifest.aliases as Record<string, string>;
const componentNames = new Set(manifest.components as string[]);

/**
 * Resolver unplugin-vue-components para @maxvue/max-components-ui.
 * Resolve componentes nativos iniciados com Max e seus aliases canônicos.
 */
export function MaxComponentsUiResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name: string) => {
            // 1. Checa se o nome é um alias conhecido (ex: Botao -> MaxButton, InputField -> MaxInputText)
            const resolvedName = aliases[name];
            if (resolvedName) {
                return {
                    name: resolvedName,
                    from: '@maxvue/max-components-ui'
                };
            }

            // 2. Checa se o nome é um componente nativo Max registrado
            if (componentNames.has(name)) {
                return {
                    name,
                    from: '@maxvue/max-components-ui'
                };
            }

            // Não resolve componentes de bibliotecas externas (PrimeVue, etc.)
            return undefined;
        }
    };
}

export const resolver = MaxComponentsUiResolver;
```

### B. Refatoração de `src/scripts/generateResolver.ts`

Expurgar qualquer dependência de `src/prime/index.ts`:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { snakeCase, kebabCase } from '@maxvue/max-use';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.resolve(__dirname, '../components');
const outputFile = path.resolve(__dirname, '../components-manifest.json');
const tsconfigFile = path.resolve(__dirname, '../../tsconfig.json');

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
    'MaxPhoneField': 'MaxInputPhone',
    'PhoneField': 'MaxInputPhone',
    'T1': 'MaxTitle1',
    'T2': 'MaxTitle2',
    'MaxTag': 'MaxBadge',
    'Tag': 'MaxBadge',
    'MaxBadgeComponent': 'MaxBadge',
    'MaxBadgeButtonGroup': 'MaxBadgeButtonsGroup'
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
```

### C. Ajuste em `vite.config.ts`

Remover o entry point `prime`:
```typescript
// vite.config.ts (build.lib.entry)
build: {
    lib: {
        entry: {
            index: path.resolve(import.meta.dirname, './src/index.ts'),
            preset: path.resolve(import.meta.dirname, './src/presetMaxUno.ts'),
            resolver: path.resolve(import.meta.dirname, './src/helpers/MaxComponentsUiResolver.ts')
        },
        name: 'MaxComponentsUi',
        fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'es.js' : 'js'}`,
        formats: ['es'],
        cssFileName: 'style'
    },
    // ...
}
```

### D. Ajuste em `package.json`

1. Remover `"./prime"` de `"exports"`:
```json
"exports": {
    ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.es.js"
    },
    "./preset": {
        "types": "./dist/presetMaxUno.d.ts",
        "import": "./dist/preset.es.js"
    },
    "./resolver": {
        "types": "./dist/helpers/MaxComponentsUiResolver.d.ts",
        "import": "./dist/resolver.es.js"
    }
},
```

2. Remover `"@primevue/auto-import-resolver"` de `"dependencies"`.

### E. Suíte de Teste `tests/helpers/MaxComponentsUiResolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MaxComponentsUiResolver } from '../../src/helpers/MaxComponentsUiResolver';

describe('MaxComponentsUiResolver', () => {
    const resolver = MaxComponentsUiResolver();
    const resolveFn = typeof resolver === 'function' ? resolver : resolver.resolve;

    it('deve resolver componentes Max canônicos para @maxvue/max-components-ui', () => {
        const result = resolveFn('MaxButton');
        expect(result).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('deve resolver aliases sem prefixo Max e formatos kebab/snake para o componente correspondente', () => {
        const resultButton = resolveFn('Botao');
        expect(resultButton).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });

        const resultInputField = resolveFn('InputField');
        expect(resultInputField).toEqual({
            name: 'MaxInputText',
            from: '@maxvue/max-components-ui'
        });

        const resultKebab = resolveFn('max-input-text');
        expect(resultKebab).toEqual({
            name: 'MaxInputText',
            from: '@maxvue/max-components-ui'
        });
    });

    it('NÃO deve resolver nem interceptar componentes do PrimeVue puro', () => {
        const resultDataTable = resolveFn('DataTable');
        expect(resultDataTable).toBeUndefined();

        const resultSelect = resolveFn('Select');
        expect(resultSelect).toBeUndefined();

        const resultDatePicker = resolveFn('DatePicker');
        expect(resultDatePicker).toBeUndefined();
    });

    it('deve retornar undefined para componentes desconhecidos', () => {
        const result = resolveFn('NonExistentComponent');
        expect(result).toBeUndefined();
    });
});
```

---

## 4. Garantia de Retrocompatibilidade

1. **Auto-import dos Componentes Max:** Todas as aplicações consumidoras que utilizam componentes Max continuarão os resolvendo sem nenhuma alteração nos templates.
2. **Aliases Legados:** `Botao`, `InputField`, `Tag`, `PhoneField` e demais variações kebab-case continuam apontando corretamente para `@maxvue/max-components-ui`.
3. **Isolamento de Erros:** Aplicações consumidoras que ainda usem PrimeVue receberão indicação clara do bundler caso faltem componentes nativos, sem erros silenciosos de redirecionamento.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Verificação de Tipos TypeScript:**
   ```bash
   npm run type-check
   ```
   *Critério:* Nenhuma falha de compilação em `MaxComponentsUiResolver.ts` ou scripts auxiliares.

2. **Execução dos Testes do Resolver:**
   ```bash
   npx vitest run tests/helpers/MaxComponentsUiResolver.test.ts
   ```
   *Critério:* Todos os 4 testes devem passar com sucesso.

3. **Verificação de Dependências e Build:**
   ```bash
   npm run build
   ```
   *Critério:* Build gerando `dist/index.es.js`, `dist/preset.es.js` e `dist/resolver.es.js` sem gerar `dist/prime.es.js`.
