# MaxInputSearch não repassa nenhuma prop ao InputBase (label, ícone e mensagem ficam inertes)

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputSearch.vue:2-3`, `src/components/MaxInputSearch.vue:14-20`
- **Domínio:** inputs-texto

## Problema

O `InputBase` do MaxInputSearch recebe apenas duas coisas: uma classe fixa e o `iconRight`.

```html
<InputBase class="input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' :  'material-symbols:search-rounded'">
    <InputText type="text" v-bind="attrs" fluid v-model="temp_value" @input="onInput" />
</InputBase>
```

Não há `v-bind="props"` nem `v-bind="attrs"` no `InputBase` — todos os `attrs` vão para o `InputText` interno (linha 3). Como a interface de props declara só `modelValue` e `isLoading` (linhas 14-20), qualquer atributo de apresentação passado pelo consumidor cai no `<input>` do PrimeVue, onde não tem efeito:

- `label` — vira atributo `label` no `<input>`, o rótulo nunca é renderizado pelo `InputBase`
- `message` / `msg` / `iconMessage` — a linha de mensagem do `InputBase` fica sempre vazia
- `error` / `caution` / `done` / `required` — os estados visuais do `InputBase` nunca são acionados
- `float`, `inLine`, `disabled` — idem
- `icon` / `iconLeft` — sobrescritos na prática, já que só `iconRight` é passado

Isso destoa de todos os outros componentes do domínio, que fazem `v-bind="props"` no `InputBase`: `MaxInputText.vue:10`, `MaxInputTextArea.vue:2`, `MaxInputTextList.vue:2`, `MaxInputNumber.vue:2`, `MaxInputCep.vue:2`, `MaxInputCpfCnpj.vue:2`, `MaxInputPhoneMail.vue:2`, `MaxPhoneField.vue:2`, `MaxInputCreditCard.vue:2`, `MaxInputCreditCardCvv.vue:2`, `MaxInputCreditCardDate.vue:2`, `MaxInputCoordinateDecimalLat.vue:2`, `MaxInputCoordinateDecimalLng.vue:2`.

O CLAUDE.md descreve o `InputBase` como o wrapper que "fornece estados visuais: `done`, `error`, `caution`, `required`, `noStatus`" e "modo de label inline, linha de mensagem/feedback abaixo do campo" para **todos** os inputs de formulário. No MaxInputSearch nada disso é alcançável pelo consumidor.

Os testes em `tests/components/MaxInputSearch.test.ts` só exercitam `iconRight` (linhas 70-81), então a lacuna passa despercebida.

## Impacto

Consumidor que escreve `<MaxInputSearch v-model="q" label="Buscar cliente" required />` não vê rótulo nem indicador de obrigatório, e o atributo acaba poluindo o DOM do `<input>`. A API pública sugerida pela convenção da biblioteca (todos os inputs aceitam as props do `InputBase`) não vale para este componente, sem que nada documente a exceção — diferente de `MaxInputCheckbox`/`MaxInputRadio`/`MaxInputToggle`, cujas exceções estão registradas no CLAUDE.md.

## Plano de correção

1. Estender a interface de props para incluir `InputBaseProps` (`src/types/index.ts:114-141`), como já fazem `MaxInputCep.vue:23` e `MaxInputCpfCnpj.vue:25`:
   ```ts
   defineProps<InputBaseProps & { modelValue: string; isLoading?: boolean }>()
   ```
2. Aplicar `v-bind="props"` no `InputBase`, mantendo o `:iconRight` calculado depois do `v-bind` para que continue vencendo (ou respeitando um `iconRight` explícito do consumidor, se for a intenção).
3. Decidir e documentar o comportamento do ícone: hoje o `iconRight` é sempre imposto; se o consumidor puder sobrescrevê-lo, usar `props.iconRight ?? (isLoading ? ... : ...)`.
4. Manter `v-bind="attrs"` no `InputText` apenas para atributos genuínos de `<input>` (ex.: `autocomplete`, `maxlength`), agora que as props de apresentação passam a ser declaradas.

## Verificação

- Teste: montar com `{ label: 'Buscar' }` e afirmar que `wrapper.findComponent(InputBase).props('label') === 'Buscar'` e que o `<label>` é renderizado.
- Teste: montar com `{ error: 'Erro', required: true }` e afirmar que o `InputBase` recebe as props e aplica as classes `error`.
- Teste de não-regressão: `iconRight` continua alternando entre loading e search conforme `isLoading` (já coberto, linhas 70-81 do teste atual).
- `npx vitest run tests/components/MaxInputSearch.test.ts`.
