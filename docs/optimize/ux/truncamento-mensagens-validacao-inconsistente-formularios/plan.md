# Plano de Implementação: Flexibilização de Mensagens Inline, Correção de Validação Prematura e Ciclo de Vida de Formulários

## 1. Objetivo da Refatoração

Extinguir o truncamento forçado de mensagens de validação e erro em formulários, permitindo quebra de linha fluida e legível em qualquer resolução; eliminar a validação agressiva prematura em campos obrigatórios no carregamento inicial da página; resolver mensagens de erro "mudas" em `InputBase.vue`; unificar o ciclo de vida de validação sob o modelo *Pristine / Touched / Dirty*; e corrigir os estados de `loading` e renderização de slots de botões em `MaxButton` e `MaxIconButton`.

---

## 2. Arquivos Afetados

| Arquivo | Papel na Refatoração |
|---|---|
| [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue) | Altura dinâmica da linha de mensagem, `white-space: normal`, quebra de linha inteligente e fallback para erro mudo. |
| [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCpfCnpj.vue) | Vinculação estrita da checagem de obrigatoriedade (`required`) ao flag `hasBeenTouched`, evitando erro no carregamento. |
| [`src/components/MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCep.vue) | Eliminação de código morto/inalcançável em `error_msg`, introdução de `hasBeenTouched` e validação consistente. |
| [`src/components/MaxInputCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCard.vue) | Suavização de re-validação durante a digitação: validação em tempo real apenas com dígitos completos ou no `blur`. |
| [`src/components/MaxInputCreditCardDate.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCardDate.vue) | Alinhamento do ciclo de validação com o modelo `touched`. |
| [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButton.vue) | Detecção de slot padrão (`$slots.default`) para não degradar botões com texto para `MaxIconButton`. |
| [`src/components/MaxIconButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue) | Inclusão de `loading` no bloqueio de cliques (`isDisabled`) e renderização automática de ícone de spinner animado. |
| [`tests/components/InputBase.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/InputBase.test.ts) | Testes de renderização de mensagens multilinhas e fallback de mensagem para `done === false`. |
| [`tests/components/MaxInputCpfCnpj.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputCpfCnpj.test.ts) | Teste garantindo que campo obrigatório vazio inicial não exibe erro até receber foco e blur. |
| [`tests/components/MaxInputCep.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputCep.test.ts) | Teste de exibição de "Campo obrigatório" após interação do usuário em campo vazio. |
| [`tests/components/MaxIconButton.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxIconButton.test.ts) | Teste de desabilitação e exibição de loader com `loading: true`. |

---

## 3. Passo a Passo Detalhado da Implementação

### 3.1. `InputBase.vue`: Flexibilização de Mensagens e Eliminação de Erros Mudos

1. **Ajuste Estrutural de Grid e Altura da Mensagem**:
   - Alterar a definição de grid de linha rígida para expansão sob demanda:
     ```scss
     .max-input-main-div {
         display: grid !important;
         grid-template-rows: 36px minmax(19px, auto); /* Permite crescimento natural */
         position: relative;
         place-items: center;
         min-height: 55px; /* Mantém a densidade visual padrão quando vazia */
         height: auto;
     ```
2. **Eliminação do Truncamento Forçado (`ellipsis`)**:
   - Refatorar a classe `.input-message` e `.message-text`:
     ```scss
     .input-message {
         display: flex;
         align-items: flex-start;
         justify-content: flex-start;
         padding: 2px 4px 0 4px;
         color: var(--max-surface-400);
         min-height: 16px;
         height: auto;
         width: 100%;
         gap: 4px;
         overflow: visible;

         .message-icon {
             flex-shrink: 0;
             margin-top: 1px;
         }

         .message-text {
             font-size: 12px;
             font-weight: 400;
             line-height: 1.25;
             white-space: normal; /* Permite quebra de linha suave */
             word-break: break-word;
         }
     }
     ```
3. **Suporte à Prop Opcional `truncateMessage?: boolean`**:
   - Para cenários ultra-densos de tabelas ou filtros em linha onde o desenvolvedor deseja estritamente uma linha:
     - Se `props.truncateMessage === true`, aplica a classe auxiliar `.is-truncated` (`white-space: nowrap; text-overflow: ellipsis; overflow: hidden;`) e inclui o atributo `title="displayMessage"` para consulta via tooltip nativo acessível.
