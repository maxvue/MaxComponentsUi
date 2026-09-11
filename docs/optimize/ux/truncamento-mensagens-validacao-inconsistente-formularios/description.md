# Achado UX-03: Truncamento Irrecuperável de Mensagens Inline, Validação Prematura e Ciclo de Vida Inconsistente em Formulários

## Severidade: Alta

### Componentes Impactados
- [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue)
- [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCpfCnpj.vue)
- [`MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCep.vue)
- [`MaxInputCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCard.vue)
- [`MaxInputCreditCardDate.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCardDate.vue)
- [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButton.vue)
- [`MaxIconButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue)

---

## 1. Sintoma Observado vs Causa Raiz Profunda

### Sintomas Observados
1. **Mensagens de Validação e Erro Ilegíveis por Truncamento Rígido (`ellipsis`)**:
   Quando um campo de entrada falha em uma validação com mensagem detalhada (ex.: *"O CPF informado já pertence a outro titular no banco de dados"* ou *"A senha deve possuir ao menos 8 caracteres e uma letra maiúscula"*), a mensagem exibida abaixo do campo é cortada com reticências após poucas palavras (ex.: *"O CPF informado já per..."*). Em telas móveis ou colunas estreitas de grid (`col-span-2`), o truncamento é ainda mais agressivo. Não existe quebra de linha, expansão ao foco ou tooltip auxiliar. O usuário simplesmente não consegue saber o que está errado.
2. **Validação Agressiva Prematura (Erros no Primeiro Carregamento de Tela)**:
   Ao abrir qualquer formulário que possua campos como `MaxInputCpfCnpj` com a propriedade `required: true`, o campo já é renderizado **imediatamente com borda vermelha, ícone de erro e a mensagem "Campo obrigatório"**. O usuário sequer tocou no teclado, focou no campo ou clicou em "Enviar", mas a interface já o acusa de erro.
3. **Inconsistência Total do Ciclo de Validação Entre Componentes da Mesma Família**:
   - `MaxInputCpfCnpj.vue`: Valida na montagem inicial (`immediate`), acusando erro prematuro.
   - `MaxInputCep.vue`: Possui código morto na computação de `error_msg`, de modo que a mensagem "Campo obrigatório" **nunca é exibida**, mesmo com `required: true` e valor vazio.
   - `MaxInputCreditCard.vue` e `MaxInputCreditCardDate.vue`: Valida somente no evento `blur`, mas após o primeiro toque passa a validar agressivamente a cada caractere digitado (`watch(unmaskedValue)`).
4. **Erros Visuais "Mudos" (Borda Vermelha sem Texto Explicativo)**:
   Em `InputBase.vue`, a condição `isError` é ativada se `props.done === false`. Porém, a computação de `displayMessage` não provê nenhuma mensagem padrão nesses casos. O resultado é um campo com contorno vermelho vivo e ícone de exclamação, mas com o espaço de texto completamente em branco. O usuário fica sem nenhuma instrução de como corrigir o campo.
5. **Falha de Feedback Interativo em Botões e Ações de Salvar**:
   O componente `MaxIconButton.vue` não possui tratamento para `props.loading`. Se um botão de ícone (ou um `<MaxButton>` sem prop `label`) estiver em estado de carregamento (`:loading="true"`), ele **não exibe spinner de carregamento e continua habilitado**, permitindo que o usuário clique repetidas vezes e dispare requisições duplicadas de gravação ou deleção. Além disso, se o desenvolvedor usar a sintaxe padrão de slot do Vue (`<MaxButton>Salvar Dados</MaxButton>`) sem passar `:label`, o componente renderiza um `MaxIconButton` com dimensões fixas de 16px por 16px, quebrando visualmente o texto.

### Causa Raiz Profunda
A causa raiz reside na **falta de um modelo de ciclo de vida de formulário unificado (Pristine / Dirty / Touched)** e em **restrições de layout excessivamente rígidas e hardcoded no `InputBase.vue`**:
- **Grid Rígido de 19px**: `InputBase.vue` define `grid-template-rows: 36px 19px;` e na classe `.input-message` impõe `white-space: nowrap; height: 16px; overflow: hidden; text-overflow: ellipsis;`. A premissa de que toda mensagem de erro em português caberá em uma única linha de 16px em qualquer viewport é conceitualmente incompatível com sistemas reais.
- **Ausência de Flag `touched` Unificada**: Cada input tenta reinventar sua própria lógica de quando emitir erro ou status, gerando comportamentos diametralmente opostos em componentes vizinhos na mesma tela.

---

## 2. Evidência Técnica

