# Quebra Sistêmica na Associação Acessível de Rótulos, Mensagens de Erro e Estados ARIA entre `InputBase` e Componentes de Formulário

## Severidade: Crítica

## Componentes Impactados
- `src/components/InputBase.vue`
- `src/components/MaxInputText.vue`
- `src/components/MaxInputNumber.vue`
- `src/components/MaxInputTextArea.vue`
- `src/components/MaxInputCep.vue`
- `src/components/MaxInputCpfCnpj.vue`
- `src/components/MaxInputDatePicker.vue`
- `src/components/MaxInputCreditCard.vue`
- `src/components/MaxInputCreditCardCvv.vue`
- `src/components/MaxInputCreditCardDate.vue`
- `src/components/MaxInputCoordinateDecimalLat.vue`
- `src/components/MaxInputCoordinateDecimalLng.vue`
- `src/components/MaxInputPhone.vue`
- `src/components/MaxInputPhoneMail.vue`
- `src/components/MaxInputSearch.vue`
- `src/components/MaxInputSelect.vue`
- `src/components/MaxTagSelect.vue`
- `src/components/MaxColorPicker.vue`
- `src/components/MaxChips.vue`
- `src/components/MaxInputOTP.vue`
- `src/components/MaxInputSwitch.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. Usuários de leitores de tela (NVDA, JAWS, VoiceOver, TalkBack) que navegam por qualquer formulário da biblioteca ouvem anúncios genéricos como "edição de texto sem rótulo" (*unlabeled edit field*), ou o leitor de tela recorre precariamente ao atributo `placeholder`, cujo texto desaparece assim que o usuário digita o primeiro caractere.
2. Clicar no rótulo (`<label>`) não transfere o foco para o campo de texto correspondente em nenhum dos inputs empacotados por `InputBase`.
3. Quando um campo entra em estado de erro ou alerta (ex.: "CPF inválido" ou "Campo obrigatório"), a mensagem exibida visualmente na parte inferior (`input-message`) **não é anunciada** pelo leitor de tela no momento em que o campo recebe o foco.
4. O leitor de tela não anuncia se o campo é obrigatório nem se ele está atualmente em estado inválido.

### Causa Raiz Profunda
O design system instituiu o `InputBase.vue` como wrapper universal obrigatório para todos os campos de formulário da biblioteca. No `InputBase.vue`:
1. Gera-se um identificador único com `useId()` (`input_id`), associando o elemento `<label>` através de `:for="input_id"`, e a mensagem de validação recebe `:id="message_id"` (`${input_id}-message`).
2. O `InputBase` expõe essas propriedades via slot props com `<slot :input-id="input_id" :message-id="message_id"></slot>`.
3. **Contudo, nenhum dos componentes filhos consumidores de `InputBase` captura ou vincula essas slot props.** Os componentes filhos abrem `<InputBase>` e renderizam `<input>`, `<textarea>` ou controles customizados sem declarar `v-slot="{ inputId, messageId }"`, deixando os elementos nativos de entrada sem atributo `id` e sem `aria-describedby`.
4. O atributo `:for` do `<label>` aponta para um `id` órfão que não existe no DOM, rompendo a relação semântica do HTML.
5. Em vez de delegar `aria-invalid` para o controle que recebe o foco do teclado, o `InputBase` o posiciona na `div.max-input-field-div` intermediária, atributo ignorado pelos leitores de tela quando o elemento ativo em foco é o `<input>` dentro do slot.
6. O indicador de campo obrigatório (`required`) resume-se a um asterisco visual renderizado com `aria-hidden="true"`, sem que a propriedade `required` ou `aria-required="true"` seja propagada ao `<input>` ativo.

---

## Evidência Técnica com Trechos e Caminhos de Arquivo

### 1. `src/components/InputBase.vue` (Linhas 28–53 e 78–94)
O template do wrapper gera a infraestrutura de IDs, mas documenta a quebra em comentários sem que a adoção tenha sido efetuada nos filhos:

```vue
<!-- Trecho de src/components/InputBase.vue -->
<!-- INPUT LABEL -->
<!--
    `for` aponta para `input_id`, o id exposto via slot prop `inputId`.
    O elemento real de input vive dentro do `<slot>` (controlado pelo
    componente filho), entao a associacao so tem efeito quando um filho
    futuro aplicar `:id="inputId"` no seu input. Ate la isso e inerte,
    nao um erro funcional.
