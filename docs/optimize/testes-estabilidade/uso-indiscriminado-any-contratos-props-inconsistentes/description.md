# Uso Indiscriminado de `any` e Inconsistência nos Contratos de Props

## 1. Contexto e Diagnóstico Técnico
O TypeScript em uma biblioteca de componentes de interface deve fornecer contratos estritos e previsíveis para desenvolvedores consumidores. A presença excessiva de `any` desativa as garantias do sistema de tipos, permitindo que propriedades inválidas, typos e estruturas de dados incompatíveis passem despercebidos.

A auditoria identificou três grandes sintomas de enfraquecimento de tipos no projeto:
1. **Contaminação da Base (`InputBase.vue`):** O componente base de todos os inputs (`src/components/InputBase.vue`) tipa `value?: any`, `modelValue?: any`, `options?: any[]`, propagando tipos soltos para os mais de 20 componentes que herdam dele.
2. **Alta Concentração de `any` em Componentes Complexos:** Componentes que gerenciam conjuntos de dados, como `MaxListBox.vue` (20 ocorrências de `any`), `MaxTagsList.vue` (16 ocorrências), `MaxTableFields.vue` (13 ocorrências), `MaxInputSelect.vue` (12 ocorrências) e `MaxBadgeButtonsGroup.vue` (11 ocorrências).
3. **Props sem Tipagem TypeScript (`MaxPdfView.vue`):** O visualizador de PDF define props usando exclusivamente a sintaxe de runtime (`defineProps({ file: { default: '' } })`) sem interface TypeScript ou generics, quebrando o padrão de toda a biblioteca.
4. **Boot da Biblioteca Untyped (`src/index.ts`):** A função de instalação é declarada como `export const install = (app: any, options: any = {}) => ...` em vez de utilizar o tipo oficial `App` do Vue e uma interface tipada `MaxComponentsOptions`.

## 2. Evidências no Código-Fonte

### A. Tipagem Base em `src/components/InputBase.vue`
[src/components/InputBase.vue:L71-L76](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L71-L76) e [src/components/InputBase.vue:L112-L113](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L112-L113):
```typescript
interface Props {
    /** Valor do input (suporta v-model) */
    value?: any;
    /** Valor do input para v-model no Vue 3 */
    modelValue?: any;
    ...
    /** Lista de opções simples [{ name, value, icon, sub_label }] */
    options?: any[];
```

### B. Definição Runtime em `src/components/MaxPdfView.vue`
[src/components/MaxPdfView.vue:L61-L64](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue#L61-L64):
```typescript
const props = defineProps({
    /** URL ou fonte do arquivo PDF */
    file: { default: '' }
});
```

### C. Assinatura de Instalação em `src/index.ts`
[src/index.ts:L233](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts#L233):
```typescript
export const install = (app: any, options: any = {}) => {
```

### D. Componentes com Maior Volume de Tipos `any`
- `MaxListBox.vue` (20 `any`s): `modelValue?: any`, `selectedOption?: any`, `options?: any[]`, retorno de métodos, callbacks de eventos e itens de busca tipados sem restrição.
- `MaxTagsList.vue` (16 `any`s): Manipulação de tags, objetos e identificadores sem tipo genérico.
- `MaxTableFields.vue` (13 `any`s): `row: any`, `value: any`, `payload: { row: any; field: string; value: any }`.

## 3. Impacto Técnico
- **Perda de Autocompletação e Refatoração Segura:** Ao passar objetos para `options` ou `columns`, desenvolvedores não recebem feedback sobre os nomes esperados dos campos (`label`, `value`, `disabled`, etc.).
- **Regressão Silenciosa em Runtime:** Modificações nos schemas de dados não disparam erros em `npm run type-check`, transferindo a detecção de bugs para testes manuais ou para o usuário final em produção.
- **Dificuldade na Geração de Declarações `.d.ts`:** Os arquivos gerados por `vite-plugin-dts` no build expõem `any`, desvalorizando a qualidade da biblioteca para consumidores externos.

## 4. Recomendações de Resolução
1. **Introduzir Interfaces Genéricas Compartilhadas em `src/types/`:**
   - Criar `SelectOption<T = unknown> { label: string; value: T; disabled?: boolean; icon?: string; ... }`.
   - Criar `TableColumnDefinition<T = Record<string, unknown>>`.
2. **Atualizar `InputBase.vue` com Tipagem Genérica ou Unions Abrangentes:**
   - Trocar `value?: any` por `value?: unknown` ou tipos permitidos (`string | number | boolean | null | undefined | Record<string, unknown>`).
3. **Padronizar `MaxPdfView.vue` com TypeScript:**
   ```typescript
   export interface MaxPdfViewProps {
       file?: string | Uint8Array | Record<string, unknown>;
   }
   const props = withDefaults(defineProps<MaxPdfViewProps>(), {
       file: ''
   });
   ```
4. **Tipar `src/index.ts` com Tipos do Vue:**
   ```typescript
   import type { App } from 'vue';
   export interface MaxPluginOptions {
       theme?: Record<string, unknown>;
       locale?: Record<string, unknown>;
       ripple?: boolean;
       [key: string]: unknown;
   }
   export const install = (app: App, options: MaxPluginOptions = {}) => { ... };
   ```
