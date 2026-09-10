# Plano de Implementação: Erradicação do Uso Indiscriminado de `any` e Padronização de Contratos de Props

## 1. Diagnóstico e Objetivo

O TypeScript é a espinha dorsal de uma biblioteca de componentes de interface de nível corporativo. Seu valor reside em oferecer autocompletação precisa, prevenção de erros em tempo de compilação e segurança durante refatorações.

A auditoria identificou graves pontos de enfraquecimento no sistema de tipos de `@maxvue/max-components-ui`:
1. **Contaminação da Base de Inputs:** [src/components/InputBase.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L71-L76) declara `value?: any`, `modelValue?: any` e `options?: any[]`. Como mais de 20 componentes de formulário herdam as props de `InputBase`, o tipo solto `any` se espalha por toda a biblioteca.
2. **Definição de Props sem TypeScript em `MaxPdfView`:** [src/components/MaxPdfView.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue#L61-L64) adota sintaxe de runtime `defineProps({ file: { default: '' } })` sem interface TypeScript associada nem genéricos tipados.
3. **Ponto de Boot Untyped:** [src/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts#L233) expõe a assinatura `install = (app: any, options: any = {})`, gerando arquivos `.d.ts` sem tipagem para a instância da aplicação.
4. **Concentração Excessiva de `any` em Componentes Complexos:** Componentes como [src/components/MaxListBox.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxListBox.vue) e [src/components/MaxTableFields.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue) acumulam dezenas de referências a `any`, reduzindo a confiabilidade de callbacks e transformações de dados.

**Objetivo:**
Substituir o uso indiscriminado de `any` por tipos semânticos, unions discriminadas e interfaces universais em `src/types/`, padronizar `MaxPdfView.vue` com `withDefaults(defineProps<...>(), ...)`, tipar `src/index.ts` com `App` oficial do Vue 3 e refatorar `InputBase.vue` e `MaxListBox.vue` com tipagem forte.

---

## 2. Arquivos a Modificar

- [src/types/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts): Exportar novos tipos universais de input (`InputValue`, `SelectOptionItem`, `SelectOptionsList`).
- [src/components/InputBase.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue): Substituir `any` nas props `value`, `modelValue` e `options`.
- [src/components/MaxPdfView.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue): Migrar para `withDefaults(defineProps<MaxPdfViewProps>())`.
- [src/index.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/index.ts): Tipar parâmetro `app: App` e `options: MaxPluginOptions`.
- [src/components/MaxListBox.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxListBox.vue): Utilizar `ListBoxOption` e tipagem discriminada em métodos internos e props.
- [tests/components/MaxPdfView.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxPdfView.test.ts): Validação dos tipos de entrada do visualizador de PDF.

---

## 3. Especificação Técnica Cirúrgica

### A. Criação de Tipos Fortes em `src/types/index.ts`

Adicionar ao arquivo central de tipos:

```typescript
/** Valores aceitos como estado de entrada em inputs */
export type InputValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/** Item padronizado de seleção */
export interface SelectOptionItem<T = unknown> {
    label?: string;
    value?: T;
    name?: string;
    icon?: string;
    sub_label?: string;
    disabled?: boolean;
    badge?: string | number;
    badgeColor?: string;
    [key: string]: unknown;
}

export type SelectOptionsList<T = unknown> = Array<SelectOptionItem<T> | Record<string, unknown>>;
```

---

### B. Refatoração da Interface em `src/components/InputBase.vue`

Substituir o bloco de props untyped:

```typescript
// src/components/InputBase.vue
import type { InputValue, SelectOptionsList, SelectGroupOptions } from '../types';

interface Props {
    /** Valor do input (suporta v-model legado) */
    value?: InputValue;
    /** Valor do input para v-model no Vue 3 */
    modelValue?: InputValue;
    /** Classe CSS personalizada */
    class?: string;
    /** Ícone principal (ex: 'mdi:user') */
    icon?: string | undefined;
    /** Alias para o ícone principal */
    i?: string | undefined;
    /** Estado desabilitado do componente */
    disabled?: boolean | undefined;
    /** Ativa o estilo de label flutuante (FloatLabel) */
    float?: boolean | undefined;
    /** Mensagem de feedback ou instrução */
    msg?: string | undefined;
    /** Mensagem de feedback exibida abaixo do input */
    message?: string | undefined;
    /** Rótulo (label) exibido acima ou dentro do campo */
    label?: string | undefined;
    /** Define se o campo foi preenchido corretamente */
    done?: string | boolean | null | undefined;
    /** Mensagem de erro ou estado de erro */
    error?: string | boolean | null | undefined;
    /** Mensagem de atenção ou estado de alerta */
    caution?: string | boolean | null | undefined;
    /** Indica se o preenchimento deste campo é obrigatório */
    required?: boolean | null | undefined;
    /** Lista de opções simples */
    options?: SelectOptionsList;
    /** Lista de opções agrupadas */
    groupOptions?: SelectGroupOptions;
    // ... demais props tipadas
}
```

---

### C. Refatoração de `src/components/MaxPdfView.vue`

Migrar de `defineProps({ ... })` para generics de TypeScript com `withDefaults`:

```vue
<script setup lang="ts">
    import { useWindowSize } from '@maxvue/max-use';
    import { defineAsyncComponent, ref, watch, useTemplateRef, onBeforeUnmount } from 'vue';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useScrollLock } from '../helpers/useScrollLock';
    import MaxButton from './MaxButton.vue';

    export interface MaxPdfViewProps {
        /** URL, base64, Uint8Array ou fonte do arquivo PDF */
        file?: string | Uint8Array | Record<string, unknown>;
    }

    const props = withDefaults(defineProps<MaxPdfViewProps>(), {
        file: ''
    });

    const el = useTemplateRef<HTMLElement>('el');
    const trap = useFocusTrap(el);
    const scroll_lock = useScrollLock();
    // ... restante da implementação
</script>
```

---

### D. Refatoração de `src/index.ts`

Tipar a assinatura de instalação do plugin Vue:

```typescript
import type { App, Plugin } from 'vue';

export interface MaxPluginOptions {
    theme?: Record<string, unknown>;
    prefix?: string;
    ripple?: boolean;
    [key: string]: unknown;
}

export const install: Plugin['install'] = (app: App, options: MaxPluginOptions = {}) => {
    app.directive('tooltip', Tooltip);
    app.provide('maxComponentsOptions', options);
};
```

---

### E. Refatoração em `src/components/MaxListBox.vue`

Substituir os tipos soltos `any` por `ListBoxOption` e genéricos:

```typescript
import type { ListBoxOption, LoadOptionsContext, LoadOptionsResult } from '../types';

const props = withDefaults(
    defineProps<{
        /** Valor selecionado */
        modelValue?: unknown;
        /** Objeto já resolvido pela aplicação */
        selectedOption?: ListBoxOption | Record<string, unknown> | null;
        /** Lista de opções local */
        options?: ListBoxOption[] | Record<string, unknown>[];
        optionValue?: string;
        optionLabel?: string;
        optionSubLabel?: string;
        optionDisabled?: string;
        optionIcon?: string;
        optionBadge?: string;
        optionBadgeColor?: string;
        twoLines?: boolean;
        emptyMessage?: string;
        disabled?: boolean;
        title?: string;
        height?: string;
        filter?: boolean;
        filterPlaceholder?: string;
        filterFields?: string[];
        virtualScroll?: boolean;
        virtualScrollThreshold?: number;
        itemHeight?: number;
        loadOptions?: (ctx: LoadOptionsContext) => Promise<LoadOptionsResult>;
        pageSize?: number;
    }>(),
    {
        modelValue: null,
        selectedOption: null,
        options: () => [],
        optionValue: 'value',
        optionLabel: 'label',
        // ...
    }
);
```

---

## 4. Garantia de Retrocompatibilidade

1. **Unions Abertas e Tipos Seguros:** O uso de `InputValue` (`string | number | boolean | null | undefined | Record<string, unknown> | unknown[]`) assegura que qualquer dado anteriormente fornecido continue válido e compatível com `v-model`.
2. **`MaxPdfView`:** Permanece aceitando `string` vazia ou URLs de arquivos sem alterar o comportamento em runtime.
3. **Declarações `.d.ts`:** Os arquivos gerados no build para distribuição exportarão tipagens explícitas, trazendo autocompletação e documentação inline imediata para qualquer IDE com Volar ou TypeScript.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Validação Estrita de Tipos:**
   ```bash
   npm run type-check
   ```
   *Critério:* Compilação limpa sem erros de tipo em `InputBase.vue`, `MaxPdfView.vue`, `MaxListBox.vue` e `src/index.ts`.

2. **Execução dos Testes Unitários Afetados:**
   ```bash
   npx vitest run tests/components/MaxPdfView.test.ts \
                   tests/components/MaxListBox.test.ts \
                   tests/components/MaxInputText.test.ts
   ```
   *Critério:* 100% dos testes devem passar sem regressões.

3. **Verificação de Redução de `any` em `InputBase.vue`:**
   ```bash
   git grep -n "any" src/components/InputBase.vue
   ```
   *Critério:* Ausência de tipos `any` nas definições de props e interfaces de entrada.
