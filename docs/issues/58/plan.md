# Plano de Implementação - Issue #58

## Descrição e Causa Raiz

### Problema Relatado
No componente [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue), foram identificados dois comportamentos anômalos de renderização condicional:
1. **Renderização indevida de placeholder para valores falsy válidos:** Ao selecionar opções com `value: 0` ou `value: false`, o elemento de placeholder (`.tab-placeholder-select`) é renderizado simultaneamente com a tag de valor selecionada (`.value-tag-div`).
2. **Renderização indevida de badge vazia / botão de ícone em estado desmarcado:** Quando nenhuma opção está selecionada (`modelValue: null`, `undefined` ou `''`), o slot `#value` renderiza incondicionalmente um container vazio (`.value-tag-div`) com estilos de cor aplicados sobre o placeholder no modo normal (`isButton: false`). Caso a condição seja restringida sem tratar adequadamente a ramificação de botão, o componente cai indevidamente no branch `<div v-else>`, renderizando um `<MaxIconButton>` espúrio dentro de `.p-select-label` mesmo com `isButton: false`.

### Causa Raiz Comprovada
- **Linha de Renderização de Placeholder ([src/components/MaxTagSelect.vue:L3](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L3)):**
  ```vue
  <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="tab-placeholder-select">
  ```
  A expressão `(!temp_value || temp_value === '')` utiliza uma checagem *falsy* genérica (`!temp_value`). Em JavaScript, `!0 === true` e `!false === true`, fazendo com que valores `0` (numérico) e `false` (booleano) sejam avaliados erroneamente como "vazio", forçando a exibição do placeholder mesmo quando há uma opção válida selecionada.
- **Linhas de Renderização do Slot `#value` ([src/components/MaxTagSelect.vue:L20-46](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L20-L46)):**
  ```vue
  <div class="p-select-label">
      <slot name="value">
          <div
              class="value-tag-div"
              :style="getStyleColor(option_selected, false, true)"
              :color-string="getColorString(option_selected)"
              v-if="!isButton"
          >
              ...
          </div>
          <div v-else>
              <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
          </div>
      </slot>
  </div>
  ```
  1. A condição `v-if="!isButton"` não verifica se existe uma opção efetivamente selecionada (`option_selected` retorna `{}` quando não há seleção correspondente). Com isso, `.value-tag-div` é renderizado como uma pill/badge vazia com estilo de cor de fundo padrão (`var(--background-500)`), poluindo visualmente a área do input sobre o placeholder.
  2. Ao corrigir a condição da badge para `v-if="!isButton && hasSelected"`, a manutenção de um `<div v-else>` incondicional faz com que qualquer estado sem seleção (`hasSelected === false`) com `isButton === false` caia no `v-else`, renderizando `<MaxIconButton>` indevidamente. A ramificação do botão deve ser explicitamente condicionada com `v-else-if="isButton"`.

### Rastreamento Reverso de Dados
- **Camada UI / DOM:** [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue) renderiza `.p-select-label` contendo o slot `#value` (`.value-tag-div` ou `MaxIconButton`) e o elemento `.tab-placeholder-select`.
- **Reatividade do Componente (Vue SFC):** `props.modelValue` ⇄ `temp_value` (ref sincronizado bidirecionalmente com `emit('update:modelValue')` e `watch`) ⇄ `option_selected` (propriedade computada baseada em `options`, `groupOptions` ou `optionsField`) ⇄ `hasSelected` (propriedade computada booleana que verifica se `option_selected` possui chaves) ⇄ Condições `v-if`/`v-else-if` do template.
- **Camada API / Backend / DB:** Não aplicável (componente visual isolado do Design System UI em Vue 3 / Vite).

---

## Arquivos Afetados

1. [src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue) — Componente principal (correção da condição do placeholder, criação da computed `hasSelected` e ajuste de ramificação no template).
2. [tests/components/MaxTagSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/tests/components/MaxTagSelect.test.ts) — Suíte de testes unitários (inclusão de asserções cobrindo `0`, `false`, `null`, `undefined`, `''`, `isButton: true` e ausência de `MaxIconButton` quando `isButton: false` sem seleção).

---

## Execuções Propostas

### 1. Correção da Checagem de Placeholder
Em [src/components/MaxTagSelect.vue:L3](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L3), alterar a checagem de falsy para verificação estrita de nulidade/vazio:
```html
<div v-if="attrs.placeholder !== undefined && (temp_value === null || temp_value === undefined || temp_value === '')" class="tab-placeholder-select">
    {{ attrs.placeholder }}
</div>
```

### 2. Criação da Propriedade Computada `hasSelected`
No script de [src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue), definir a propriedade computada `hasSelected` logo após `option_selected`:
```typescript
const hasSelected = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));
```

