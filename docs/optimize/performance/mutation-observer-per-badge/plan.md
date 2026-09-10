# Plano de Implementação: Centralização de MutationObserver de Modo Escuro no MaxBadge

## 1. Diagnóstico e Objetivo

No componente `MaxBadge.vue`, cada instância monta um `MutationObserver` exclusivo para monitorar a presença da classe `.dark` no elemento raiz da página (`document.documentElement`):

```typescript
// MaxBadge.vue L96-L123
const attrs = useAttrs();
const isHtmlDark = ref(false);
let htmlObserver: MutationObserver | null = null;

const checkHtmlDark = () => {
    if (typeof document !== 'undefined') isHtmlDark.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
    checkHtmlDark();
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        htmlObserver = new MutationObserver(() => {
            checkHtmlDark();
        });
        htmlObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});

onBeforeUnmount(() => {
    if (htmlObserver) {
        htmlObserver.disconnect();
        htmlObserver = null;
    }
});
```

**Problemas identificados:**
1. **Proliferação de Observers em Elementos Atômicos:** `MaxBadge` é frequentemente renderizado em grande escala (1 a 4 badges por linha em tabelas como `MaxTable.vue`, seletores, listas e cards). Uma listagem com 100 linhas pode instanciar de 100 a 400 `MutationObserver` idênticos observando exatamente o mesmo elemento `document.documentElement`.
2. **Microtask Thrashing na Troca de Classes:** Qualquer alteração no atributo `class` do `<html>` (seja por toggle de tema claro/escuro, seja por lock de scroll como `.max-scroll-locked`) enfileira centenas de microtasks simultâneas no motor do navegador, disparando recálculos síncronos e re-renders em massa.
3. **Consumo de Memória e Overhead de Ciclo de Vida:** A alocação e destruição contínua de observers nativos durante paginação ou filtragem de tabelas impacta o tempo de renderização e o FPS.

**Objetivo:**
Substituir a instanciação de $N$ observadores individuais por um composable singleton reativo compartilhado (`useHtmlDark.ts`), que mantém **um único `MutationObserver` global** para toda a aplicação, reduzindo a complexidade de $O(N)$ observers para $O(1)$.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useHtmlDark.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useHtmlDark.ts) *(Novo arquivo helper)*
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBadge.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBadge.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/helpers/useHtmlDark.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/helpers/useHtmlDark.test.ts) *(Novo teste unitário)*
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxBadge.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxBadge.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Criação do Helper Singleton `src/helpers/useHtmlDark.ts`

Criar o composable reativo `useHtmlDark`:

```typescript
// src/helpers/useHtmlDark.ts
import { ref, type Ref } from 'vue';

let isHtmlDarkRef: Ref<boolean> | null = null;
let sharedObserver: MutationObserver | null = null;

const checkDark = () => {
    if (typeof document !== 'undefined') {
        return document.documentElement.classList.contains('dark');
    }
    return false;
};

/**
 * Retorna uma Ref reativa compartilhada que detecta se o elemento <html>
 * possui a classe .dark, utilizando um único MutationObserver global.
 */
export function useHtmlDark(): Ref<boolean> {
    if (!isHtmlDarkRef) {
        isHtmlDarkRef = ref(checkDark());
    }

    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && !sharedObserver) {
        sharedObserver = new MutationObserver(() => {
            if (isHtmlDarkRef) {
                isHtmlDarkRef.value = checkDark();
            }
        });

        sharedObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    return isHtmlDarkRef;
}

/**
 * Utilitário para testes unitários resetarem o estado do observer singleton.
 */
export function _resetHtmlDarkObserverForTesting(): void {
    if (sharedObserver) {
        sharedObserver.disconnect();
        sharedObserver = null;
    }
    isHtmlDarkRef = null;
}
```

---

### 3.2. Modificações em `src/components/MaxBadge.vue`

Substituir o estado local e o ciclo de vida do observer pelo composable singleton:

```typescript
// MaxBadge.vue
// Importar o novo helper:
import { useHtmlDark } from '../helpers/useHtmlDark';

// Substituir:
// const isHtmlDark = ref(false);
// let htmlObserver: MutationObserver | null = null;
// const checkHtmlDark = () => { ... };
// onMounted(() => { ... htmlObserver = new MutationObserver(...) ... });
// onBeforeUnmount(() => { ... htmlObserver.disconnect() ... });

// Por:
const isHtmlDark = useHtmlDark();
```

