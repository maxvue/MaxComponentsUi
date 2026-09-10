# Plano de Implementação: Desaparecimento Forçado de Erros Críticos e Truncamento de Mensagens no Toast (`MaxToast`)

## 1. Diagnóstico e Objetivo

O sistema de alertas e notificações rápidas composto por [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue) e [`useToast.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useToast.Store.ts) apresenta falhas graves na comunicação de erros críticos:
1. **Impossibilidade de Toast Persistente (Sticky Toast):** A store executa um clamp mínimo forçado em `startTimer`: `Math.max(delay, 500)`. Se uma aplicação passar `duration: 0` intencionalmente para um erro de API crítico que requer ação do usuário, o toast desaparece em apenas 500 milissegundos.
2. **Truncamento Agressivo de Texto:** O título do toast possui `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` e a mensagem de detalhe possui limitação a 2 linhas (`-webkit-line-clamp: 2`). Não há botão de "Ver mais", tooltip para texto expandido ou atalho para copiar a mensagem de erro para suporte técnico.
3. **Descarte Indevido no Ciclo de Vida:** Em `MaxToast.vue:65-67`, o hook `onBeforeUnmount(() => toastStore.clear())` esvazia a fila inteira de toasts quando o componente é desmontado (ex.: trocas de página ou redirecionamento de login), descartando mensagens de sucesso que deveriam persistir na tela de destino.

**Objetivo:**
1. Implementar suporte nativo a `duration: 0` na store e no componente: quando `duration === 0`, o timer de auto-remoção e a barra de progresso não são inicializados, mantendo o toast ativo até que o usuário clique no botão de fechar.
2. Permitir expansão de mensagens longas ("Ver mais" / "Ver menos") e fornecer botão de cópia do conteúdo do erro para facilitar chamados de suporte.
3. Remover a limpeza forçada `toastStore.clear()` no `onBeforeUnmount`, garantindo persistência do feedback entre transições de rota e layout.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/stores/useToast.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useToast.Store.ts): tratamento de `duration: 0` (ignorar timers em toasts persistentes) e guarda em `pause`/`resume`.
- [`src/components/MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue): remoção do `clear()` no desmonte, omissão da barra de progresso em toasts persistentes, expansão de mensagens e botão de cópia.
- [`tests/stores/useToastStore.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/stores/useToastStore.test.ts): testes de persistência com `duration: 0`.
- [`tests/components/MaxToast.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxToast.test.ts): testes de renderização de botão de cópia e expansão.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Ajustes em `src/stores/useToast.Store.ts`

```ts
/** Inicia o timer de auto-remoção de um toast */
const startTimer = (toast: ToastItem, delay?: number): void => {
    // Toasts com duration 0 são persistentes (sticky)
    if (toast.duration === 0) {
        toast.paused = false;
        toast.remaining = 0;
        return;
    }

    const targetDelay = delay ?? toast.remaining;
    const ms = Math.max(targetDelay, 500);
    toast.timerId = setTimeout(() => remove(toast.id), ms);
    toast.paused = false;
};

/** Pausa o timer de um toast (ao hover) */
const pause = (id: string): void => {
    const toast = items.value.find((t) => t.id === id);
    if (!toast || toast.duration === 0 || toast.paused) return;

    if (toast.timerId) {
        clearTimeout(toast.timerId);
        toast.timerId = null;
    }

    const elapsed = Date.now() - toast.createdAt;
    toast.remaining = Math.max(toast.duration - elapsed, 0);
    toast.paused = true;
};

/** Resume o timer de um toast (ao sair do hover) */
const resume = (id: string): void => {
    const toast = items.value.find((t) => t.id === id);
    if (!toast || toast.duration === 0 || !toast.paused) return;

    startTimer(toast, toast.remaining);
};
```

### 3.2. Template e Lógica em `src/components/MaxToast.vue`

Remover a linha `toastStore.clear()` do script e adicionar estado de expansão e cópia:

```ts
<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../stores/useToast.Store';
import type { ToastItem } from '../stores/useToast.Store';
import MaxIcon from './MaxIcon.vue';

const toastStore = useToastStore();

// NOTA: onBeforeUnmount removido para não apagar toasts globais durante navegação de rotas

const expandedToasts = ref<Record<string, boolean>>({});
const copiedToastId = ref<string | null>(null);

const toggleExpand = (id: string) => {
    expandedToasts.value[id] = !expandedToasts.value[id];
};

const copyToastContent = async (toast: ToastItem) => {
    const text = `${toast.title}\n${toast.message ?? ''}`.trim();
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        copiedToastId.value = toast.id;
        setTimeout(() => {
            if (copiedToastId.value === toast.id) copiedToastId.value = null;
        }, 2000);
    }
};
// ...
</script>
```