### 3. Ajuste Cirúrgico na Renderização do Slot `#value`
No template de [src/components/MaxTagSelect.vue:L20-46](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L20-L46), estruturar as condições do slot `#value`:
- Aplicar `v-if="!isButton && hasSelected"` na `div.value-tag-div`.
- Aplicar `v-else-if="isButton"` na `div` que encapsula o `<MaxIconButton>`.
```html
<div class="p-select-label">
    <slot name="value">
        <div
            class="value-tag-div"
            :style="getStyleColor(option_selected, false, true)"
            :color-string="getColorString(option_selected)"
            v-if="!isButton && hasSelected"
        >
            <MaxIcon
                :icon="option_selected?.icon ?? null"
                :size="option_selected?.icon_size ?? 1.4"
                v-if="option_selected.icon"
                :color="getStyleColor(option_selected, false, true).color"
            />
            <div
                class="tag-value-text"
                :style="{ color: getStyleColor(option_selected, false, true).color }"
            >
                {{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}
            </div>
            <slot name="btn-right"></slot>
        </div>
        <div v-else-if="isButton">
            <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
        </div>
    </slot>
</div>
```

---

## Especificação de Teste TDD (Red-Green)

Arquivo de teste: [tests/components/MaxTagSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/tests/components/MaxTagSelect.test.ts)

### Casos de Teste a Implementar:
1. **Seleção de valor numérico `0`:**
   - Montar `MaxTagSelect` com `modelValue: 0`, `options: [{ value: 0, name: 'Opção Zero' }]`, `placeholder: 'Selecione'`.
   - Asserção: `.tab-placeholder-select` **não existe** (`false`), `.value-tag-div` **existe** (`true`) e o texto exibido é `'Opção Zero'`.
2. **Seleção de valor booleano `false`:**
   - Montar `MaxTagSelect` com `modelValue: false`, `options: [{ value: false, name: 'Desativado' }]`, `placeholder: 'Selecione'`.
   - Asserção: `.tab-placeholder-select` **não existe** (`false`), `.value-tag-div` **existe** (`true`) e o texto exibido é `'Desativado'`.
3. **Estado vazio com string vazia `''`:**
   - Montar `MaxTagSelect` com `modelValue: ''`, `placeholder: 'Selecione'`, `options: [...]`.
   - Asserção: `.tab-placeholder-select` **existe** (`true`) com texto `'Selecione'`, `.value-tag-div` **não existe** (`false`), e `.max-icon-button-stub` **não existe** (`false`).
4. **Estado desmarcado com `null` e propriedades de ícone:**
   - Montar `MaxTagSelect` com `modelValue: null`, `iconLeft: 'mdi:user'`, `options: [...]`.
   - Asserção: `.tab-placeholder-select` **não existe** (`false`), `.value-tag-div` **não existe** (`false`), e `.max-icon-button-stub` **não existe** (`false`).
5. **Modo Botão (`isButton: true`):**
   - Montar `MaxTagSelect` com `isButton: true`, `icon: 'mdi:tag'`, `modelValue: null`.
   - Asserção: `.max-icon-button-stub` **existe** (`true`) e `.value-tag-div` **não existe** (`false`).

### Ciclo Red-Green:
- **Red:** No código original, testes com `0` e `false` falham pela renderização simultânea do placeholder; testes com `''` falham pela presença de `.value-tag-div`; testes com `null` e `iconLeft` em modo padrão falham caso `v-else-if="isButton"` não seja utilizado (renderizando `<MaxIconButton>` indevidamente).
- **Green:** Com as correções aplicadas, todos os cenários passam com 100% de conformidade.

---

## Banco de Dados
**Nenhuma.** A alteração é restrita exclusivamente a componentes front-end Vue 3 / TypeScript.

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Props e Emits:** Nenhuma alteração de assinatura de props (`modelValue`, `options`, `groupOptions`, `isButton`, `placeholder`, etc.) ou eventos (`update:modelValue`, `before-show`).
- **Compatibilidade com Slots:** O slot `#value` e o sub-slot `#btn-right` mantêm o mesmo comportamento e hierarquia quando há opção selecionada.
- **Isolamento de Modo Botão:** O modo `isButton: true` permanece inalterado e funcionando conforme esperado.
- **Suíte de Testes Existente:** Todos os 17 testes unitários pré-existentes devem continuar passando sem regressão.

---

## Validação

A validação conclusiva é realizada por meio dos seguintes comandos no terminal:

```bash
# Executar a suíte de testes unitários do MaxTagSelect
npm test tests/components/MaxTagSelect.test.ts

# Checagem estática de tipos TypeScript
npm run type-check

# Validação de regras de lint e estilo
npm run lint
```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `vue-debugging-best-practices`
- `tdd`
- `planning-with-files`
- `code-review`
- `production-code-audit`
