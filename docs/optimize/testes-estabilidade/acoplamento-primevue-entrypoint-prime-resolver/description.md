# Acoplamento Estrutural no Entry Point Secundário `@maxvue/max-components-ui/prime` e no Resolver Automático

## 1. Contexto e Diagnóstico Técnico
Para permitir uma migração em etapas, a biblioteca criou um entry point secundário `src/prime/index.ts` exportado no `package.json` como `@maxvue/max-components-ui/prime`, acompanhado pelo resolver `src/helpers/MaxComponentsUiResolver.ts`.

A auditoria identificou que:
1. `src/prime/index.ts` reexporta diretamente mais de 60 componentes de `primevue/*` (como `DataTable`, `Select`, `DatePicker`, `AutoComplete`, `VirtualScroller`, `Checkbox`, `Textarea`, etc.).
2. O helper `src/helpers/MaxComponentsUiResolver.ts` depende de `@primevue/auto-import-resolver` em tempo de execução, delegando a resolução de componentes não encontrados para os módulos do PrimeVue e remapeando-os para `@maxvue/max-components-ui/prime`.
3. O `vite.config.ts` mantém um chunk de biblioteca específico (`prime`) gerando `dist/prime.es.js`.
4. O `package.json` inclui `@primevue/auto-import-resolver` no bloco `dependencies` (produção).

Embora haja um aviso de depreciação em tempo de desenvolvimento no topo de `src/prime/index.ts`, a infraestrutura ainda expõe e empacota PrimeVue integralmente, mantendo dependência de módulos de terceiros que impedem a homologação de independência total.

## 2. Evidências no Código-Fonte

### A. Reexportação em Lote em `src/prime/index.ts`
[src/prime/index.ts:L20-L40](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/prime/index.ts#L20-L40):
```typescript
// FORM
export { default as AutoComplete } from 'primevue/autocomplete';
export { default as CascadeSelect } from 'primevue/cascadeselect';
export { default as Checkbox } from 'primevue/checkbox';
export { default as CheckboxGroup } from 'primevue/checkboxgroup';
export { default as ColorPicker } from 'primevue/colorpicker';
export { default as DatePicker } from 'primevue/datepicker';
export { default as InputOtp } from 'primevue/inputotp';
export { default as Knob } from 'primevue/knob';
export { default as Listbox } from 'primevue/listbox';
export { default as MultiSelect } from 'primevue/multiselect';
export { default as Password } from 'primevue/password';
export { default as Rating } from 'primevue/rating';
export { default as Select } from 'primevue/select';
...
```

### B. Dependência Direta no Resolver `src/helpers/MaxComponentsUiResolver.ts`
[src/helpers/MaxComponentsUiResolver.ts:L1-L18](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/MaxComponentsUiResolver.ts#L1-L18):
```typescript
import type { ComponentResolver } from 'unplugin-vue-components/types';
import manifest from '../components-manifest.json';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

type ResultResolver = { name: string; from: string } | undefined | null;

const primeExportNames = new Set(manifest.primeExports as string[]);

export function MaxComponentsUiResolver(): ComponentResolver {
    const primeVueResolvers = PrimeVueResolver();
    ...
```

### C. Configuração de Build em `vite.config.ts`
[vite.config.ts:L32-L37](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/vite.config.ts#L32-L37):
```typescript
lib: {
    entry: {
        index: path.resolve(import.meta.dirname, './src/index.ts'),
        preset: path.resolve(import.meta.dirname, './src/presetMaxUno.ts'),
        resolver: path.resolve(import.meta.dirname, './src/helpers/MaxComponentsUiResolver.ts'),
        prime: path.resolve(import.meta.dirname, './src/prime/index.ts')
    },
    ...
}
```

## 3. Impacto Técnico
- **Risco de Dependência Oculta em Aplicações Consumidoras:** Devido ao auto-import resolver interceptar componentes não prefixados com `Max` (ex: `<Select />`, `<DatePicker />`), o desenvolvedor da aplicação consumidora pode utilizar componentes PrimeVue acreditando que são componentes nativos da MaxComponentsUi.
- **Dificuldade na Execução da Fase 2:** Enquanto o resolver continuar mascarando imports do PrimeVue sob o namespace `@maxvue/max-components-ui/prime`, o rastreamento real de componentes legados nas aplicações consumidoras fica ofuscado.
- **Aumento no Bundle e na Complexidade de Instalação:** O pacote de produção força os clientes a puxarem `@primevue/auto-import-resolver` como dependência primária no `npm install`.

## 4. Recomendações de Resolução
1. **Remover `@primevue/auto-import-resolver` do `MaxComponentsUiResolver.ts`:**
   - O resolver deve atender exclusivamente aos componentes com prefixo `Max` ou aos aliases registrados em `components-manifest.json`.
   - Se uma aplicação consumidora precisar de componentes PrimeVue residuais, deve configurá-los diretamente no seu próprio `vite.config.ts`.
2. **Descontinuar o Entry Point `./prime`:**
   - Remover o arquivo `src/prime/index.ts` ou transformá-lo em módulo vazio com throw de aviso formal de migração.
   - Retirar a entrada `"./prime"` dos `exports` do `package.json` e do `vite.config.ts`.
3. **Mover `@primevue/auto-import-resolver` para fora de `dependencies`:**
   - Desinstalar o pacote do escopo de produção da biblioteca.
