# Nenhum input de texto consome o slot prop `inputId`: label e mensagem ficam sem associação ARIA

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/InputBase.vue:11`, `src/components/InputBase.vue:27`, `src/components/InputBase.vue:53`, `src/components/InputBase.vue:167-168`
- **Domínio:** inputs-texto

## Problema

O `InputBase` gera um id por instância e o oferece aos filhos:

```html
<label :for="input_id" ...>
...
<slot :input-id="input_id" :message-id="message_id"></slot>
...
<div class="input-message" :id="message_id" aria-live="polite" :role="isError ? 'alert' : undefined">
```

Os comentários nas linhas 4-9 e 17-21 reconhecem explicitamente que a associação "só tem efeito quando um filho futuro aplicar `:id="inputId"` no seu input" e que é "inerte" até lá.

Esse futuro não chegou. Buscando `inputId`/`input-id` em `src/components/*.vue`, os únicos consumidores são `MaxInputCheckbox.vue:3` e `MaxInputRadio.vue:3` — e eles usam um `id` próprio, não o slot prop do `InputBase` (aliás, são justamente os componentes que, por decisão documentada no CLAUDE.md, **não** usam `InputBase`).

**Nenhum** dos inputs de texto/número/máscara aplica `:id="inputId"` nem `:aria-describedby="messageId"`:

- `MaxInputText.vue:11-19` — `<input>` sem `id`
- `MaxInputTextArea.vue:3-15` — `<textarea>` sem `id`
- `MaxInputTextList.vue:7-16` — `<textarea>` sem `id`
- `MaxInputNumber.vue:3`, `MaxInputSearch.vue:3`, `MaxInputCep.vue:3`, `MaxInputCpfCnpj.vue:3`, `MaxInputPhoneMail.vue:3`, `MaxPhoneField.vue:25`, `MaxInputCreditCard.vue:3`, `MaxInputCreditCardCvv.vue:3`, `MaxInputCreditCardDate.vue:3`, `MaxInputCoordinateDecimalLat.vue:3`, `MaxInputCoordinateDecimalLng.vue:3` — idem

Consequências concretas do estado atual:

1. `<label for="v-0">` aponta para um elemento que não existe — clicar no rótulo não foca o campo.
2. Leitores de tela não anunciam o rótulo ao focar o input (não há `for`/`id` válido nem `aria-label`).
3. A mensagem de erro (`#{input_id}-message`) nunca é referenciada por `aria-describedby` de nenhum input, então o erro não é anunciado ao focar o campo — apenas o `aria-live` dispara no momento em que o texto muda, o que não ajuda quem navega até o campo depois.
4. `aria-invalid` fica no `<div>` wrapper (linha 23), não no controle — o comentário na linha 17-21 admite que "não é o padrão ARIA ideal". Um `<div aria-invalid>` não tem semântica de campo de formulário e é ignorado pela maioria das tecnologias assistivas.

## Impacto

Todos os campos de formulário de texto da biblioteca são inacessíveis por rótulo para usuários de leitor de tela, e o estado de erro não é comunicado. Para uma biblioteca de componentes usada em cadastros (CPF, CEP, telefone, cartão), isso atinge todas as telas de formulário das aplicações consumidoras de uma vez. Também quebra a expectativa básica de "clicar no label foca o campo" para todos os usuários.

## Plano de correção

1. Adotar o slot prop em cada componente do domínio, começando pelos mais usados (`MaxInputText`, `MaxInputTextArea`, `MaxInputNumber`):
   ```html
   <InputBase v-bind="props" ...>
       <template #default="{ inputId, messageId }">
           <input :id="inputId" :aria-describedby="messageId" :aria-invalid="isError || undefined" ... />
       </template>
   </InputBase>
   ```
2. Nos componentes que envolvem `InputText`/`InputNumber` do PrimeVue, passar `:id` e `:aria-describedby` como props — ambos repassam para o `<input>` interno.
3. Depois que todos os filhos aplicarem o `id`, remover o `aria-invalid` do `<div class="max-input-field-div">` (linha 23) e o comentário que o justificava, movendo-o para os inputs reais.
4. Fazer o mesmo com o indicador de obrigatório: hoje o `*` é `aria-hidden` (linha 48, corretamente), mas falta o `aria-required` no controle real — adicioná-lo junto com o `id`.
5. Tratar como uma migração por lote, um componente por vez, para não quebrar os testes existentes que consultam `wrapper.find('input')`.

## Verificação

- Por componente: teste que monta com `label: 'Nome'` e afirma que `wrapper.find('label').attributes('for')` é igual a `wrapper.find('input').attributes('id')` e que ambos são não-vazios.
- Teste que, com `error: 'msg'`, o input tem `aria-describedby` apontando para o `id` do `.input-message` e `aria-invalid="true"`.
- Teste que, com `required: true`, o input tem `aria-required="true"`.
- Os testes atuais em `tests/components/InputBase.test.ts` não verificam nenhuma dessas associações — a suíte precisa ser estendida junto com a correção.