No template de cada toast:

```html
<div
    v-for="toast in toastStore.items"
    :key="toast.id"
    class="max-toast-item"
    :class="[`max-toast-${toast.severity}`, { 'is-persistent': toast.duration === 0 }]"
    role="alert"
    @mouseenter="toastStore.pause(toast.id)"
    @mouseleave="toastStore.resume(toast.id)"
>
    <!-- Ícone de severidade -->
    <div class="max-toast-icon">
        <MaxIcon :icon="resolveIcon(toast)" size="1.25" />
    </div>

    <!-- Conteúdo -->
    <div class="max-toast-content">
        <div class="max-toast-title" :title="toast.title">
            {{ toast.title }}
        </div>
        <div
            v-if="toast.message"
            class="max-toast-message"
            :class="{ 'is-expanded': expandedToasts[toast.id] }"
        >
            {{ toast.message }}
        </div>

        <div class="max-toast-actions" v-if="toast.message && (toast.message.length > 80 || toast.severity === 'error')">
            <button
                type="button"
                class="toast-text-action"
                v-if="toast.message.length > 80"
                @click.stop="toggleExpand(toast.id)"
            >
                {{ expandedToasts[toast.id] ? 'Ver menos' : 'Ver mais' }}
            </button>
            <button
                type="button"
                class="toast-text-action copy"
                @click.stop="copyToastContent(toast)"
            >
                {{ copiedToastId === toast.id ? 'Copiado!' : 'Copiar' }}
            </button>
        </div>
    </div>

    <!-- Botão Fechar -->
    <button
        type="button"
        class="max-toast-close"
        aria-label="Fechar notificação"
        @click.stop="toastStore.remove(toast.id)"
    >
        <MaxIcon icon="mdi:close" size="0.9" />
    </button>

    <!-- Barra de progresso (somente para toasts não persistentes) -->
    <div
        v-if="toast.duration > 0"
        class="max-toast-progress"
        :class="{ 'is-paused': toast.paused }"
        :style="{ animationDuration: `${toast.remaining ?? toast.duration}ms` }"
    />
</div>
```

### 3.3. Estilização SCSS Scoped

```scss
<style lang="scss" scoped>
.max-toast-item {
    .max-toast-content {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .max-toast-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: inherit;
            line-height: 1.3;
            word-break: break-word;
        }

        .max-toast-message {
            font-size: 0.78rem;
            font-weight: 400;
            color: rgb(255 255 255 / 85%);
            line-height: 1.35;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;

            &.is-expanded {
                display: block;
                -webkit-line-clamp: unset;
                overflow: visible;
                max-height: 200px;
                overflow-y: auto;
            }
        }

        .max-toast-actions {
            display: flex;
            gap: 10px;
            margin-top: 4px;

            .toast-text-action {
                background: transparent;
                border: none;
                padding: 0;
                font-size: 0.75rem;
                font-weight: 600;
                color: rgb(255 255 255 / 90%);
                text-decoration: underline;
                cursor: pointer;

                &:hover {
                    color: #fff;
                }
            }
        }
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- Toasts convencionais chamados com `add({ title, message, severity })` sem especificar `duration` continuam fechando automaticamente após 4000ms.
- A API da store (`add`, `remove`, `clear`, `pause`, `resume`) preserva suas assinaturas e tipos de retorno.
- Aplicações que necessitam de persistência podem explicitamente fornecer `duration: 0` com garantia de funcionamento.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Chamar `toastStore.add({ title: 'Erro', duration: 0 })` cria um toast que **não** é removido após 500ms ou 4000ms, permanecendo até clique no botão fechar.
2. Toasts persistentes (`duration: 0`) não renderizam a barra de progresso visual.
3. Mensagens com mais de 80 caracteres exibem o botão "Ver mais", que alterna a classe `.is-expanded` para exibir o texto integral.
4. Clicar em "Copiar" transfere o título e o corpo da mensagem para a área de transferência do usuário.
5. Desmontar o componente `MaxToast` não apaga os itens ativos da store.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes unitários do Toast
npx vitest run tests/stores/useToastStore.test.ts tests/components/MaxToast.test.ts
```
