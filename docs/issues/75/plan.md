# Plano de Implementação — Issue #75

## Descrição e Causa Raiz

### Problema e Agravantes
No componente `MaxTableFields.vue`, a coluna de ações/botões é renderizada condicionalmente através da computed `hasActionsColumn` (`L143`), que verifica se a prop `props.buttons` possui itens (`size(props.buttons) > 0`) OU se o slot customizado `buttons` foi provido (`!!slots['buttons']`).

No entanto, o componente possui duas falhas críticas interligadas:
1. **Prop `buttonsWidth` ignorada:** O componente declara em `defineProps` a propriedade `buttonsWidth?: string;` (`L128`), documentada como `"Largura da coluna de botões (ex: '120px')"`. Porém, essa propriedade não é referenciada em nenhum outro ponto do script ou template do componente, sendo completamente ignorada.
2. **Cálculo hardcoded colapsa coluna para `0px` ao usar slot `buttons`:** No template, tanto o cabeçalho `<th>` (`L13`) quanto a célula `<td>` (`L75`) definem seu estilo inline de largura de forma rígida através de:
   ```html
   :style="`width: ${size(props.buttons) * 32}px`"
   ```
   Quando um consumidor utiliza o componente customizando a coluna de botões exclusivamente via slot `#buttons` (sem fornecer a prop `:buttons="[...]"`), `props.buttons` é `undefined` ou vazio. Consequentemente, `size(props.buttons)` avalia para `0`, resultando em um estilo inline `:style="'width: 0px;'"` forçado no elemento.
   
   Como o layout das linhas da tabela (`.max-table-fields-head-row` e `.max-table-fields-row`) é baseado em flexbox (`display: flex`) e as classes da coluna de botões (`.max-table-fields-th-buttons` e `.max-table-fields-buttons`) possuem `flex-grow: 0; width: auto;`, a injeção do estilo inline `width: 0px` anula o `width: auto` da folha de estilos e colapsa a largura da coluna para 0px (restando apenas o espaçamento mínimo de padding). Isso causa o corte, sobreposição e quebra visual completa do conteúdo inserido pelo consumidor via slot `#buttons`. Além disso, qualquer tentativa de contornar o problema passando `:buttonsWidth="'150px'"` falha sumariamente porque a prop não tem efeito.

### Causa Raiz Comprovada
- **Localização Exata:**
  - `src/components/MaxTableFields.vue:13` — Estilo inline rígido no cabeçalho `<th>`.
  - `src/components/MaxTableFields.vue:75` — Estilo inline rígido na célula `<td>`.
  - `src/components/MaxTableFields.vue:128` — Declaração da prop `buttonsWidth` sem consumo.
  - `src/components/MaxTableFields.vue:143` — Ativação da coluna via slot `buttons` sem fallback de largura compatível.

