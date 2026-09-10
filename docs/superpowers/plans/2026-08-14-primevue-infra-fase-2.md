# Independência do PrimeVue — Infraestrutura Fase 2 — Implementation Plan

> **Goal:** Eliminar definitivamente qualquer dependência do PrimeVue (`primevue`, `@primeuix/themes`, `@primevue/auto-import-resolver`), desvincular o preset do Aura, remover `app.use(PrimeVue)`, descontinuar o entry point `./prime` e executar o sweep final de nomenclatura de classes `.p-*` para `.max-*`.

**Architecture:** Com todos os 37 componentes de UI desacoplados com sucesso (status `done` no `status-primevue.migration.yaml`), o gatilho da Fase 2 foi formalmente acionado. Esta fase limpa o núcleo de inicialização em `src/index.ts`, converte `MaxStyle` em preset autônomo sem herança do Aura em `src/styles/style.ts`, desativa o resolvedor legado em `src/helpers/MaxComponentsUiResolver.ts`, remove o entry `./prime` do bundle e expurga os pacotes do PrimeVue do manifesto `package.json`.

**Tech Stack:** Vue 3, TypeScript, SCSS, Vite, Vitest + `@vue/test-utils` + happy-dom, UnoCSS.

**Spec de Referência:** [`docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md`](../specs/2026-08-13-primevue-infra-independencia-design.md) (Seção 5).

---

## Estrutura de Tarefas (Tasks)

| Task | Arquivos Envolvidos | Descrição |
|---|---|---|
| **Task 1: Desacoplamento do Preset de Estilo (`MaxStyle`)** | `src/styles/style.ts`, `tests/styles/style.test.ts` | Remover `import Aura from '@primeuix/themes/aura'` e `definePreset`. Exportar `MaxStyle` como objeto de tema semântico nativo puro. |
| **Task 2: Enxugamento do `install()` da Biblioteca** | `src/index.ts` | Remover `app.use(PrimeVue, ...)`, remover import de `primevue/config` e remover parâmetros `ripple`/`locale` PrimeVue. Preservar `app.directive('tooltip', Tooltip)`. |
| **Task 3: Desacoplamento do Auto-import Resolver** | `src/helpers/MaxComponentsUiResolver.ts`, `src/scripts/generateResolver.ts` | Remover `PrimeVueResolver` e fallback para `./prime`. Gerar manifesto enxuto focado unicamente nos componentes e aliases Max. |
| **Task 4: Remoção do Entry Point `./prime`** | `src/prime/index.ts`, `vite.config.ts`, `package.json` | Descontinuar o entry `./prime` no build multi-entrada do Vite e nas chaves `exports` do `package.json`. |
| **Task 5: Limpeza de Dependências do PrimeVue** | `package.json` | Remover `@primevue/auto-import-resolver`, `@primeuix/themes` e `primevue` das dependências e peerDependencies. Remover `"primevue"` de `keywords`. |
| **Task 6: Sweep de Nomenclatura e Classes Legadas** | `src/components/*.vue`, `src/themes/tokens.scss` | Substituir classes `.p-*` remanescentes (44 classes identificadas) por classes semânticas `.max-*` e remover `!important` defensivos de coexistência. |
| **Task 7: Validação e Auditoria Final de Não-Regressão** | Toda a suíte de testes e linters | Executar `npm run type-check`, `npm run lint`, `npx vitest run` e verificar que `git grep primevue src/` retorna 100% vazio. |

---

## Detalhamento das Tarefas

### Task 1: Desacoplamento do Preset `MaxStyle`
- **Arquivo:** `src/styles/style.ts`
- **Ação:**
  - Cortar imports de `@primeuix/themes` e `@primeuix/themes/aura`.
  - Definir `MaxStyle` como constante contendo as rampas de cores semânticas (`primary`, `success`, `info`, `warning`, `danger`) no formato nativo da biblioteca.
- **Teste:** Atualizar `tests/styles/style.test.ts` garantindo que `MaxStyle` mantém as paletas sem referenciar o Aura.

### Task 2: Enxugamento do `install()`
- **Arquivo:** `src/index.ts`
- **Ação:**
  - Remover `import PrimeVue from 'primevue/config'`.
  - Na função `install(app, options)`:
    - Remover a invocação `app.use(PrimeVue, ...)`.
    - Manter a injeção da diretiva nativa `app.directive('tooltip', Tooltip)`.
    - Manter inicialização de stores ou configurações do app shell (`configureMaxApp`).

### Task 3: Desacoplamento do Resolver
- **Arquivos:** `src/helpers/MaxComponentsUiResolver.ts`, `src/scripts/generateResolver.ts`
- **Ação:**
  - Remover `import { PrimeVueResolver } from '@primevue/auto-import-resolver'`.
  - Remover a iteração sobre `primeVueResolvers` e a checagem de `primeExportNames`.
  - Simplificar `MaxComponentsUiResolver` para resolver estritamente os componentes declarados em `manifest.aliases`.
  - Atualizar `src/scripts/generateResolver.ts` para não mais ler `src/prime/index.ts`.
  - Executar `npx tsx src/scripts/generateResolver.ts` para atualizar `src/components-manifest.json`.

### Task 4: Remoção do Entry Point `./prime`
- **Arquivos:** `src/prime/index.ts`, `vite.config.ts`, `package.json`
- **Ação:**
  - Remover o arquivo `src/prime/index.ts` (ou substituí-lo por módulo vazio com aviso caso haja necessidade de transição).
  - Em `vite.config.ts`: remover a chave `prime` de `build.lib.entry`.
  - Em `package.json`: remover o subcaminho `"./prime"` de `exports`.

### Task 5: Limpeza de Dependências do PrimeVue
- **Arquivo:** `package.json`
- **Ação:**
  - Remover `"@primevue/auto-import-resolver"`.
  - Remover `"@primeuix/themes"`.
  - Remover `"primevue"`.
  - Remover `"primevue"` da lista de `keywords`.

### Task 6: Sweep de Nomenclatura (Classes e Tokens)
- **Arquivos:** `src/components/`, `src/themes/tokens.scss`
- **Ação:**
  - Mapear e substituir classes `.p-component`, `.p-inputtext`, `.p-select-*`, `.p-toggleswitch*`, etc., por `.max-*`.
  - Remover declarações `!important` defensivas em `MaxInputSwitch.vue` e `MaxInputToggle.vue`.
  - Harmonizar os 23 tokens de `tokens.scss` com a convenção de design tokens definitiva do sistema Max.

### Task 7: Auditoria e Validação
- **Critério de Aceite:**
  - `git grep -i "primevue" src/` retorna estritamente vazio.
  - `npm run type-check` sem erros relacionados ao PrimeVue.
  - Suíte de testes do Vitest executada com 100% de aprovação dos testes pertinentes.
  - `npm run build` gerando com sucesso os artefatos `index.es.js`, `preset.es.js` e `resolver.es.js`.
