# Violação Crítica de Controles Interativos Aninhados (Nested Interactive Controls) e Inconsistências Semânticas WAI-ARIA

## Severidade: Alta

## Componentes Impactados
- `src/components/MaxPopoverMenu.vue`
- `src/components/MaxUserSection.vue`
- `src/components/MaxTable.vue`
- `src/components/MaxInputMarkdownToolbar.vue`
- `src/components/MaxBottomMenu.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Anúncios Duplicados e Comportamento Conflitante de Clique**: Em leitores de tela como NVDA e VoiceOver, ao navegar até o menu popover (`MaxPopoverMenu`), o usuário escuta anúncios confusos como "botão, botão de ação, recolhido". Em dispositivos touch ou com tecnologias assistivas que utilizam cliques sintéticos, o evento de clique é capturado tanto pelo botão interno quanto pela div externa, gerando fechamento imediato do menu após a abertura (comportamento de *toggle* duplo ou disparo incorreto de rotas).
2. **Invisibilidade da Ordenação em Tabelas (`MaxTable`)**: Em tabelas com colunas ordenáveis, o usuário de leitor de tela ouve apenas o título da coluna (ex.: "Data de Criação"), sem nenhum anúncio de que a coluna é interativa ou que pode ser ordenada. Além disso, quando a ordenação está ativa, o estado de ordenação ("crescente" ou "decrescente") é omitido. Pessoas que utilizam teclado não conseguem focar o cabeçalho nem ordenar a tabela pressionando `Enter` ou `Space`.
3. **Estado Desconhecido em Botões de Alternância (Toggle Buttons)**: Na barra de edição de markdown, o usuário que ouve pelo leitor de tela não recebe o retorno de se o estilo Negrito ou Itálico está ativado no cursor atual, pois os botões não refletem seu estado semântico.

### Causa Raiz Profunda
1. **Violação Estrutural do HTML5 e WAI-ARIA (Controles Interativos Aninhados)**:
   - A especificação HTML5 proíbe expressamente que elementos de conteúdo interativo contenham descendentes interativos (*interactive content must not contain interactive content descendants*).
   - Em `MaxPopoverMenu.vue`, o elemento gatilho é declarado como `<div class="botao" role="button" tabindex="0" aria-haspopup="menu" ...>`. No slot padrão `#button`, o componente instancia `<MaxButton>`, o qual renderiza uma tag nativa `<button type="button" class="max-button">`. Isso resulta diretamente em um `<button>` aninhado dentro de um `<div role="button" tabindex="0">`.
   - Em `MaxUserSection.vue`, a tag raiz é declarada como `<div class="max-user-section" role="button" tabindex="0">` e, quando em modo de representação (`isImpersonated`), abriga em seu interior outro controle interativo clicável (`<div class="impersonated-btn" @click.stop="onEndImpersonate">`).
2. **Omissão de Semântica de Ordenação em Tabelas**:
   - No `MaxTable.vue`, a tag `<th>` de colunas ordenáveis (`col.sortable`) recebe apenas `@click="onHeaderClick(col)"`.
   - Não há `tabindex="0"`, não há tratamento de teclas `@keydown.enter` / `@keydown.space`, e o atributo semântico padronizado `aria-sort="ascending" | "descending" | "none"` nunca é aplicado no elemento `<th>`.
3. **Falta de `aria-pressed` em Botões de Estilo**:
   - Em `MaxInputMarkdownToolbar.vue`, a reatividade do estado ativo limita-se à classe CSS `:class="{ active: editor?.isActive('bold') }"`. Para acessibilidade semântica, botões do tipo *toggle* exigem a presença explícita de `:aria-pressed="editor?.isActive('bold') ? 'true' : 'false'"`.

---

## Evidência Técnica com Trechos e Caminhos de Arquivo

### 1. `src/components/MaxPopoverMenu.vue` (Linhas 3–22)
Gatilho `role="button"` contendo `<MaxButton>` (que renderiza `<button>` nativo):

