# Plano de Implementação: Conexão Acessível Sistêmica entre InputBase e Componentes de Formulário

## 1. Objetivo da Refatoração

Eliminar a quebra sistêmica de acessibilidade e usabilidade gerada pelo isolamento do wrapper universal `InputBase.vue` em relação aos seus mais de 20 componentes de formulário dependentes. 

A arquitetura atual gera identificadores com `useId()` (`input_id` e `message_id`) no `InputBase`, mas nenhum componente filho consome esses dados via slot scoped props. Como consequência:
1. Os elementos nativos `<input>`, `<textarea>` e controles interativos ficam órfãos de `<label for="...">`.
2. As mensagens de erro e feedback visual não são conectadas aos campos via `aria-describedby`.
3. Os estados de obrigatoriedade (`aria-required`) e erro (`aria-invalid`) são perdidos ou posicionados em `divs` intermediárias ignoradas por leitores de tela.
4. Clicar no texto do `<label>` não transfere o foco do cursor para o controle nativo devido à ausência de correspondência de ID e ao uso de `pointer-events: none` no CSS.

Este plano estabelece a infraestrutura técnica e o roteiro exato para a adoção universal das scoped props do `InputBase`, padronizando o vínculo semântico em toda a biblioteca.

---

## 2. Arquivos Afetados

### Infraestrutura Base
- [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue) — Ajuste das scoped props expostas, remoção de `pointer-events: none` no label e provisão de contexto reativo via provide/inject para componentes com múltiplos níveis de aninhamento.

### Componentes de Formulário (Consumidores do InputBase)
- [`src/components/MaxInputText.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputText.vue)
- [`src/components/MaxInputNumber.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputNumber.vue)
- [`src/components/MaxInputTextArea.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTextArea.vue)
- [`src/components/MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSearch.vue)
- [`src/components/MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCep.vue)
- [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCpfCnpj.vue)
- [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue)
- [`src/components/MaxInputCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCard.vue)
- [`src/components/MaxInputCreditCardCvv.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCardCvv.vue)
- [`src/components/MaxInputCreditCardDate.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCreditCardDate.vue)
- [`src/components/MaxInputCoordinateDecimalLat.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCoordinateDecimalLat.vue)
- [`src/components/MaxInputCoordinateDecimalLng.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCoordinateDecimalLng.vue)
- [`src/components/MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue)
- [`src/components/MaxInputPhoneMail.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhoneMail.vue)
- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue)
- [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue)
- [`src/components/MaxColorPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxColorPicker.vue)
- [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue)
- [`src/components/MaxInputOTP.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputOTP.vue)
- [`src/components/MaxInputSwitch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSwitch.vue)
- [`src/components/MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue)
- [`src/components/MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue)
- [`src/components/MaxInputTextList.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTextList.vue)
- [`src/components/MaxInputMarkdown.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdown.vue)

### Testes
- [`tests/components/InputBase.accessibility.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/InputBase.accessibility.test.ts) (Novo arquivo de validação de acessibilidade integrada de formulários)
- Suítes de testes unitários existentes em `tests/components/` para cada input afetado.

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Enriquecimento das Scoped Props e Ajuste de Estilos no `InputBase.vue`
1. **Contrato de Scoped Props**:
   No `InputBase.vue`, atualizar a declaração do slot principal para expor um objeto semântico completo:
   ```vue
   <div class="input-slot-div">
       <slot
           :input-id="input_id"
           :message-id="message_id"
           :is-error="isError"
           :is-required="Boolean(props.required)"
           :has-message="Boolean(displayMessage)"
           :display-message="displayMessage"
       ></slot>
   </div>
   ```
2. **Contexto Provide/Inject Alternativo (`maxInputBaseContext`)**:
   Em `src/helpers/inputBaseContext.ts`, criar uma interface e constantes tipadas (`provideInputBaseContext` / `useInputBaseContext`) para permitir que componentes filhos compostos ou profundos também acessem os IDs reativamente caso não queiram desestruturar o template slot.
3. **Remoção de `pointer-events: none` no Label**:
   Em `InputBase.vue` (`<style lang="scss" scoped>`):
   - Localizar a classe `.max-input-label` e substituir `pointer-events: none;` por `pointer-events: auto; cursor: pointer;`.
   - Garantir que tanto `.max-input-label` quanto `.in-line-label` possuam `cursor: pointer;` para que o clique do usuário transfira nativamente o foco para o elemento referenciado pelo atributo `for`.
4. **Delegação de `aria-invalid`**:
   - Manter `:aria-invalid="isError ? 'true' : undefined"` no wrapper como fallback, mas garantir que o atributo canônico seja aplicado diretamente no `<input>` nativo pelo componente filho.

