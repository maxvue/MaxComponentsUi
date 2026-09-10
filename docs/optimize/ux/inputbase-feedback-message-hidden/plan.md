# Plano de Implementação: Mensagens de Feedback e Erro Ocultas no InputBase (`InputBase`)

## 1. Diagnóstico e Objetivo

No componente [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue), utilizado como base estrutural de mais de 10 componentes de entrada do Design System (`MaxInputText`, `MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputPhone`, `MaxInputSelect`, `MaxInputDatePicker`, etc.), o container de mensagens de feedback e erro (`.input-message`) está definido com `display: none;` incondicional no bloco SCSS (linha 616).
Como consequência, embora a lógica interna calcule `displayMessage` com precisão e reserve 19px na grade vertical (`grid-template-rows: 36px 19px;`), o texto explicativo de erro ou aviso nunca é renderizado na tela. Quando a validação falha, o usuário visualiza apenas uma borda vermelha e um pequeno ícone sem nenhuma explicação textual do motivo do erro. Além disso, o estilo remanescente possui alinhamento à direita (`justify-content: flex-end`) e fonte ilegível de 10px (`font-size: 10px !important`).

**Objetivo:**
1. Remover o `display: none;` de `.input-message`, tornando-o visível com `display: flex;` sempre que houver mensagem a exibir.
2. Alinhar a mensagem de erro/feedback à esquerda (`justify-content: flex-start`), em conformidade com o fluxo de leitura ocidental e alinhamento visual com a margem do campo.
3. Ajustar o tamanho da fonte para 12px (0.75rem) com `line-height: 1.2`, garantindo legibilidade segundo as diretrizes de acessibilidade WCAG.
4. Manter a reserva de altura para prevenir layout shift (CLS) quando o campo oscilar entre válido e inválido, ocultando suavemente apenas quando a prop `noMessage` ou `noStatus` estiver ativa.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue): correção do CSS de `.input-message`, alinhamento, tipografia e exibição condicional.
- [`tests/components/InputBase.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/InputBase.test.ts): testes unitários para visibilidade do elemento de mensagem e conformidade de estilos.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Template e Lógica em `InputBase.vue`

No template (linhas 52-57):

```html
<!-- INPUT MESSAGE -->
<div
    class="input-message"
    :id="message_id"
    aria-live="polite"
    :role="isError ? 'alert' : undefined"
    v-if="!props.noStatus"
>
    <MaxIcon
        :icon="iconMessage"
        v-if="iconMessage && displayMessage"
        :size="0.85"
        :light="light"
        :dark="dark"
        class="message-icon"
    />
    <span class="message-text" v-if="displayMessage">{{ displayMessage }}</span>
</div>
```

### 3.2. Estilização SCSS Scoped em `InputBase.vue`

Substituir o seletor `.input-message` na linha 615 por:

```scss
<style lang="scss" scoped>
.max-input-main-div {
    display: grid !important;
    grid-template-rows: 36px 19px;
    position: relative;
    place-items: center;

    // ... regras existentes ...

    .input-message {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 0 4px;
        padding-top: 2px;
        color: var(--max-surface-400);
        height: 16px;
        width: 100%;
        gap: 4px;
        overflow: hidden;

        .message-icon {
            flex-shrink: 0;
        }

        .message-text {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    &.caution {
        .input-message {
            color: var(--orange-600);

            .message-text {
                color: var(--orange-600);
            }
        }
    }

    &.error {
        .input-message {
            color: var(--max-red-600);

            .message-text {
                color: var(--max-red-600);
            }
        }
    }

    &.no-status,
    &.no-message {
        grid-template-rows: 36px !important;

        .input-message {
            display: none !important;
        }
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- A API de props de `InputBase` (`error`, `caution`, `msg`, `message`, `iconMessage`, `noStatus`, etc.) é integralmente preservada.
- O slot padrão do campo de entrada não sofre nenhuma mutação de markup ou layout.
- Todos os componentes derivados (`MaxInputText`, `MaxInputCep`, `MaxInputSelect`, etc.) herdam automaticamente a visibilidade das mensagens sem demandar qualquer alteração nos seus arquivos respectivos.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Ao passar `error="E-mail inválido"`, a mensagem de texto aparece visível abaixo do campo com cor vermelha.
2. Ao passar `caution="Atenção ao preenchimento"`, a mensagem de texto aparece visível com cor laranja/âmbar.
3. Ao passar `message="Informe seu nome completo"`, o texto informativo aparece visível em cor neutra.
4. O texto da mensagem está alinhado à esquerda e renderizado com tamanho de fonte de 12px.
5. Quando `noStatus="true"`, o container de mensagem não ocupa espaço vertical adicional.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes unitários do InputBase
npx vitest run tests/components/InputBase.test.ts
```