```vue
<!-- src/components/MaxTableFields.vue:12-17 -->
<th v-if="hasActionsColumn" class="max-table-fields-th max-table-fields-th-buttons" :style="`width: ${size(props.buttons) * 32}px`" >
    <slot name="buttons-header">
        {{props.headerButton}}
    </slot>
</th>

<!-- src/components/MaxTableFields.vue:74-79 -->
<td v-if="hasActionsColumn" class="max-table-fields-td max-table-fields-buttons" :style="`width: ${size(props.buttons) * 32}px`" >
    <slot name="buttons" :data="row" :index="index">
        <MaxIconButton v-for="btn in props.buttons" v-bind="btn" :key="btn.id" :data="btn.data ? resolveData(row, btn.data) : row" :size="btn.size ?? 1.2" class="table-icon-button"/>
    </slot>
</td>

<!-- src/components/MaxTableFields.vue:128 -->
buttonsWidth?: string;

<!-- src/components/MaxTableFields.vue:143 -->
const hasActionsColumn: ComputedRef<boolean> = computed((): boolean => size(props.buttons) > 0 || !!slots['buttons']);
```

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Consumidor / Template da Aplicação:** O desenvolvedor instancia `<MaxTableFields :columns="cols" :list="data">` e provê o slot `<template #buttons="{ data }"><button>Ação</button></template>`, opcionalmente configurando `:buttonsWidth="'140px'"`.
  2. **Reatividade do Componente (`hasActionsColumn`):** `slots['buttons']` é detectado como truthy ➔ `hasActionsColumn.value` torna-se `true` ➔ as tags `<th>` e `<td>` da coluna de ações são incluídas no DOM.
  3. **Avaliação da Largura:** A expressão `:style="`width: ${size(props.buttons) * 32}px`"` avalia `size(props.buttons)` como `0` ➔ Gera o atributo inline `style="width: 0px;"`. A prop `props.buttonsWidth` é ignorada pelo compilador/runtime de template por não constar em nenhuma ligação reativa.
  4. **Renderização CSS no Browser:** O navegador renderiza o flex-item com `flex-grow: 0` e `width: 0px` ➔ Os elementos internos do slot sofrem colapso geométrico, transbordando ou sendo mascarados pelo layout da tabela.

---

## Arquivos Afetados

1. `src/components/MaxTableFields.vue`
   - Ampliação e tipagem de `buttonsWidth?: string | number;` em `defineProps`.
   - Implementação da computed `buttonsColumnStyle` para gerenciar a largura e estilos inline da coluna de ações de maneira reativa, priorizando `props.buttonsWidth` (processado por `getCssSize`), recorrendo ao cálculo dinâmico `${size(props.buttons) * 32}px` quando `buttons` estiver presente, ou retornando estilo neutro `{}` (permitindo `width: auto`) quando apenas o slot `#buttons` for utilizado sem largura fixa.
   - Aplicação de `:style="buttonsColumnStyle"` nas tags `<th>` (L13) e `<td>` (L75) da coluna de ações.

2. `tests/components/MaxTableFields.test.ts`
   - Adição de casos de teste específicos cobrindo:
     - Uso de `buttonsWidth` customizado (ex: `'150px'`, `120`, `'10rem'`) com reflexo idêntico no `<th>` e no `<td>`.
     - Renderização com slot `#buttons` sem `props.buttons` garantindo que `width: 0px` não seja aplicado.
     - Sobrescrita do cálculo automático de `props.buttons` quando `buttonsWidth` for explicitamente informado.
     - Manutenção da compatibilidade regressiva do cálculo automático `${size(props.buttons) * 32}px` quando `buttonsWidth` for omitido.

3. `migration_plans/MaxTableFields.md`
   - Atualização da tabela de props e documentação do componente para refletir o suporte a `string | number` e o comportamento de dimensionamento da coluna de ações.

---

## Execuções Propostas

### 1. Refatoração Cirúrgica em `src/components/MaxTableFields.vue`

#### A. Atualização do Contrato de Props em `defineProps`
Permitir tanto `string` quanto `number` para `buttonsWidth`, mantendo conformidade com o helper `getCssSize`:
```typescript
/** Largura da coluna de botões (ex: '120px' ou 120) */
buttonsWidth?: string | number;
```

#### B. Criação da Computed `buttonsColumnStyle`
Adicionar no script a propriedade computada `buttonsColumnStyle`:
```typescript
/** Gera o estilo inline da coluna de ações/botões */
const buttonsColumnStyle: ComputedRef<Record<string, string>> = computed((): Record<string, string> => {
    const style: Record<string, string> = {};

    if (props.buttonsWidth !== undefined && props.buttonsWidth !== null && props.buttonsWidth !== '') {
        const width = getCssSize(props.buttonsWidth);
        style.width = width;
        style.maxWidth = width;
        return style;
    }

    const buttonCount = size(props.buttons);
    if (buttonCount > 0) {
        const width = `${buttonCount * 32}px`;
        style.width = width;
        style.maxWidth = width;
        return style;
    }

    return style;
});
```