4. **Resolução de "Erro Mudo" (`done === false` sem mensagem)**:
   - Em `displayMessage`, quando o campo é avaliado como erro (`isError.value === true`) mas nenhuma mensagem foi provida por `error`, `caution` ou `message`:
     ```ts
     const displayMessage = computed(() => {
         if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
         if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
         const mainMsg = props.message ?? props.msg;
         if (hasContent(mainMsg)) return mainMsg;
         // Evita borda vermelha sem texto explicativo:
         if (isError.value) return 'Valor inválido';
         return '';
     });
     ```

### 3.2. `MaxInputCpfCnpj.vue`: Eliminação de Validação Prematura no Primeiro Render

1. **Vincular Erro de Obrigatoriedade a `hasBeenTouched`**:
   - Refatorar a computação de `error_msg`:
     ```ts
     const error_msg = computed<string | null>(() => {
         const attrs_error_message = (typeof props.error === 'string' ? props.error : null)
             ?? attrs.errMsg
             ?? attrs.error_message
             ?? attrs.error_msg
             ?? null;

         const only_numbers = onlyNumbers(temp_value.value ?? '');

         // CORREÇÃO: Não acusa erro de campo obrigatório se o usuário ainda não tocou no campo
         if (only_numbers.length === 0) {
             if (props.required && hasBeenTouched.value) {
                 return attrs_error_message ?? 'Campo obrigatório';
             }
             return null;
         }

         if (caution.value) {
             if (typeof attrs_error_message === 'string') return attrs_error_message;
             if (type_mask.value === 'cpf') return 'CPF inválido';
             if (type_mask.value === 'cnpj') return 'CNPJ inválido';
             return 'Documento inválido';
         }

         return attrs_error_message;
     });
     ```
2. **Garantir Registro do Evento `blur`**:
   - Assegurar que ao sair do campo (`@blur`), `hasBeenTouched.value = true` seja acionado determinísticamente.

### 3.3. `MaxInputCep.vue`: Correção de Fluxo e Remoção de Código Inalcançável

1. **Introduzir Controle de Toque (`hasBeenTouched`)**:
   - Declarar `const hasBeenTouched = ref(false);` e manipulador `@blur="hasBeenTouched = true"`.
2. **Reestruturar `caution` e `error_msg`**:
   - Reordenar a lógica para eliminar o curto-circuito que tornava a checagem de `required` inalcançável:
     ```ts
     const done = computed(() => {
         if (props.done !== undefined) return props.done ?? null;
         if (temp_value_numbers.value.length === 8) return isValidCep.value;
         return null;
     });

     const caution = computed(() => {
         if (props.caution !== undefined) return props.caution;
         if (!hasBeenTouched.value) return false;
         if (temp_value_numbers.value.length === 0) return props.required;
         return done.value === false;
     });

     const error_msg = computed(() => {
         if (!caution.value) return null;
         const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
         if (temp_value_numbers.value.length === 0 && props.required) {
             return attrs_error_message ?? 'Campo obrigatório';
         }
         if (temp_value_numbers.value.length > 0 && !isValidCep.value) {
             return attrs_error_message ?? 'CEP inválido';
         }
         return attrs_error_message;
     });
     ```

### 3.4. `MaxInputCreditCard.vue` e `MaxInputCreditCardDate.vue`: Suavização de Validação

1. **Evitar Acusar Erro a Cada Caractere Parcial**:
   - No `watch(unmaskedValue)`, só disparar `checkDone()` se o campo estiver vazio ou se o número de dígitos atingir a capacidade total do cartão (16 dígitos) ou data (4 dígitos).
   - Enquanto o usuário estiver ativamente preenchendo os dígitos intermediários, não ativar o estado de erro até o evento `@blur`.

### 3.5. `MaxButton.vue` e `MaxIconButton.vue`: Suporte a `loading` e Resolução de Slots

1. **Em `MaxButton.vue`**:
   - Corrigir a condição de renderização para suportar slots de texto sem prop `label`:
     ```html
     <button
         v-if="props.label || Boolean($slots.default)"
         type="button"
         class="max-button"
         :class="buttonClasses"
         :disabled="props.disabled || props.loading"
         @click="onClick"
     >
         <MaxIcon
             v-if="showIcon && iconPos === 'left'"
             :icon="loading ? 'eos-icons:loading' : (props.icon ?? props.i)"
             ...
         />
         <span class="max-button-label">
             <slot>{{ props.label }}</slot>
         </span>
         ...
     </button>
     <MaxIconButton v-bind="props" v-else />
     ```
