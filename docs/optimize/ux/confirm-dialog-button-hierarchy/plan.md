# Plano de Implementação: Ausência de Hierarquia Visual e Risco em Diálogos de Confirmação (`MaxPopoverConfirm`)

## 1. Diagnóstico e Objetivo

Atualmente, o diálogo de confirmação [`MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverConfirm.vue) renderiza os botões de recusa ("Não") e aceitação ("Sim") com pesos visuais e cores idênticos (fundo azul primário padrão de `MaxButton`). A interface de tipos [`ConfirmProps`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts#L192-L209) e a store [`useConfirmStore`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useConfirm.Store.ts) não transmitem propriedades de estilo (`severity` e `variant`), impedindo a diferenciação entre ações seguras e ações destrutivas/críticas. Além disso, o ícone de aviso possui cor vermelha estática (`color: var(--red-600)`), mesmo em confirmações não destrutivas.

**Objetivo:**
1. Estabelecer hierarquia visual segura por padrão: o botão de cancelamento/rejeição deve assumir estilo secundário/outlined (`variant="outlined"`, `severity="secondary"`), enquanto o botão de confirmação deve herdar a severidade da ação (`severity="danger"` para ações críticas ou customizada).
2. Estender os tipos `ConfirmActionProps` e `ConfirmProps` para permitir configuração granular de `severity` e `variant` para ambos os botões, além de `severity` global no diálogo.
3. Dinamizar a estilização do ícone com base na severidade informada (vermelho para perigo, âmbar para aviso, azul para pergunta padrão, verde para confirmação positiva).

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/types/index.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/types/index.ts): inclusão de propriedades de aparência em `ConfirmActionProps` e `ConfirmProps`.
- [`src/stores/useConfirm.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useConfirm.Store.ts): atualização do estado e payload para aceitar `severity` e propriedades de botões.
- [`src/components/MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverConfirm.vue): aplicação de hierarquia nos botões de ação e cor dinâmica do ícone.
- [`src/components/MaxButtonConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButtonConfirm.vue): propagação de `severity` para o payload da store.
- [`src/components/MaxIconConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconConfirm.vue): propagação de `severity` para o payload da store.
- [`tests/components/MaxPopoverConfirm.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxPopoverConfirm.test.ts): novos testes unitários para verificação de classes, variantes e severidades.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Tipagem em `src/types/index.ts`

Adicionar a tipagem de variantes e severidades em `ConfirmActionProps`:

```ts
export type ButtonSeverity = 'secondary' | 'success' | 'info' | 'whatsapp' | 'warning' | 'help' | 'danger' | 'contrast';
export type ButtonVariant = 'outlined' | 'text' | 'link';

export interface ConfirmActionProps {
    label: string;
    icon?: string;
    severity?: ButtonSeverity;
    variant?: ButtonVariant;
    action?: ((event?: any) => void) | undefined;
}

export interface ConfirmProps {
    /** Mensagem de confirmação */
    message?: string;
    /** Icone de mensagem de confirmação */
    messageIcon?: string | null;
    /** Severidade visual geral do diálogo (afeta ícone e ação padrão de confirmação) */
    severity?: ButtonSeverity;
    /** Configurações do botão de rejeição/cancelamento */
    rejectProps?: ConfirmActionProps;
    /** Configurações do botão de aceitação/confirmação */
    acceptProps?: ConfirmActionProps;
}
```

### 3.2. Pinia Store em `src/stores/useConfirm.Store.ts`

