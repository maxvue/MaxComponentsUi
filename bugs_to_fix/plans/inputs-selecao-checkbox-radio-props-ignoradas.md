# MaxInputCheckbox força `binary` e MaxInputRadio não declara emits/props usados

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputCheckbox.vue:3`, `src/components/MaxInputCheckbox.vue:16-21`, `src/components/MaxInputRadio.vue:3-6`
- **Domínio:** inputs-selecao-arquivo

## Problema

**MaxInputCheckbox — seleção múltipla impossível.** A linha 3 crava `binary` no `Checkbox` do PrimeVue:

```vue
<Checkbox v-bind="props" v-model="temp_value" :inputId="id" binary class="check-box" />
```

`binary` é um atributo estático, não vinculado — não há como desligá-lo. Combinado com `modelValue: boolean` (linha 17) e default `false` (linha 20), o componente só suporta o modo booleano. O caso de uso padrão de checkbox — um grupo de checkboxes compartilhando um array como model, com cada um contribuindo seu `value` — é impossível: nem existe prop `value` declarada.

Como `v-bind="props"` repassa apenas `modelValue` e `label` (as duas únicas props declaradas, linhas 17-18), passar `:value="'a'"` da app não funciona; o atributo cai como fallthrough no `<div>` raiz (linha 2), não no `Checkbox`.

O componente também não declara nenhuma prop de acessibilidade nem `disabled`: um `:disabled="true"` passado pela app vira atributo do `<div>` raiz e o checkbox continua clicável.

**MaxInputRadio — props consumidas só via attrs.** O template lê `attrs.label` (linha 4) e `attrs.icon` (linha 5), mas nem `label` nem `icon` são declaradas em `defineProps` (linhas 16-20, que só declara `modelValue`, `value` e `name`). Consequências:
- Não há tipagem nem autocomplete para as duas props mais usadas do componente.
- O `v-bind="attrs"` da linha 3 repassa `label` e `icon` ao `RadioButton` do PrimeVue junto com tudo mais, que não os reconhece — caem como atributos DOM no input (`label="..."`, `icon="..."`).
- O `<Icon>` da linha 5 é usado sem estar importado no `<script setup>` (linhas 9-41 não têm import de `Icon`), dependendo de registro global — diferente dos componentes irmãos do domínio, que importam `MaxIcon` explicitamente (ex.: `MaxTagSelect.vue:44`, `MaxListBox.vue:93`).

Nota: o `<div>` como raiz nos dois componentes é a exceção **documentada e intencional** do CLAUDE.md e não é objeto deste achado.

## Impacto

O `MaxInputCheckbox` não atende ao caso de uso mais comum de checkbox (grupo com model em array), e ignora silenciosamente `disabled` e `value`. O `MaxInputRadio` tem sua API principal (`label`, `icon`) fora do contrato tipado, o que significa nenhuma verificação para as apps e poluição de atributos no DOM. O `Icon` não importado é um acoplamento implícito a registro global que quebra se o componente for usado fora do `install()` da biblioteca.

## Plano de correção

**MaxInputCheckbox:**
1. Declarar `value?: any` e `binary?: boolean` (default `true`, preservando o comportamento atual como padrão) e ligar `:binary="props.binary"` em vez do atributo estático.
2. Ampliar `modelValue` para `boolean | any[]`, permitindo o modo de grupo.
3. Declarar `disabled?: boolean` e repassá-lo explicitamente ao `Checkbox`.
4. Repassar `value` ao `Checkbox` para o modo não-binário.

**MaxInputRadio:**
1. Declarar `label?: string` e `icon?: string` em `defineProps` e trocar os usos de `attrs.label`/`attrs.icon` no template pelas props.
2. Filtrar `label`/`icon` do `v-bind="attrs"` da linha 3 (ou passar só o que o `RadioButton` entende), evitando que virem atributos DOM.
3. Importar `MaxIcon` explicitamente e usá-lo no lugar do `<Icon>` global.
4. Declarar `disabled?: boolean` e respeitá-lo também no `onClick` (linhas 34-40), que hoje dispara o clique no input sem verificar estado desabilitado.

## Verificação

- Novo teste em `tests/components/MaxInputCheckbox.test.ts`: com `binary: false`, `value: 'a'` e `modelValue: []`, clicar adiciona `'a'` ao array emitido.
- Teste de `disabled`: com `disabled: true`, o clique não emite `update:modelValue`.
- Teste de regressão: o modo binário default continua emitindo `true`/`false`.
- Novo teste em `tests/components/MaxInputRadio.test.ts`: `label` e `icon` passados como props aparecem no template e **não** como atributos do input renderizado.
- Teste de `disabled` no radio: `onClick` não propaga o clique.
- `npx vitest run tests/components/MaxInputCheckbox.test.ts tests/components/MaxInputRadio.test.ts`.