2. **Em `MaxIconButton.vue`**:
   - Adicionar `loading` ao cálculo de `isDisabled`:
     ```ts
     const isDisabled = computed(() => Boolean(props.disabled || props.loading || (attrs.disabled !== undefined && attrs.disabled !== false)));
     ```
   - Renderizar o ícone animado de loading automaticamente quando `props.loading === true`:
     ```html
     <slot>
         <MaxIcon
             v-if="props.loading"
             icon="eos-icons:loading"
             :size="size"
         />
         <MaxIcon
             v-else
             pointer
             :icon="props.icon"
             :i="props.i"
             ...
         />
     </slot>
     ```

---

## 4. Regras de Usabilidade e Padrões do GEMINI.md

1. **Comunicação Semântica de Feedback**:
   - Todas as mensagens inline continuam vinculadas via `aria-describedby` ao input real e com `aria-live="polite"` no contêiner de mensagem.
   - Textos de erro respeitam a cor semântica `--max-danger-500` e alertas `--max-warning-500`.
2. **Estilização Canônica no SCSS Scoped**:
   - Sem classes utilitárias inline.
   - Tipografia de mensagens em `12px`, altura de linha `1.25`, alinhamento proporcional com o ícone lateral.
3. **Prevenção de Duplo Clique**:
   - O bloqueio estrito em botões com `loading` ativo previne concorrência e chamadas assíncronas duplicadas em formulários críticos.

---

## 5. Critérios de Aceite e Testes Vitest Necessários

### Critérios de Aceite
- [ ] Mensagens longas de erro (ex.: 100 caracteres) quebram linhas harmoniosamente abaixo do input, sem corte por reticências nem sobreposição de outros elementos do formulário.
- [ ] Formulário com `MaxInputCpfCnpj` e `MaxInputCep` tendo `required: true` carrega com estado visual limpo (sem borda vermelha e sem mensagem de erro) até que o usuário foque e saia do campo sem preenchê-lo.
- [ ] Um campo com `done === false` sem mensagem explícita exibe o texto padrão "Valor inválido", eliminando o estado de erro "mudo".
- [ ] `<MaxButton>Salvar Alterações</MaxButton>` sem passar a prop `label` renderiza como um botão padrão completo estilizado e não como um ícone reduzido de 16x16.
- [ ] `<MaxIconButton :loading="true" />` exibe o ícone de spinner e impede cliques no botão.

### Bateria de Testes Vitest a Implementar / Atualizar
1. `tests/components/InputBase.test.ts`:
   - `test('renderiza mensagem de erro sem truncamento por padrao')`
   - `test('exibe mensagem fallback quando done=false e nenhuma mensagem for fornecida')`
   - `test('aplica truncamento somente se truncateMessage=true')`
2. `tests/components/MaxInputCpfCnpj.test.ts`:
   - `test('nao exibe erro de obrigatoriedade na montagem inicial')`
   - `test('exibe erro de campo obrigatorio apos foco e blur com campo vazio')`
3. `tests/components/MaxInputCep.test.ts`:
   - `test('exibe Campo obrigatorio apos interacao e saida de campo vazio')`
   - `test('exibe CEP invalido quando preenchido parcialmente')`
4. `tests/components/MaxIconButton.test.ts`:
   - `test('desabilita botao quando loading=true e renderiza icone de carregamento')`
5. `tests/components/MaxButton.test.ts`:
   - `test('renderiza botao normal quando conteudo for passado apenas via slot default')`

---

## 6. Mitigação de Riscos de Regressão

- **Risco de Deslocamento de Linhas em Grids Rígidos**: A flexibilização da altura da mensagem pode empurrar linhas inferiores para baixo em formulários com validações ativas.
  - *Mitigação*: Este é o comportamento padrão e esperado de design systems modernos (como Shadcn UI, Vuetify e Material Design). O contêiner de grid flexibilizado previne sobreposição de campos adjacentes.
- **Risco de Quebra de Testes Existentes que Esperavam `is_done` Imediato**:
  - *Mitigação*: Atualizar as fixtures de teste para simular o evento `blur` ou chamar `checkDone()` antes de verificar as asserções de erro.
