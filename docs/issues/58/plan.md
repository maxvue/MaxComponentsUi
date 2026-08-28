# Plano de Implementação — Issue #58

> **Issue:** #58 — [Audit] MaxTagSelect: renderiza placeholder junto com valor para 0/false e badge vazia quando nada esta selecionado  
> **Componente:** `src/components/MaxTagSelect.vue`  
> **Status:** Planejado (`planned: true`)

---

### Descrição e Causa Raiz

#### Problema Detalhado
O componente [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue) apresenta duas falhas correlacionadas de reatividade e renderização condicional na camada de apresentação:

1. **Colisão de Renderização (Placeholder + Valor 0 / false):**  
   Ao utilizar o componente com opções que possuam valores `0` (número) ou `false` (booleano) como `modelValue` válido (por exemplo, status inativo `0`, flag binária `false`), o elemento de placeholder (`.tab-placeholder-select`) é renderizado simultaneamente com a tag de valor selecionada (`.value-tag-div`). O usuário enxerga o texto do placeholder e a tag selecionada sobrepostos no mesmo campo.
2. **Renderização Indevida de Badge Vazia (Sem seleção):**  
   Quando nenhuma opção está selecionada (`modelValue: null`, `modelValue: undefined` ou `modelValue: ''`), a propriedade computada `option_selected` retorna um objeto vazio `{}`. O container `.value-tag-div` é renderizado incondicionalmente no slot padrão `#value` quando `!isButton`, aplicando estilos de background (cor padrão `var(--background-500)`), padding e border-radius sobre uma tag sem texto (`.tag-value-text` vazio). Isso gera uma badge/pílula vazia visível dentro do campo, seja sozinha ou sobreposta ao placeholder.

---

#### Causa Raiz Comprovada

1. **Verificação Falha de Falsy no Placeholder ([src/components/MaxTagSelect.vue:L3](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L3)):**
   ```html
   <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="tab-placeholder-select">
       {{ attrs.placeholder }}
   </div>
   ```
   - Em JavaScript, as expressões `!0` e `!false` avaliam para `true`.
   - Consequentemente, para valores primitivos válidos `temp_value = 0` ou `temp_value = false`, a condição `(!temp_value || temp_value === '')` é satisfeita como verdadeira, forçando a exibição do placeholder mesmo havendo seleção ativa.

2. **Renderização Incondicional da Tag de Valor ([src/components/MaxTagSelect.vue:L26](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L26)):**
   ```html
   <div
       class="value-tag-div"
       :style="getStyleColor(option_selected, false, true)"
       :color-string="getColorString(option_selected)"
       v-if="!isButton"
   >
   ```
   - A diretiva `v-if="!isButton"` apenas valida se o componente não está em modo botão (`isButton: false`), ignorando se há de fato uma opção selecionada.
   - Quando `temp_value` não corresponde a nenhuma opção, `option_selected` retorna `{}`. A função `getStyleColor({}, false, true)` gera propriedades visuais completas (`backgroundColor: var(--background-500)`, `borderRadius: '6px'`, `padding: '0 10px 0 6px !important'`), desenhando uma badge retangular vazia.

---

#### Rastreamento Reverso de Dados (UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB)

