# MaxInputSwitch é um `<div>` clicável sem role, foco ou navegação por teclado

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputSwitch.vue:3-17`
- **Domínio:** inputs-selecao-arquivo

## Problema

O switch é construído inteiramente com `<div>`s:

```vue
<div :class="`max-switch-input ...`">
    <div class="max-switch-label left" v-if="has_left_label" @click="() => setValue(props.falseValue)"> ... </div>
    <div :class="`max-switch-toggle ...`" @click="toggleValue">
        <div class="max-switch-background"><div class="max-switch-button"></div></div>
    </div>
    <div class="max-switch-label right" v-if="has_right_label" @click="() => setValue(props.trueValue)"> ... </div>
</div>
```

Faltam todos os requisitos de um controle binário acessível:

- Nenhum `role="switch"` (nem `checkbox`), então leitores de tela anunciam o elemento como texto genérico, sem informar que é um controle.
- Nenhum `aria-checked` refletindo o estado — o estado só existe visualmente, via a classe `active`.
- Nenhum `tabindex`, então o controle é **inalcançável por teclado**: não recebe foco na navegação por Tab.
- Nenhum handler de `keydown` — mesmo se recebesse foco, Espaço/Enter não alternariam o valor.
- Nenhum `aria-disabled`; a prop `disabled` (linha 63) é respeitada apenas nos guards de `setValue`/`toggleValue` (linhas 100 e 107), invisível para tecnologia assistiva.
- Nenhuma associação com o `label` do `InputBase` (sem `aria-labelledby`/`aria-label`).

Isso contrasta com o comportamento do próprio `MaxListBox` do mesmo domínio, que faz o trabalho corretamente: `role="listbox"`, `tabindex`, `aria-disabled`, `aria-activedescendant`, `role="option"`, `aria-selected` e um `onKeydown` completo com setas/Home/End/Enter/Espaço (`src/components/MaxListBox.vue:20-49` e `529-559`). O padrão certo já existe na biblioteca; o Switch simplesmente não o segue.

Vale notar que `MaxInputToggle`, o componente comparável, delega ao `ToggleSwitch` do PrimeVue, que traz a acessibilidade pronta. O `MaxInputSwitch` reimplementou o visual à mão e perdeu isso no caminho.

## Impacto

Usuários de teclado não conseguem operar o campo de forma alguma — não há como alcançá-lo nem alterná-lo. Usuários de leitor de tela não recebem informação de que existe um controle, nem qual seu estado. Para um componente de formulário, isso é uma barreira de acesso total e um problema de conformidade (WCAG 2.1: 2.1.1 Teclado, 4.1.2 Nome, Função, Valor).

## Plano de correção

1. Adicionar ao elemento `.max-switch-toggle` (linha 7): `role="switch"`, `:aria-checked="temp_value === props.trueValue"`, `:aria-disabled="props.disabled"` e `:tabindex="props.disabled ? -1 : 0"`.
2. Adicionar `@keydown.space.prevent="toggleValue"` e `@keydown.enter.prevent="toggleValue"` no mesmo elemento (os guards de `disabled` já existem dentro de `toggleValue`, linha 107).
3. Associar o rótulo: gerar um id estável (o padrão `Random()` de `@maxvue/max-use` já é usado em `MaxInputCheckbox.vue:13` e `MaxInputRadio.vue:31`) e aplicar `aria-labelledby` apontando para o label do `InputBase`, ou `:aria-label="props.label"` como fallback.
4. Adicionar estilo de foco visível (`:focus-visible`) ao `.max-switch-toggle` no bloco SCSS — hoje não há nenhum, então mesmo após ganhar `tabindex` o usuário de teclado não veria onde está.
5. Manter os cliques nos rótulos laterais como estão (são um atalho de mouse), mas garantir que eles não sejam o único caminho.

## Verificação

- Novo teste em `tests/components/MaxInputSwitch.test.ts`: o elemento `.max-switch-toggle` tem `role="switch"` e `aria-checked` que acompanha `modelValue`.
- Teste de teclado: `trigger('keydown', { key: ' ' })` no toggle emite `update:modelValue` com o valor alternado; o mesmo para `Enter`.
- Teste de `disabled`: `tabindex` é `-1`, `aria-disabled` é `true` e o keydown não emite nada.
- Teste com `trueValue`/`falseValue` customizados: `aria-checked` reflete a comparação com `trueValue`, não a "booleanidade" do valor (complementa o caso já coberto em `tests/components/MaxInputSwitch.test.ts:59`).
- `npx vitest run tests/components/MaxInputSwitch.test.ts`.
