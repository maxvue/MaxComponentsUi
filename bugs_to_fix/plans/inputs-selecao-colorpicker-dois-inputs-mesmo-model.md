# MaxColorPicker liga dois controles ao mesmo `v-model` sem normalizar formato nem validar

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxColorPicker.vue:3-4`
- **Domínio:** inputs-selecao-arquivo

## Problema

O template liga dois controles independentes ao mesmo model:

```vue
<ColorPicker v-model="modelValue" :defaultColor="props.defaultColor" :format="props.format" ... />
<InputText v-model="modelValue" />
```

Três problemas decorrem disso:

1. **Formato inconsistente entre os dois controles.** O `ColorPicker` do PrimeVue, com `format: 'hex'` (default na linha 78), escreve hex **sem** o `#` — `'ff0000'`. Um usuário que digite no `InputText` naturalmente escreverá `'#ff0000'`. Os dois valores representam a mesma cor mas são strings diferentes, e o model oscila entre as duas convenções conforme o controle usado por último. A app consumidora recebe ora com `#`, ora sem.

2. **`InputText` sem validação alguma.** Qualquer texto digitado vai direto para o model: `'abc'`, `'vermelho'`, uma string vazia. Quando esse valor volta para o `ColorPicker`, o PrimeVue recebe algo que não consegue parsear. Não há máscara, nem validação de padrão hex, nem tratamento do formato `rgb`/`hsb` que a prop `format` (linha 27) permite selecionar.

3. **`disabled` não chega ao `InputText`.** A linha 3 repassa `:disabled="props.disabled"` ao `ColorPicker`, mas a linha 4 (`<InputText v-model="modelValue" />`) não recebe nada — nem `disabled`, nem `placeholder`, nem `ariaLabel`, nem `inputId`. Com `disabled: true`, o seletor visual trava mas o campo de texto continua editável, permitindo alterar a cor de um campo supostamente desabilitado.

A cadeia de validação do componente (`isEqual`, `isRequiredDone`, `testIsDone`, `caution`, `error_msg`, linhas 94-114) opera sobre esse model inconsistente, comparando strings via `toSearchableString` — então `targetValue: '#ff0000'` nunca casa com o `'ff0000'` que o `ColorPicker` produz, e o campo é marcado como inválido mesmo estando correto.

## Impacto

Valor de cor com formato imprevisível chegando ao backend, dependendo de qual dos dois controles o usuário tocou por último. Validação por `targetValue` quebrada pela divergência do `#`. E o `disabled` parcialmente ineficaz é um defeito funcional direto: o campo aceita edição quando não deveria.

## Plano de correção

1. **Normalizar o formato num único ponto.** Introduzir um computed intermediário com getter/setter que converta entre a representação interna (a do `ColorPicker`, sem `#`) e a representação pública do model (definir uma convenção — recomenda-se **com** `#` para hex, por ser o formato canônico em CSS e o que as apps esperam):
   ```ts
   const pickerValue = computed({
       get: () => String(modelValue.value ?? '').replace(/^#/, ''),
       set: (v) => { modelValue.value = props.format === 'hex' ? `#${String(v).replace(/^#/, '')}` : v; }
   });
   ```
   e ligar o `ColorPicker` a `pickerValue`.
2. **Validar a entrada de texto.** Ligar o `InputText` a um computed próprio que só grave no model quando o valor casar com o padrão do `format` escolhido (`/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i` para hex), e sinalizar erro pelo `error_msg` já existente quando não casar.
3. **Repassar os atributos ao `InputText`:** `:disabled="props.disabled"`, `:placeholder="props.placeholder"`, `:aria-label="props.ariaLabel"` e o `inputId` — hoje nenhum chega.
4. Documentar no JSDoc da prop `format` (linha 27) qual é a convenção de saída do model para cada formato.

## Verificação

- Novo teste em `tests/components/MaxColorPicker.test.ts`: alterar o valor pelo `ColorPicker` e pelo `InputText` deve produzir o **mesmo** formato no `update:modelValue`.
- Teste de `disabled`: com `disabled: true`, o `InputText` renderizado tem o atributo `disabled`.
- Teste de validação: digitar `'nao-e-cor'` no `InputText` não altera o model e ativa `caution`/`error_msg`.
- Teste de `targetValue`: com `targetValue: '#ff0000'` e a cor `#ff0000` selecionada no picker, `isDone` é verdadeiro (hoje falha pela divergência do `#`).
- `npx vitest run tests/components/MaxColorPicker.test.ts`.
