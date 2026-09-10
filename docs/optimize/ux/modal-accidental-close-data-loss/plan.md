# Plano de Implementação: Risco de Perda de Dados por Fechamento Acidental de Modal (`MaxModal`)

## 1. Diagnóstico e Objetivo

O componente [`MaxModal.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue) encerra a exibição de forma imediata e incondicional ao receber qualquer clique na máscara de fundo (backdrop):
```html
<div class="background-modal" @click.stop="modal_store.hide" v-if="modal_store.show_id === id" ...>
```
Quando o modal abriga formulários de cadastro, fluxos de edição ou telas operacionais críticas, um clique acidental 1 pixel fora da borda do modal descarta imediatamente todo o trabalho do usuário sem confirmação ou chance de recuperação. Além disso:
1. Não existe propriedade para desabilitar o fechamento via clique externo (ao contrário de `MaxDrawer.vue`, que dispõe de `dismissable: boolean`).
2. Não existe gancho de confirmação preventiva (`beforeClose`) para avaliar se há dados preenchidos no formulário (dirty state).
3. A propriedade `blockScroll` está com o default configurado como `false` (linha 114), em desacordo com o comentário de documentação da linha 103 ("Trava o scroll do body enquanto aberto. Default true."), permitindo que a página de fundo role por trás do modal aberto.

**Objetivo:**
1. Adicionar a prop `dismissable?: boolean` (default `true`), permitindo desativar o fechamento por clique no backdrop para modais de formulário.
2. Implementar feedback tátil/visual de retenção (efeito de vibração/shake suave) caso o usuário clique no backdrop de um modal com `dismissable: false`.
3. Fornecer gancho de proteção `beforeClose?: (done: () => void) => void` e evento emitido `@before-close`, acionados antes do fechamento por backdrop, botão fechar ("X") ou tecla Escape.
4. Ajustar o valor padrão de `blockScroll` para `true`, alinhando a implementação com a semântica WAI-ARIA Dialog Modal e prevenindo rolagem concorrente da página.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxModal.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue): inclusão da prop `dismissable`, animação de shake, gancho `beforeClose` e ajuste do default de `blockScroll`.
- [`tests/components/MaxModal.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxModal.test.ts): testes unitários para `dismissable: false`, animação de shake e intercepção por `beforeClose`.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Props e Lógica de Fechamento em `MaxModal.vue`

Extensão da interface de props e defaults:

```ts
const props = withDefaults(defineProps<{
    // ... props já existentes ...
    /** Permite fechar ao clicar no backdrop/máscara. Default true. */
    dismissable?: boolean;
    /** Hook chamado antes de fechar o modal, permitindo cancelar ou confirmar o descarte */
    beforeClose?: (done: () => void) => void;
    /** Trava o scroll do body enquanto aberto. Default true. */
    blockScroll?: boolean;
    /** Permite fechar com a tecla Escape. Default true. */
    closeOnEscape?: boolean;
}>(), {
    dark: 0.4,
    light: undefined,
    loading: false,
    ignoreCanvas: false,
    noButton: false,
    noHeader: false,
    dismissable: true,
    blockScroll: true,
    closeOnEscape: true
});

const emit = defineEmits<{
    'before-close': [done: () => void];
}>();

const isShaking = ref(false);

const triggerShake = () => {
    isShaking.value = true;
    setTimeout(() => {
        isShaking.value = false;
    }, 400);
};

const handleClose = () => {
    if (props.beforeClose) {
        props.beforeClose(() => close());
        return;
    }
    emit('before-close', () => close());
    close();
};

const onBackdropClick = () => {
    if (!props.dismissable) {
        triggerShake();
        return;
    }
    handleClose();
};

const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.closeOnEscape) {
        handleClose();
    }
};
```

### 3.2. Template Atualizado em `MaxModal.vue`

Substituir os gatilhos diretos de fechamento por `onBackdropClick` e `handleClose`:

```html
<teleport to="body">
    <div
        class="background-modal"
        @click.stop="onBackdropClick"
        v-if="modal_store.show_id === id"
        :style="{ opacity: style?.opacity }"
        :data-html2canvas-ignore="props.ignoreCanvas"
    >
        <div
            class="max-modal"
            ref="el"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title_id"
            :aria-label="!title_id ? (props.title ?? undefined) : undefined"
            :style="{ top: style.top + 'px', left: style.left + 'px', padding: modal_padding }"
            @click.stop="() => {}"
            @keydown="trap.onKeydown"
            :class="[{ 'is-shaking': isShaking }, props.class]"
        >
            <slot name="header" v-if="!props.noHeader">
                <MaxGrid class="max-modal-header" :id="title_id">
                    <slot name="title" v-bind="props">
                        <MaxTitle1 class="max-modal-title" :title="props.title ?? 'Titulo'" :subtitle="props.subTitle ?? 'Sub Titulo'" />
                    </slot>
                    <div class="max-modal-close-wrapper">
                        <slot name="close" :close="handleClose" :hide="handleClose">
                            <MaxIconButton i="iconoir:xmark" size="1.3" aria-label="Fechar" @click.stop="handleClose" class="close-btn" />
                        </slot>
                    </div>
                </MaxGrid>
            </slot>
            <div class="max-modal-content">
                <slot name="content"></slot>
                <slot></slot>
            </div>
        </div>
    </div>
</teleport>
```

### 3.3. Estilização da Animação no SCSS Scoped

```scss
<style lang="scss" scoped>
.background-modal {
    // ... estilos existentes ...

    .max-modal {
        // ... estilos existentes ...

        &.is-shaking {
            animation: max-modal-shake 0.4s ease-in-out;
        }
    }
}

@keyframes max-modal-shake {
    0%,
    100% {
        transform: translateX(0);
    }
    20%,
    60% {
        transform: translateX(-8px);
    }
    40%,
    80% {
        transform: translateX(8px);
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- A prop `dismissable` tem valor padrão `true`, garantindo que qualquer modal existente continue fechando pelo backdrop exatamente como antes, a menos que o desenvolvedor opte explicitamente por `:dismissable="false"`.
- Modais sem `beforeClose` executam o encerramento instantâneo tradicional.
- A trava de rolagem (`blockScroll: true`) é o comportamento esperado para diálogos modais (`role="dialog"`, `aria-modal="true"`). Aplicações que precisem de rolagem simultânea na página podem explicitamente informar `:block-scroll="false"`.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Com `dismissable="false"`, clicar no backdrop escuro não fecha o modal e adiciona a classe `.is-shaking` ao contêiner por 400ms.
2. Com `dismissable="true"`, clicar no backdrop fecha o modal normalmente.
3. Se `beforeClose` for passado, nem o backdrop, nem a tecla Escape, nem o botão "X" fecham o modal diretamente; o callback é chamado repassando a função `done()`.
4. Ao abrir o modal, o scroll do elemento `<body>` é travado por padrão (`overflow: hidden`).

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes unitários do modal
npx vitest run tests/components/MaxModal.test.ts
```