### Passo 2: Implementação nos Inputs de Texto Simples e Área de Texto
Para componentes que renderizam elementos nativos padrão (`MaxInputText`, `MaxInputTextArea`, `MaxInputSearch`, `MaxInputNumber`):
1. **Estrutura do Template**:
   Consumir a slot prop `#default="{ inputId, messageId, hasMessage }"`:
   ```vue
   <!-- Exemplo: MaxInputText.vue -->
   <template>
       <InputBase
           v-bind="props"
           class="max-input-text"
           :done="props.done ?? isDone"
           :error="props.error ?? error_msg"
           :caution="caution"
       >
           <template #default="{ inputId, messageId, hasMessage }">
               <input
                   :id="inputId"
                   class="max-input-native"
                   :type="props.type"
                   :placeholder="props.placeholder"
                   :disabled="props.disabled"
                   :spellcheck="resolvedSpellcheck"
                   :value="temp_value"
                   :aria-invalid="Boolean(props.error ?? error_msg) || undefined"
                   :aria-required="Boolean(props.required) || undefined"
                   :aria-describedby="hasMessage ? messageId : undefined"
                   @input="temp_value = ($event.target as HTMLInputElement).value"
                   @blur="isDone = testIsDone()"
               />
               <slot></slot>
           </template>
       </InputBase>
   </template>
   ```
2. **Ajuste em `MaxInputTextArea.vue`**:
   Aplicar `:id="inputId"`, `:aria-describedby="hasMessage ? messageId : undefined"`, `:aria-invalid` e `:aria-required` diretamente na tag `<textarea class="max-input-native">`.
3. **Ajuste em `MaxInputNumber.vue`**:
   Aplicar no input numérico (`inputmode="decimal"`), preservando as diretivas existentes (`ref="inputRef"`, `@input="onInput"`, etc.).

### Passo 3: Implementação nos Inputs Mascarados e Formatados
Nos componentes especializados com máscara (`MaxInputCep`, `MaxInputCpfCnpj`, `MaxInputCreditCard`, `MaxInputCreditCardCvv`, `MaxInputCreditCardDate`, `MaxInputCoordinateDecimalLat`, `MaxInputCoordinateDecimalLng`, `MaxInputPhone`, `MaxInputPhoneMail`):
1. Capturar `#default="{ inputId, messageId, hasMessage }"`.
2. Aplicar `:id="inputId"`, `:aria-describedby="hasMessage ? messageId : undefined"` e `:aria-required="Boolean(props.required) || undefined"` no elemento `<input>`.
3. Para `MaxInputCreditCard`, certificar-se de que os três campos (Número, Data, CVV) mantenham IDs únicos se usados isoladamente ou em conjunto, respeitando seus respectivos rótulos.