- **UI (Apresentação / DOM):** `.tab-placeholder-select` e `.value-tag-div` dentro de `.p-select-label` em [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue#L1-L48).
- **Estado Reativo do Componente:** `temp_value` (`ref`) sincronizado com `props.modelValue` via watchers, e `option_selected` (`computed`) que busca o item em `props.options` / `props.groupOptions` por `optionValue`.
- **Formulários / Consumidores:** Telas e modais da aplicação que vinculam campos `v-model="form.status"` com `options="[{ value: 0, name: 'Inativo' }, { value: 1, name: 'Ativo' }]"` ou flags booleanas.
- **Store (Pinia):** Estados globais ou locais contendo modelos com campos numéricos (`0`) ou booleanos (`false`).
- **API / Rotas / Controller / DB:** Respostas JSON de endpoints REST contendo colunas do banco de dados tipadas como `tinyint(1)`, `integer` ou `boolean` (`0`, `false`). O front-end precisa tratar esses dados como valores selecionados válidos.

---

### Arquivos Afetados

| Arquivo | Descrição da Modificação |
|---------|--------------------------|
| [src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue) | Ajuste na condição de exibição do placeholder (não ocultar para `0`/`false`) e inclusão da guarda `hasSelected` para `.value-tag-div`. |
| [tests/components/MaxTagSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/tests/components/MaxTagSelect.test.ts) | Adição de novos casos de teste TDD cobrindo `modelValue: 0`, `modelValue: false`, `modelValue: ''` e `modelValue: null`. |

---

### Execuções Propostas

#### Passo 1: Adicionar propriedade computada `hasSelected`
No bloco `<script setup lang="ts">` de [src/components/MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue):
```ts
const hasSelected = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));
```

#### Passo 2: Corrigir a condição de renderização do placeholder (Linha 3)
Substituir a verificação que usa falsy check por uma verificação explícita de nulidade/vazio:
```html
<div v-if="attrs.placeholder !== undefined && (temp_value === null || temp_value === undefined || temp_value === '')" class="tab-placeholder-select">
    {{ attrs.placeholder }}
</div>
```

#### Passo 3: Condicionar a renderização de `.value-tag-div` ao `hasSelected` (Linha 26)
Garantir que a tag de valor só seja desenhada quando houver uma opção válida selecionada:
```html
<div
    class="value-tag-div"
    :style="getStyleColor(option_selected, false, true)"
    :color-string="getColorString(option_selected)"
    v-if="!isButton && hasSelected"
>
```

---

### Especificação de Teste TDD (Red-Green)

Arquivo: [tests/components/MaxTagSelect.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/tests/components/MaxTagSelect.test.ts)

#### Casos de Teste a Implementar:

```ts
it('não renderiza placeholder quando modelValue é 0 e exibe a tag correspondente', async () => {
    const options = [
        { value: 0, name: 'Opção Zero' },
        { value: 1, name: 'Opção Um' }
    ];
    const wrapper = mountTagSelect({ modelValue: 0, options }, { placeholder: 'Selecione uma opção' });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
    expect(wrapper.find('.value-tag-div').exists()).toBe(true);
    expect(wrapper.find('.tag-value-text').text()).toBe('Opção Zero');
});

it('não renderiza placeholder quando modelValue é false e exibe a tag correspondente', async () => {
    const options = [
        { value: false, name: 'Desativado' },
        { value: true, name: 'Ativado' }
    ];
    const wrapper = mountTagSelect({ modelValue: false, options }, { placeholder: 'Selecione o estado' });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
    expect(wrapper.find('.value-tag-div').exists()).toBe(true);
    expect(wrapper.find('.tag-value-text').text()).toBe('Desativado');
});

it('renderiza placeholder e NÃO renderiza .value-tag-div quando modelValue é vazio ("")', async () => {
    const options = [{ value: 'a', name: 'Tag A' }];
    const wrapper = mountTagSelect({ modelValue: '', options }, { placeholder: 'Selecione' });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
    expect(wrapper.find('.tab-placeholder-select').text()).toBe('Selecione');
    expect(wrapper.find('.value-tag-div').exists()).toBe(false);
});

it('não renderiza .value-tag-div quando modelValue é null e nenhum placeholder foi informado', async () => {
    const options = [{ value: 'a', name: 'Tag A' }];
    const wrapper = mountTagSelect({ modelValue: null, options });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.tab-placeholder-select').exists()).toBe(false);
    expect(wrapper.find('.value-tag-div').exists()).toBe(false);
});
```

- **Fase Red:** Antes da modificação no SFC, os testes com `0` e `false` falham na asserção do placeholder (`.tab-placeholder-select` existe indevidamente), e os testes com `''` / `null` falham na asserção da badge (`.value-tag-div` existe indevidamente).
- **Fase Green:** Após a aplicação das correções cirúrgicas em [MaxTagSelect.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-58/src/components/MaxTagSelect.vue), todos os novos testes e os 17 testes existentes passam com sucesso.

---

### Banco de Dados
**Nenhuma.** A alteração é estritamente restrita à biblioteca de componentes de interface front-end (Vue 3 / TypeScript).

---

### Riscos de Quebra e Não-Regressão

- **Contrato de Props e Eventos:** Nenhuma prop, emit ou tipo público foi modificado. `modelValue`, `options`, `groupOptions`, `optionValue`, `optionName`, `optionLabel`, `isButton` e atributos repassados mantêm 100% de compatibilidade retroativa.
- **Customização de Slots:** O slot `#value` continua funcional. Consumidores que fornecem template customizado para `#value` continuarão sobrescrevendo o render padrão normalmente.
- **Modo Botão (`isButton`):** O fluxo quando `isButton: true` continua renderizando `MaxIconButton` independentemente da seleção.
- **Não-Regressão:** A suíte de testes unitários existente (17 testes) continuará passando integralmente.

---

### Validação

Execução dos comandos automatizados de validação:

```bash
# Executar a suíte de testes do componente
npm test tests/components/MaxTagSelect.test.ts

# Validação estática de tipos TypeScript
npm run type-check

# Validação de regras de estilo e linting
npm run lint
```

---

### Skills Aplicáveis

- `systematic-debugging-best-practices`
- `vue-debugging-best-practices`
- `tdd`
- `planning-with-files`
- `code-review`
- `production-code-audit`