#### C. Atualização do Template
Substituir o estilo hardcoded no cabeçalho `<th>` e na célula de corpo `<td>`:

- No cabeçalho (L13):
```vue
<!-- Antes -->
<th v-if="hasActionsColumn" class="max-table-fields-th max-table-fields-th-buttons" :style="`width: ${size(props.buttons) * 32}px`" >

<!-- Depois -->
<th v-if="hasActionsColumn" class="max-table-fields-th max-table-fields-th-buttons" :style="buttonsColumnStyle" >
```

- No corpo (L75):
```vue
<!-- Antes -->
<td v-if="hasActionsColumn" class="max-table-fields-td max-table-fields-buttons" :style="`width: ${size(props.buttons) * 32}px`" >

<!-- Depois -->
<td v-if="hasActionsColumn" class="max-table-fields-td max-table-fields-buttons" :style="buttonsColumnStyle" >
```

---

### 2. Implementação dos Testes em `tests/components/MaxTableFields.test.ts`

Adicionar testes unitários dedicados à coluna de ações e à prop `buttonsWidth`:

```typescript
it('aplica buttonsWidth na coluna de ações quando fornecido', () => {
    const wrapper = mount(MaxTableFields, {
        props: {
            list: [{ id: 1 }],
            columns: [{ field: 'id', header: 'ID' }],
            buttonsWidth: '150px',
            buttons: [{ id: 'btn1', icon: 'test' }]
        },
        global: { stubs: { MaxIconButton: true } }
    });

    const thButtons = wrapper.find('.max-table-fields-th-buttons');
    const tdButtons = wrapper.find('.max-table-fields-buttons');

    expect(thButtons.attributes('style')).toContain('width: 150px');
    expect(thButtons.attributes('style')).toContain('max-width: 150px');
    expect(tdButtons.attributes('style')).toContain('width: 150px');
    expect(tdButtons.attributes('style')).toContain('max-width: 150px');
});

it('não colapsa para width: 0px quando renderizado apenas com slot buttons', () => {
    const wrapper = mount(MaxTableFields, {
        props: {
            list: [{ id: 1 }],
            columns: [{ field: 'id', header: 'ID' }]
        },
        slots: {
            buttons: '<button class="custom-btn">Ação</button>'
        }
    });

    const thButtons = wrapper.find('.max-table-fields-th-buttons');
    const tdButtons = wrapper.find('.max-table-fields-buttons');

    expect(thButtons.exists()).toBe(true);
    expect(tdButtons.exists()).toBe(true);
    expect(thButtons.attributes('style') || '').not.toContain('width: 0px');
    expect(tdButtons.attributes('style') || '').not.toContain('width: 0px');
});

it('aplica buttonsWidth na coluna de ações quando usado apenas com slot buttons', () => {
    const wrapper = mount(MaxTableFields, {
        props: {
            list: [{ id: 1 }],
            columns: [{ field: 'id', header: 'ID' }],
            buttonsWidth: '140px'
        },
        slots: {
            buttons: '<button class="custom-btn">Ação</button>'
        }
    });

    const thButtons = wrapper.find('.max-table-fields-th-buttons');
    const tdButtons = wrapper.find('.max-table-fields-buttons');

    expect(thButtons.attributes('style')).toContain('width: 140px');
    expect(tdButtons.attributes('style')).toContain('width: 140px');
});

it('calcula largura automática da coluna de ações com base na quantidade de botões quando buttonsWidth for omitido', () => {
    const wrapper = mount(MaxTableFields, {
        props: {
            list: [{ id: 1 }],
            columns: [{ field: 'id', header: 'ID' }],
            buttons: [
                { id: 'b1', icon: 'i1' },
                { id: 'b2', icon: 'i2' },
                { id: 'b3', icon: 'i3' }
            ]
        },
        global: { stubs: { MaxIconButton: true } }
    });

    const thButtons = wrapper.find('.max-table-fields-th-buttons');
    const tdButtons = wrapper.find('.max-table-fields-buttons');

    // 3 botões * 32px = 96px
    expect(thButtons.attributes('style')).toContain('width: 96px');
    expect(tdButtons.attributes('style')).toContain('width: 96px');
});

it('aceita buttonsWidth numérico e converte para pixels via getCssSize', () => {
    const wrapper = mount(MaxTableFields, {
        props: {
            list: [{ id: 1 }],
            columns: [{ field: 'id', header: 'ID' }],
            buttonsWidth: 160,
            buttons: [{ id: 'b1' }]
        },
        global: { stubs: { MaxIconButton: true } }
    });

    const thButtons = wrapper.find('.max-table-fields-th-buttons');
    const tdButtons = wrapper.find('.max-table-fields-buttons');

    expect(thButtons.attributes('style')).toContain('width: 160px');
    expect(tdButtons.attributes('style')).toContain('width: 160px');
});
```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Reprodução da Falha Antes da Modificação)
Ao executar os novos testes contra o código atual:
- **Falha 1 (Prop ignorada):** `expect(thButtons.attributes('style')).toContain('width: 150px')` falha porque o elemento possui `style="width: 32px;"` (ou `0px`).
- **Falha 2 (Colapso 0px no slot):** `expect(thButtons.attributes('style') || '').not.toContain('width: 0px')` falha com `AssertionError: expected 'width: 0px;' not to contain 'width: 0px'`.
- **Falha 3 (buttonsWidth no slot):** `expect(thButtons.attributes('style')).toContain('width: 140px')` falha porque o elemento possui `style="width: 0px;"`.