### Evidência 1: Truncamento forçado e altura fixa em `InputBase.vue`
Localização: [`InputBase.vue#L227-L230`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue#L227-L230) e [`InputBase.vue#L341-L365`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue#L341-L365)

```scss
.max-input-main-div {
    display: grid !important;
    grid-template-rows: 36px 19px; /* Bloqueia a mensagem em 19px */
    position: relative;
    place-items: center;
    ...
```

```scss
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

        .message-text {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.2;
            white-space: nowrap; /* Proíbe quebra de linha */
            overflow: hidden;
            text-overflow: ellipsis; /* Trunca mensagens longas */
        }
    }
```

Qualquer mensagem que ultrapasse a largura do input é sumariamente cortada.

### Evidência 2: Validação prematura em `MaxInputCpfCnpj.vue`
Localização: [`MaxInputCpfCnpj.vue#L154-L166`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCpfCnpj.vue#L154-L166)

```ts
    const error_msg = computed<string | null>(() => {
        // ...
        const only_numbers = onlyNumbers(temp_value.value ?? '');

        // ERRO PREMATURO: Executa no momento zero sem verificar hasBeenTouched!
        if (only_numbers.length === 0) return props.required ? (attrs_error_message ?? 'Campo obrigatório') : null;

        if (caution.value) {
            // ...
        }
        return attrs_error_message;
    });
```

Apesar de o componente possuir a ref `hasBeenTouched`, a verificação de `only_numbers.length === 0` a ignora completamente. O formulário nasce com erro.

### Evidência 3: Código inalcançável em `MaxInputCep.vue`
Localização: [`MaxInputCep.vue#L62-L73`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCep.vue#L62-L73)

```ts
    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        return done.value === false && temp_value_numbers.value.length > 0;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null; // Quando vazio, caution é false e retorna null aqui!
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        // LINHA MORTA / INALCANÇÁVEL:
        if (temp_value_numbers.value.length === 0 && props.required) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'CEP inválido';
    });
```

A checagem de obrigatoriedade do CEP nunca funciona na prática porque a linha anterior aborta a função.

### Evidência 4: Erro mudo em `InputBase.vue` quando `done === false`
Localização: [`InputBase.vue#L211-L221`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue#L211-L221)

```ts
    const isError = computed(() => (!props.noStatus && typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);

    const displayMessage = computed(() => {
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        const mainMsg = props.message ?? props.msg;
        if (hasContent(mainMsg)) return mainMsg;
        return ''; // Retorna vazio mesmo quando isError é true devido a props.done === false!
    });
```

### Evidência 5: `MaxIconButton.vue` sem suporte a `loading`
Localização: [`MaxIconButton.vue#L1-L17`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue#L1-L17) e [`MaxIconButton.vue#L47`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue#L47)

```ts
    const isDisabled = computed(() => Boolean(props.disabled || (attrs.disabled !== undefined && attrs.disabled !== false)));
```

`props.loading` não é considerado no `isDisabled`. Clicar em um botão de ação com `loading` ativo permite disparar múltiplas requisições concorrentes sem qualquer trava.

---

## 3. Impacto na Experiência do Usuário Final e no Produto

1. **Paralisia por Sobrecarga Cognitiva (Banner Blindness de Erros)**: Ao abrir uma tela repleta de avisos vermelhos de "Campo obrigatório", o usuário sente-se frustrado e sobrecarregado antes de iniciar o trabalho.
2. **Incapacidade de Solucionar Erros Rejeitados pelo Servidor**: O truncamento de mensagens faz com que regras de negócio complexas (ex.: validação tributária na concessionária de energia) sejam cortadas pela metade, impedindo a compreensão do erro sem abrir o console do navegador.
3. **Erros Concorrentes de Duplo Clique**: A falta de bloqueio em botões em loading causa cadastros duplicados e inconsistência nos dados da aplicação.

---

## 4. Recomendações de Solução Arquitetural de UX
1. **Flexibilizar a Área de Mensagens de `InputBase.vue`**:
   - Modificar `grid-template-rows: 36px auto` ou usar layout com altura dinâmica para a mensagem.
   - Permitir quebra de linha suave (`white-space: normal`) quando a mensagem for longa, ou exibir um tooltip acessível caso o espaço seja estritamente restrito.
2. **Padronizar o Ciclo de Validação com o Modelo `touched`**:
   - Não exibir mensagens nem estados de erro de "Campo obrigatório" antes que o campo receba o evento `blur` ou que o formulário pai emita uma intenção de submissão (`submit`).
3. **Corrigir o Erro Mudo em `InputBase.vue`**:
   - Quando `done === false` e nenhuma mensagem de erro personalizada tiver sido fornecida, fornecer um fallback informativo (ex.: "Valor inválido").
4. **Implementar Suporte Completo a `loading` em `MaxIconButton.vue`**:
   - Incluir `props.loading` no cálculo de `isDisabled` e exibir o `MaxLoaderIcon` automaticamente em substituição ao ícone padrão enquanto a ação assíncrona estiver pendente.