```ts
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';
import type { ButtonSeverity, ConfirmActionProps } from '../types';

type ConfirmPayload = {
    message: string;
    messageIcon?: string | null;
    severity?: ButtonSeverity;
    rejectProps: ConfirmActionProps;
    acceptProps: ConfirmActionProps;
    x: number;
    y: number;
    width: number;
    height: number;
};

export const useConfirmStore = defineStore('confirm.popover', () => {
    const message: Ref<string> = ref('Deseja continuar?');
    const messageIcon: Ref<string | null> = ref(null);
    const severity: Ref<ButtonSeverity | undefined> = ref(undefined);
    const rejectProps: Ref<ConfirmActionProps> = ref({
        label: 'Não',
        icon: undefined,
        severity: 'secondary',
        variant: 'outlined',
        action: () => {}
    });
    const acceptProps: Ref<ConfirmActionProps> = ref({
        label: 'Sim',
        icon: undefined,
        severity: 'danger',
        action: () => {}
    });

    const show: Ref<boolean> = ref(false);
    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);

    const hide = () => {
        show.value = false;
    };

    const confirm = (payload: ConfirmPayload) => {
        message.value = payload.message;
        messageIcon.value = payload.messageIcon ?? null;
        severity.value = payload.severity;
        rejectProps.value = {
            label: payload.rejectProps.label ?? 'Não',
            icon: payload.rejectProps.icon,
            severity: payload.rejectProps.severity ?? 'secondary',
            variant: payload.rejectProps.variant ?? 'outlined',
            action: payload.rejectProps.action
        };
        acceptProps.value = {
            label: payload.acceptProps.label ?? 'Sim',
            icon: payload.acceptProps.icon,
            severity: payload.acceptProps.severity ?? (payload.severity ?? 'danger'),
            variant: payload.acceptProps.variant,
            action: payload.acceptProps.action
        };
        x.value = payload.x;
        y.value = payload.y;
        width.value = payload.width;
        height.value = payload.height;
        show.value = true;
    };

    return {
        message,
        messageIcon,
        severity,
        rejectProps,
        acceptProps,
        show,
        x,
        y,
        width,
        height,
        hide,
        confirm
    };
});
```

### 3.3. Template e Estilização em `src/components/MaxPopoverConfirm.vue`

No template:

```html
<template>
    <Teleport to="body">
        <TransitionFade>
            <div class="max-popover-confirm background-popover-confirm" @click.stop="confirm_store.hide" v-if="confirm_store.show">
                <div
                    class="max-icon-confirm-dialog"
                    ref="el"
                    role="alertdialog"
                    aria-modal="true"
                    :aria-labelledby="msg_id"
                    :style="{top: position.top + 'px', left: position.left + 'px'}"
                    :class="[position.isTop ? 'is-top' : 'is-bottom', position.isLeft ? 'is-left' : 'is-right']"
                    @click.stop="() => {}"
                    @keydown="trap.onKeydown"
                >
                    <div class="popover-confirm-content">
                        <MaxIcon
                            class="popover-confirm-icon"
                            :class="`severity-${confirm_store.severity ?? 'danger'}`"
                            :i="confirm_store.messageIcon ?? (confirm_store.severity === 'warning' ? 'solar:danger-triangle-bold' : confirm_store.severity === 'info' ? 'solar:info-circle-bold' : 'mingcute:question-fill')"
                            size="1.2"
                        />
                        <div :id="msg_id" class="popover-confirm-text">
                            {{ confirm_store.message }}
                        </div>
                    </div>
                    <MaxGrid class="popover-confirm-actions">
                        <MaxButton
                            class="popover-confirm-btn"
                            :action="reject"
                            :label="confirm_store.rejectProps.label"
                            :icon="confirm_store.rejectProps.icon"
                            :severity="confirm_store.rejectProps.severity ?? 'secondary'"
                            :variant="confirm_store.rejectProps.variant ?? 'outlined'"
                        />
                        <MaxButton
                            class="popover-confirm-btn"
                            :action="accept"
                            :label="confirm_store.acceptProps.label"
                            :icon="confirm_store.acceptProps.icon"
                            :severity="confirm_store.acceptProps.severity ?? (confirm_store.severity ?? 'danger')"
                            :variant="confirm_store.acceptProps.variant"
                        />
                    </MaxGrid>
                </div>
            </div>
        </TransitionFade>
    </Teleport>
</template>
```