O restante do componente (`isDark`, `colors`, `badgeStyles`, etc.) consome `isHtmlDark.value` de forma reativa transparente, mantendo a exata mesma lógica funcional e de contraste WCAG.

Template e estilos SCSS scoped mantêm-se estritamente intactos:

```html
<template>
    <div
        class="max-badge"
        :class="[
            badgeSizeClass,
            {
                'is-neon': props.neon,
                'no-uppercase': !isUppercase
            }
        ]"
        :style="badgeStyles"
    >
        <span
            v-if="statusColor"
            class="max-badge-status-dot"
            :style="{ backgroundColor: statusColor }"
        />
        <MaxIcon
            v-if="props.icon"
            class="max-badge-icon"
            :icon="props.icon"
            :size="props.size === 'xlarge' ? '1rem' : '0.85rem'"
        />
        <span class="max-badge-label">
            {{ props.label }}
        </span>
        <span
            v-if="hasOverlayValue"
            class="max-badge-overlay"
            :style="overlayStyles"
        >
            {{ overlayValue }}
        </span>
    </div>
</template>
```

```scss
<style lang="scss" scoped>
    .max-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1rem;
        letter-spacing: 0.025em;
        text-transform: uppercase;
        white-space: nowrap;
        vertical-align: middle;
        transition: background-color 0.15s ease, color 0.15s ease;

        &.max-badge-lg {
            padding: 0.25rem 0.625rem;
            font-size: 0.8125rem;
        }

        &.max-badge-xl {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
        }

        &.no-uppercase {
            text-transform: none;
        }

        .max-badge-status-dot {
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 9999px;
            flex-shrink: 0;
        }

        .max-badge-icon {
            flex-shrink: 0;
        }

        .max-badge-label {
            display: inline-block;
        }

        .max-badge-overlay {
            margin-left: 0.125rem;
            padding: 0 0.375rem;
            border-radius: 9999px;
            font-size: 0.6875rem;
            font-weight: 700;
            line-height: 1.125rem;
        }
    }
</style>
```

---

### 3.3. Testes Unitários

1. **Criar `tests/helpers/useHtmlDark.test.ts`:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useHtmlDark, _resetHtmlDarkObserverForTesting } from '../../src/helpers/useHtmlDark';
import { nextTick } from 'vue';

describe('useHtmlDark singleton', () => {
    beforeEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    it('retorna ref falsa quando a classe dark não está presente', () => {
        const isDark = useHtmlDark();
        expect(isDark.value).toBe(false);
    });

    it('retorna a mesma instância de Ref para múltiplas chamadas', () => {
        const ref1 = useHtmlDark();
        const ref2 = useHtmlDark();
        expect(ref1).toBe(ref2);
    });

    it('atualiza a ref quando a classe dark é adicionada ao elemento html', async () => {
        const isDark = useHtmlDark();
        expect(isDark.value).toBe(false);

        document.documentElement.classList.add('dark');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await nextTick();

        expect(isDark.value).toBe(true);
    });
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de Props Intacto:** As props `dark`, `color`, `neon`, `label`, `overlay`, `status`, `size`, `uppercase`, `noUppercase`, `background` e `textColor` continuam operando de forma idêntica.
- **Sobrescrita Explícita da Prop `dark`:** Se o consumidor passar `:dark="true"` ou `:dark="false"`, a prop continua tendo precedência sobre a classe HTML através do cálculo de `isDark`:
  ```typescript
  const isDark = computed<boolean>(() => {
      if (props.dark !== undefined) return Boolean(props.dark);
      return isHtmlDark.value;
  });
  ```
- **SSR e Ambientes sem DOM:** A função degrada silenciosamente em ambiente SSR onde `document` ou `MutationObserver` não existam.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Ao renderizar 100 instâncias de `MaxBadge`, deve existir no máximo 1 instância de `MutationObserver` conectada ao DOM.
2. Ao adicionar a classe `.dark` em `document.documentElement`, todos os badges reagem e recalculam suas cores de contraste WCAG simultaneamente.
3. Desmontar badges não afeta o funcionamento de badges remanescentes na tela.
4. Verificação estrita de tipagem TypeScript:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes:
   ```bash
   npx vitest run tests/components/MaxBadge.test.ts tests/helpers/useHtmlDark.test.ts
   ```