-->
<label :for="input_id" :class="inLine ? 'in-line-label' : 'max-input-label'" v-if="props.label" >
    {{ props.label }}
</label>

<!-- INPUT FIELD -->
<div class="max-input-field-div" :aria-invalid="isError ? 'true' : undefined">
    ...
    <div class="input-slot-div">
        <slot :input-id="input_id" :message-id="message_id"></slot>
    </div>
    ...
    <div class="required" v-else-if="required && !noStatus" aria-hidden="true">*</div>
</div>

<!-- INPUT MESSAGE -->
<div
    class="input-message"
    :id="message_id"
    aria-live="polite"
    :role="isError ? 'alert' : undefined"
    v-if="!props.noStatus"
>
```

### 2. `src/components/MaxInputText.vue` (Linhas 1–23)
O componente não utiliza o slot prop, deixando o `<input>` nativo totalmente anônimo:

```vue
<!-- Trecho de src/components/MaxInputText.vue -->
<template>
    <InputBase v-bind="props" class="max-input-text" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution">
        <input
            class="max-input-native"
            :type="props.type"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :spellcheck="resolvedSpellcheck"
            :value="temp_value"
            @input="temp_value = ($event.target as HTMLInputElement).value"
            @blur="isDone = testIsDone()"
        />
        <slot></slot>
    </InputBase>
</template>
```

### 3. `src/components/MaxInputNumber.vue` (Linhas 1–15)
Mesmo padrão de desconexão:

```vue
<!-- Trecho de src/components/MaxInputNumber.vue -->
<template>
    <InputBase class="max-input-number" v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <input
            ref="inputRef"
            type="text"
            inputmode="decimal"
            class="max-input-native max-inputnumber"
            :value="displayValue"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
    </InputBase>
</template>
```

### 4. `src/components/MaxInputCep.vue` (Linhas 1–5)
```vue
<!-- Trecho de src/components/MaxInputCep.vue -->
<template>
    <InputBase v-bind="props" class="max-input-cep input-base-cep-main-div" :value="temp_value" :done="done ?? undefined" :caution="caution" :error="error_msg ?? undefined" :icon-right="loading ? 'line-md:loading-loop' : undefined">
        <input type="text" inputmode="numeric" class="max-input-native" v-model="temp_value" v-maska="maskValue" placeholder="00000-000" />
    </InputBase>
</template>
```

---

## Impacto na Usabilidade e Conformidade com WCAG

| Critério WCAG | Nível | Descrição do Impacto |
|---|---|---|
| **1.3.1 Info and Relationships** | A | Falha direta: a informação visual do `<label>` e o relacionamento programático com o campo de entrada não são preservados no código, rompendo a árvore de acessibilidade. |
| **3.3.1 Error Identification** | A | Falha: mensagens de erro visíveis não são associadas ao campo através de `aria-describedby` ou `aria-errormessage`. O usuário com deficiência visual não sabe qual erro ocorreu ao focar o campo. |
| **3.3.2 Labels or Instructions** | A | Falha: campos não possuem identificadores programáticos associados ao seu rótulo instrutivo. |
| **4.1.2 Name, Role, Value** | A | Falha crítica: o Nome Acessível (*Accessible Name*) do controle de entrada fica indefinido ou vazio, dependendo de heurísticas frágeis de navegadores. |

### Recomendações de Correção
1. Em todos os componentes de formulário filhos de `InputBase`, adotar o slot padrão desestruturado:
   ```vue
   <template #default="{ inputId, messageId }">
       <input
           :id="inputId"
           :aria-describedby="displayMessage ? messageId : undefined"
           :aria-invalid="Boolean(isError) || undefined"
           :aria-required="Boolean(props.required) || undefined"
           ...
       />
   </template>
   ```
2. Garantir que componentes de seleção compostos (`MaxInputSelect`, `MaxTagSelect`, `MaxInputDatePicker`) apliquem o `inputId` no elemento interativo que recebe foco (`role="combobox"` ou `inputRef`).