No SCSS scoped:

```scss
<style lang="scss" scoped>
.background-popover-confirm {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 99;
    top: 0;
    left: 0;

    .max-icon-confirm-dialog {
        position: fixed;
        min-width: 300px;
        min-height: 60px;
        background-color: var(--background-0);
        color: var(--background-700);
        z-index: 2;
        border: 1px solid var(--surface-border);
        filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
        border-radius: 0.75rem;
        padding: 10px;

        &::before {
            content: '';
            position: absolute;
            width: 14px;
            height: 14px;
            background-color: var(--background-0);
            transform: rotate(45deg);
            z-index: 1;
        }

        &.is-bottom::before {
            top: -7px;
            border-top: 1px solid var(--surface-border);
            border-left: 1px solid var(--surface-border);
        }

        &.is-top::before {
            bottom: -7px;
            border-bottom: 1px solid var(--surface-border);
            border-right: 1px solid var(--surface-border);
        }

        &.is-left::before {
            right: 15px;
        }

        &.is-right::before {
            left: 15px;
        }

        .popover-confirm-content {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 0.75rem 1rem;
            text-align: left;
            color: var(--background-750);

            .popover-confirm-icon {
                &.severity-danger {
                    color: var(--red-600);
                }

                &.severity-warning {
                    color: var(--yellow-600);
                }

                &.severity-info,
                &.severity-secondary {
                    color: var(--blue-600);
                }

                &.severity-success {
                    color: var(--green-600);
                }
            }

            .popover-confirm-text {
                font-size: 0.9rem;
                font-weight: 500;
                line-height: 1.3;
            }
        }

        .popover-confirm-actions {
            display: flex;
            gap: 8px;
            padding: 0 4px 4px;

            .popover-confirm-btn {
                flex: 1 1 50%;
            }
        }
    }
}
</style>
```

### 3.4. Atualização em `MaxButtonConfirm.vue` e `MaxIconConfirm.vue`

Propagar `severity` no método `onClickToggle`:

```ts
const onClickToggle = () => {
    confirm_store.confirm({
        message: props.message,
        messageIcon: props.messageIcon,
        severity: props.severity,
        rejectProps: props.rejectProps,
        acceptProps: props.acceptProps,
        x: x.value,
        y: y.value,
        width: width.value,
        height: height.value
    });
};
```

---

## 4. Garantia de Retrocompatibilidade

- **Contratos mantidos:** Todas as props já existentes (`message`, `messageIcon`, `rejectProps`, `acceptProps`) continuam aceitando os mesmos formatos de string e objeto.
- **Novas propriedades opcionais:** `severity?: ButtonSeverity` e `variant?: ButtonVariant` são estritamente opcionais.
- **Valores default seguros:** Chamadas que omitirem configurações de botão receberão automaticamente a hierarquia ergonômica (`reject` como `secondary/outlined` e `accept` como `danger/solid`), prevenindo acionamentos destrutivos acidentais sem demandar refatoração nos códigos consumidores.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. O botão "Não" (reject) renderiza com classe ou props `variant="outlined"` e `severity="secondary"`.
2. O botão "Sim" (accept) renderiza com `severity="danger"` por padrão e aceita override via `props.acceptProps.severity` ou `props.severity`.
3. O ícone de status exibe a cor semântica correta correspondente à severidade configurada (`severity-danger`, `severity-warning`, `severity-info`).
4. Nenhum erro de compilação ou regressão nos testes existentes de `MaxButtonConfirm`, `MaxIconConfirm` e `MaxPopoverConfirm`.

### 5.2. Comandos de Validação
```bash
# Validação estrita de tipos
npm run type-check

# Execução dos testes unitários envolvidos
npx vitest run tests/components/MaxPopoverConfirm.test.ts tests/components/MaxButtonConfirm.test.ts tests/components/MaxIconConfirm.test.ts
```