### 2. Etapa Green (Validação Pós-Implementação)
Após a introdução da computed `buttonsColumnStyle`:
- Todos os testes novos passam com sucesso (`5 passed`).
- Todos os 16 testes anteriores de `MaxTableFields.test.ts` continuam passando sem quebra (`21 passed no total`).
- A largura da coluna passa a ser controlada com precisão pelo consumidor e não colapsa sob nenhuma combinação de props/slots.

---

## Banco de Dados

- **Nenhuma** migration necessária. Alteração exclusiva no componente frontend Vue 3.

---

## Riscos de Quebra e Não-Regressão

### Análise de Contratos
1. **Tabelas existentes utilizando `props.buttons` sem `buttonsWidth`:**
   - **Comportamento Mantido:** Continuam recebendo exatamente `size(props.buttons) * 32px`.
2. **Tabelas existentes sem coluna de ações:**
   - **Comportamento Mantido:** `hasActionsColumn` continua avaliando como `false`, não renderizando as tags `<th>` ou `<td>`.
3. **Tabelas existentes utilizando o slot `#buttons` sem `buttonsWidth`:**
   - **Correção Não Destrutiva:** Anteriormente ficavam colapsadas com `width: 0px`. Agora passam a ter `width: auto` via folha de estilos SCSS, permitindo que os botões inseridos sejam exibidos corretamente.
4. **Tabelas que passarem `buttonsWidth`:**
   - A prop passa a ter efeito imediato e consistente tanto no `<th>` quanto no `<td>`.

---

## Validação

1. **Execução dos Testes Unitários de `MaxTableFields`:**
   ```bash
   npm test -- tests/components/MaxTableFields.test.ts
   ```
2. **Execução de Toda a Suíte de Testes do Pacote:**
   ```bash
   npm test
   ```
3. **Verificação de Tipos TypeScript (Vue-TSC):**
   ```bash
   npm run type-check
   ```
4. **Verificação de Formatação e Linter:**
   ```bash
   npx eslint src/components/MaxTableFields.vue tests/components/MaxTableFields.test.ts
   ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-components`
- `tdd`
- `code-review`
- `production-code-audit`