### Passo 4: Implementação nos Seletores Compostos e Overlays
Nos controles que não utilizam `<input>` nativo como controle primário ou que utilizam padrões ARIA combobox/listbox (`MaxInputSelect`, `MaxTagSelect`, `MaxInputDatePicker`, `MaxColorPicker`, `MaxChips`, `MaxInputOTP`, `MaxInputSwitch`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`):
1. **`MaxInputSelect` e `MaxTagSelect`**:
   - O gatilho interativo com `role="combobox"` deve receber `:id="inputId"`.
   - Vincular `:aria-describedby="hasMessage ? messageId : undefined"`.
   - Adicionar `:aria-required="Boolean(props.required) || undefined"` e `:aria-invalid="Boolean(props.error) || undefined"`.
2. **`MaxInputDatePicker`**:
   - O elemento interativo é o `<input class="max-datepicker-input">`. Ele deve receber `:id="inputId"`, `:aria-describedby="hasMessage ? messageId : undefined"`, `:aria-invalid="Boolean(errorMessage) || undefined"` e `:aria-required="Boolean(props.required) || undefined"`.
3. **`MaxInputSwitch`**:
   - Como o switch é baseado em `<button role="switch">` encapsulado pelo `InputBase`, o `<button>` deve receber `:id="inputId"`, `:aria-describedby="hasMessage ? messageId : undefined"`, além de `:aria-checked="modelValue"`.
4. **`MaxColorPicker`**:
   - O botão de abertura do popover de cor recebe `:id="inputId"`, `:aria-describedby="hasMessage ? messageId : undefined"` e `aria-haspopup="dialog"`.
5. **`MaxInputOTP`**:
   - O `InputBase` fornece o `inputId`. O primeiro campo de dígito recebe `:id="`${inputId}-0`"` e o container de inputs recebe `role="group"` com `:aria-labelledby="`${inputId}-label`"` ou o primeiro input consome o `inputId` diretamente para transferir o foco ao clicar no label.

### Passo 5: Preservação de Fallthrough e Regras Arquiteturais
- Respeitar a regra técnica expressa em `CLAUDE.md`: `v-bind="props"` permanece no nó raiz `InputBase`.
- Os atributos nativos específicos repassados explicitamente (`id`, `aria-describedby`, `aria-invalid`, `aria-required`) pertencem estritamente ao elemento interativo em foco dentro do slot.

---

## 4. Padrões WCAG 2.1/2.2 e Diretrizes do GEMINI.md

| Critério WCAG | Nível | Como a Implementação Cumpre o Padrão |
|---|---|---|
| **1.3.1 Info and Relationships** | A | Todo `<label :for="input_id">` possui correspondência unívoca com `:id="inputId"` no elemento focável, preservando a relação programática na árvore de acessibilidade. |
| **3.3.1 Error Identification** | A | Quando uma mensagem de validação é renderizada, `:aria-describedby="messageId"` conecta o texto de erro ao campo em foco, permitindo que o leitor de tela o anuncie imediatamente. |
| **3.3.2 Labels or Instructions** | A | O nome acessível (*accessible name*) é formalizado pelo `<label>`, sem depender de atributos voláteis como `placeholder`. |
| **4.1.2 Name, Role, Value** | A | Todos os controles declaram seus estados corretos (`aria-required`, `aria-invalid`, `aria-expanded`, `role="combobox"`, `role="switch"`). |

### Diretrizes de Estilização (GEMINI.md)
- Zero classes utilitárias no template (proibido `class="flex mt-2"`).
- Estilização exclusivamente em `<style lang="scss" scoped>`.
- Aninhamento SCSS espelhando a árvore do template:
  ```scss
  .max-input-base {
      .max-input-label {
          cursor: pointer;
          pointer-events: auto;
      }
  }
  ```

---

## 5. Critérios de Aceite e Verificação Técnica

### Critérios de Aceite
1. **Associação de Label**:
   - Inspecionar o DOM de qualquer um dos 24 componentes de entrada e verificar que o valor do atributo `for` na tag `<label>` é idêntico ao atributo `id` do elemento focável (`<input>`, `<textarea>`, ou `role="combobox"`).
   - Clicar visualmente no texto da `<label>` deve transferir imediatamente o foco (`document.activeElement`) para o campo de entrada correspondente.
2. **Leitura de Mensagens de Validação**:
   - Ao passar uma prop `error="CPF incorreto"`, o elemento de mensagem deve possuir `:id="`${inputId}-message`"` e o `<input>` deve possuir `aria-describedby="`${inputId}-message`"`.
   - O `<input>` deve conter `aria-invalid="true"`.
3. **Obrigatoriedade**:
   - Quando `props.required` for verdadeiro, o elemento de entrada ativo deve possuir `aria-required="true"`.
4. **Ausência de Erros de Lint e Tipos**:
   - `npm run type-check` (vue-tsc) deve passar com 0 erros.
   - `npm run lint` (ESLint e Stylelint) deve passar com 0 erros.

### Suíte de Testes Automatizados (`tests/components/InputBase.accessibility.test.ts`)
Criar suíte que testa programmaticamente a integração:
```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';

describe('Acessibilidade Form Controls + InputBase', () => {
    it('deve associar label for com id do input nativo em MaxInputText', () => {
        const wrapper = mount(MaxInputText, {
            props: { label: 'Nome Completo', modelValue: '' }
        });
        const label = wrapper.find('label');
        const input = wrapper.find('input.max-input-native');
        expect(label.exists()).toBe(true);
        expect(input.exists()).toBe(true);
        expect(label.attributes('for')).toBe(input.attributes('id'));
    });

    it('deve vincular aria-describedby e aria-invalid no input nativo quando houver erro', () => {
        const wrapper = mount(MaxInputText, {
            props: { label: 'E-mail', modelValue: '', error: 'E-mail inválido' }
        });
        const input = wrapper.find('input.max-input-native');
        const message = wrapper.find('.input-message');
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
    });

    it('deve vincular aria-required no input nativo quando required for true', () => {
        const wrapper = mount(MaxInputText, {
            props: { label: 'Senha', modelValue: '', required: true }
        });
        const input = wrapper.find('input.max-input-native');
        expect(input.attributes('aria-required')).toBe('true');
    });

    it('deve associar label for ao role=combobox no MaxInputSelect', () => {
        const wrapper = mount(MaxInputSelect, {
            props: { label: 'Estado', options: [{ label: 'SP', value: 'sp' }] }
        });
        const label = wrapper.find('label');
        const combobox = wrapper.find('[role="combobox"]');
        expect(label.attributes('for')).toBe(combobox.attributes('id'));
    });
});
```

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **Conflito de ID com `id` passado explicitamente pelo consumidor via attrs** | Média | Alto | Se o consumidor fornecer uma prop `id="meu-id-customizado"`, o `InputBase` deve respeitar `props.id || useId()`, propagando o mesmo ID tanto para o `<label for>` quanto para a slot prop. |
| **Quebra de Fallthrough de Classes ou Atributos** | Baixa | Médio | Nenhuma alteração na localização de `v-bind="props"` ou `attrs` no root de `InputBase`. Apenas os atributos de acessibilidade específicos são passados via slot props aos nós filhos. |
| **Inputs que já customizam o slot default** | Baixa | Médio | Como a slot prop é opcional no Vue (`v-slot="{ inputId }"`), qualquer uso legado de slot sem desestruturação continua funcionando sem quebras de runtime. |
| **Regressão Visual no Label Flutuante (`FloatLabel`)** | Baixa | Baixo | A alteração de `pointer-events: auto` no label não afeta a geometria, cores ou animações calculadas pelo CSS do FloatLabel. |