```vue
<!-- Trecho de src/components/MaxPopoverMenu.vue -->
<div
    class="botao"
    ref="triggerButtonRef"
    role="button"
    tabindex="0"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-controls="menuId"
    :style="{ width: size_icon, height: size_icon }"
    v-tooltip="null"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="openAndFocusFirst"
    @keydown.up.prevent="openAndFocusLast"
>
    <slot name="button">
        <!-- MaxButton gera um <button type="button"> dentro da div role="button" -->
        <MaxButton v-bind="props" :size="props.size ?? props.sizeIcon" class="max-popover-menu-btn" />
    </slot>
</div>
```

### 2. `src/components/MaxTable.vue` (Linhas 55–85)
Cabeçalhos ordenáveis desprovidos de foco por teclado e de `aria-sort`:

```vue
<!-- Trecho de src/components/MaxTable.vue -->
<th
    v-for="col in resolvedColumns"
    :key="col.field || col.header || 'col'"
    :class="[
        'max-table-th',
        col.class,
        col.headerClass,
        { 'max-table-th-sortable': col.sortable }
    ]"
    :style="getColumnStyle(col)"
    @click="onHeaderClick(col)"
    <!-- FALHA: Falta tabindex="col.sortable ? 0 : undefined" -->
    <!-- FALHA: Falta :aria-sort="getAriaSort(col)" -->
    <!-- FALHA: Falta @keydown.enter="col.sortable && onHeaderClick(col)" -->
>
    <div class="p-datatable-column-header-content">
        <div class="p-datatable-column-title">
            <span>{{ col.header }}</span>
            <span v-if="col.sortable" class="sort-icon-box">
                <!-- Ícones SVG sem aria-hidden="true" -->
                <svg ...></svg>
            </span>
        </div>
    </div>
</th>
```

### 3. `src/components/MaxInputMarkdownToolbar.vue` (Linhas 8–28)
Botões de alternância de formatação sem `aria-pressed`:

```vue
<!-- Trecho de src/components/MaxInputMarkdownToolbar.vue -->
<button
    type="button"
    class="md-toolbar__btn"
    :class="{ active: editor?.isActive('bold') }"
    title="Negrito (Ctrl+B)"
    :disabled="!editor || editor.isEditable === false"
    @click="editor?.chain().focus().toggleBold().run()"
    <!-- FALHA: Falta :aria-pressed="editor?.isActive('bold') ? 'true' : 'false'" -->
    <!-- FALHA: Falta aria-label="Negrito" -->
>
    <MaxIcon icon="mdi:format-bold" :size="1.1" color="currentColor" />
</button>
```

---

## Impacto na Usabilidade e Conformidade com WCAG

| Critério WCAG | Nível | Descrição do Impacto |
|---|---|---|
| **4.1.2 Name, Role, Value** | A | Falha direta: controles aninhados criam conflitos de papéis e nomes no DOM acessível. O estado de ordenação de colunas (`aria-sort`) e de botões de alternância (`aria-pressed`) não é transmitido às tecnologias assistivas. |
| **2.1.1 Keyboard** | A | Falha: ordenação de dados em tabelas não pode ser executada por usuários que utilizam exclusivamente teclado. |
| **1.3.1 Info and Relationships** | A | Falha: a relação semântica de ordenação e controles interativos é baseada apenas em pistas visuais (ícones e cores), sem representação na árvore de acessibilidade. |

### Recomendações de Correção
1. **Desacoplar o Gatilho em `MaxPopoverMenu`**:
   - Não envolver o botão em uma `div role="button"`. O próprio `<MaxButton>` (ou botão customizado fornecido no slot) deve receber os atributos `aria-haspopup="menu"`, `:aria-expanded="isOpen"`, `:aria-controls="menuId"` e os eventos de teclado.
2. **Acessibilidade em Colunas de Tabela (`MaxTable`)**:
   - Quando `col.sortable` for verdadeiro, adicionar `tabindex="0"` no `<th>`, capturar teclas `Enter` e `Space` para alternar a ordenação, e atribuir `:aria-sort="sortField === col.field ? (sortOrder === 1 ? 'ascending' : 'descending') : 'none'"`.
   - Adicionar `aria-hidden="true"` nos SVGs indicadores de ordenação.
3. **Atributo `aria-pressed` na Toolbar**:
   - Em todos os botões de ação binária (negrito, itálico, sublinhado, listas) de `MaxInputMarkdownToolbar.vue`, adicionar `:aria-pressed="Boolean(editor?.isActive(format))"`.
