# Mensagens de Feedback e Erro Ocultas no InputBase (`display: none`)

## Contexto e Componentes Afetados
- **Componentes:** `InputBase.vue` e todos os inputs dependentes (`MaxInputText`, `MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputPhone`, `MaxInputOTP`, `MaxInputSelect`, `MaxInputDatePicker`, `MaxInputTextArea`, `MaxInputCoordinateDecimalLat`, `MaxInputCoordinateDecimalLng`).
- **Categoria:** Inputs e formulários / Estados de feedback.
- **Severidade:** Crítica.
- **Heurística Violada:** Nielsen #1 (Visibilidade do Status do Sistema) e Nielsen #9 (Ajudar os usuários a reconhecer, diagnosticar e recuperar-se de erros).

---

## Descrição do Problema

No componente central [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L615-L629), o container de mensagens de feedback e erro (`.input-message`) está definido com `display: none;`:

```scss
.input-message {
    display: none;
    align-items: center;
    justify-content: flex-end;
    padding: 0 6px;
    padding-top: 4px;
    color: var(--max-surface-400);
    height: 16px;
    width: 100%;

    .message-text {
        font-size: 10px !important;
    }
}
```

Embora o componente calcule dinamicamente o texto de erro, atenção ou mensagem de instrução (`displayMessage` na linha 172) e reserve 19px na grade CSS (`grid-template-rows: 36px 19px;` na linha 188), o container da mensagem nunca é exibido na tela porque nenhuma regra CSS sobrescreve o `display: none`.

---

## Evidência no Código

1. Em [`InputBase.vue:53-56`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L53-L56):
   ```html
   <div class="input-message" :id="message_id" aria-live="polite" :role="isError ? 'alert' : undefined">
       <MaxIcon :icon="iconMessage" v-if="iconMessage && displayMessage" :size="0.9" :light="light" :dark="dark" />
       <span class="message-text">{{ displayMessage }}</span>
   </div>
   ```
2. Em [`InputBase.vue:172-180`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L172-L180), a lógica deriva mensagens como `"Campo obrigatório"`, `"Valor inválido"`, etc.
3. Em [`InputBase.vue:345-351`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L345-L351) e [`376-382`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L376-L382), as classes `.caution .input-message` e `.error .input-message` estilizam apenas as cores do texto, sem alterar a propriedade `display`.
4. Em [`InputBase.vue:615-629`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L615-L629), `.input-message` possui `display: none;` absoluto.

---

## Impacto na Experiência do Usuário (UX)

1. **Incompreensão do Erro:** Quando um campo falha na validação, o usuário vê apenas a borda vermelha e um pequeno ícone de exclamação, mas **nenhum texto explicativo** aparece abaixo do campo. O usuário não sabe se o erro decorre de formato incorreto, obrigatoriedade, tamanho mínimo ou regra de negócio.
2. **Espaço Vazio Inútil (Dead Space):** A grade reserva 19px abaixo de todos os inputs, gerando um espaçamento vertical sem conteúdo visível.
3. **Frustração e Abandono:** Em formulários longos, a ausência de mensagens claras leva a tentativas e erros repetidos, aumentando a taxa de abandono do fluxo.

---

## Recomendações de Solução

1. **Remover o `display: none` fixo:** Tornar `.input-message` um elemento flexível condicionado à presença de mensagem (`display: flex` quando houver `displayMessage` ou com visibilidade controlada).
2. **Alinhamento e Acessibilidade:**
   - Alinhar a mensagem à esquerda (`justify-content: flex-start`), alinhada com a margem do input, para facilitar a leitura ocidental natural.
   - Ajustar o tamanho da fonte para pelo menos `12px` (0.75rem), garantindo legibilidade adequada (10px é inferior ao limite ergonômico recomendado pela WCAG e pelo Nielsen Norman Group).
3. **Gerenciamento de Espaço:** No modo `no-message` ou quando não houver erro/ajuda, permitir colapso inteligente da linha para não consumir altura desnecessária quando não houver mensagens ativas.
