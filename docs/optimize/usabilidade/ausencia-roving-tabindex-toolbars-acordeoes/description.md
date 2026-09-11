# Ausência do Padrão Roving Tabindex e Navegação por Setas em Barras de Ferramentas, Acordeões e Tags

## Severidade: Alta

## Componentes Impactados
- `src/components/MaxInputCodeToolbar.vue`
- `src/components/MaxInputMarkdownToolbar.vue`
- `src/components/MaxAccordion.vue`
- `src/components/MaxAccordionItem.vue`
- `src/components/MaxChips.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Fadiga Extrema de Tabulação em Barras de Edição**: Ao navegar por um formulário que contenha um editor de código (`MaxInputCode`) ou markdown (`MaxInputMarkdown`), o usuário que utiliza teclado precisa pressionar a tecla `Tab` entre 15 e 25 vezes seguidas para atravessar cada um dos botões individuais das barras de ferramentas antes de alcançar o editor propriamente dito. Não existe um único ponto de parada (*single tab stop*) para a barra.
2. **Impossibilidade de Navegação por Setas no Acordeão**: Ao focar o cabeçalho de uma seção em `MaxAccordion`, as teclas `ArrowDown` e `ArrowUp` não movem o foco para as seções adjacentes, contrariando o comportamento padrão esperado de acordeões no ecossistema web moderno.
3. **Incapacidade de Inspeção de Chips por Teclado**: No componente `MaxChips`, ao digitar vários valores, o usuário não consegue utilizar a tecla `ArrowLeft` para navegar pelos chips anteriores, ler seus conteúdos ou acionar a exclusão de um item intermediário específico; o teclado apenas permite apagar o último item via `Backspace` caso o input de texto esteja completamente vazio.

### Causa Raiz Profunda
1. **Violação do Padrão WAI-ARIA Toolbar**:
   - Tanto `MaxInputCodeToolbar.vue` quanto `MaxInputMarkdownToolbar.vue` são contêineres `<div>` genéricos sem atributo `role="toolbar"`.
   - Todos os botões internos são gerados como elementos nativos `<button type="button">` sem gerenciamento de foco: cada botão é um ponto de parada de tabulação independente (`tabindex="0"` implícito).
   - Não foi implementado o mecanismo de **Roving Tabindex** (no qual a barra inteira atua como um único tab stop, com apenas o item ativo ou primeiro item tendo `tabindex="0"` e todos os outros com `tabindex="-1"`, e as teclas `ArrowRight`, `ArrowLeft`, `Home` e `End` alternando o foco entre eles).
2. **Omissão de Navegação Vertical no WAI-ARIA Accordion**:
   - `MaxAccordionItem.vue` implementa apenas `@keydown.enter.prevent="onClick"` e `@keydown.space.prevent="onClick"`.
   - O contêiner `MaxAccordion.vue` não expõe nem coordena os elementos focáveis via injeção de contexto para permitir que a pressão de `ArrowDown` passe o foco para o próximo cabeçalho e `ArrowUp` para o cabeçalho anterior.
3. **Ausência de Comportamento de Tag List no `MaxChips`**:
   - O `<input>` interno não monitora a posição do cursor (selectionStart === 0) na tecla `ArrowLeft` para transferir o foco ao último chip renderizado. Os botões de remoção de chip (`max-chip-remove-btn`) estão no DOM, mas são inalcançáveis sem tabulação direta desordenada.

---

## Evidência Técnica com Trechos e Caminhos de Arquivo

### 1. `src/components/MaxInputCodeToolbar.vue` (Linhas 1–40)
O contêiner não possui `role="toolbar"` e cada botão é um tab stop desnecessário:

```vue
<!-- Trecho de src/components/MaxInputCodeToolbar.vue -->
<template>
    <!-- FALHA: Falta role="toolbar" e aria-label="Ferramentas de código" -->
    <div class="max-input-code-toolbar" :class="{ 'max-input-code-toolbar--disabled': props.disabled }">
        <!-- Cada botão tem tabindex natural 0, poluindo a ordem de tabulação -->
        <div class="max-input-code-toolbar__group">
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Formatar Código (Shift+Alt+F)"
                :disabled="props.disabled"
                @click="emit('format')"
            >
                <MaxIcon icon="mdi:code-tags-check" :size="1.1" color="currentColor" />
            </button>
        </div>
        ...
```

### 2. `src/components/MaxInputMarkdownToolbar.vue` (Linhas 1–30)
Mais de 20 botões sequenciais no tab order:

```vue
<!-- Trecho de src/components/MaxInputMarkdownToolbar.vue -->
<template>
    <!-- FALHA: Div sem role="toolbar", botões sem roving tabindex -->
    <div class="max-input-markdown-toolbar md-toolbar" :class="{ 'md-toolbar--disabled': !editor || editor.isEditable === false }">
        <div class="md-toolbar__group">
            <button type="button" class="md-toolbar__btn" title="Negrito (Ctrl+B)" ...>
            <button type="button" class="md-toolbar__btn" title="Itálico (Ctrl+I)" ...>
            <button type="button" class="md-toolbar__btn" title="Sublinhado (Ctrl+U)" ...>
            <button type="button" class="md-toolbar__btn" title="Tachado" ...>
        </div>
        ...
```

### 3. `src/components/MaxAccordionItem.vue` (Linhas 11–19)
Falta de navegação por setas:

```vue
<!-- Trecho de src/components/MaxAccordionItem.vue -->
<div
    class="max-accordion-item-header"
    role="button"
    :tabindex="props.disabled ? -1 : 0"
    :aria-controls="`${context.id_prefix}-content-${item_value}`"
    :aria-expanded="is_open"
    :aria-disabled="props.disabled || undefined"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    @keydown.space.prevent="onClick"
    <!-- FALHA: Nenhum handler de ArrowDown, ArrowUp, Home, End -->
>
```

---

## Impacto na Usabilidade e Conformidade com WCAG

| Critério WCAG | Nível | Descrição do Impacto |
|---|---|---|
| **2.1.1 Keyboard** | A | Falha: componentes complexos compostos (toolbar, acordeão, chips) não oferecem navegação completa bidirecional por teclado conforme as práticas recomendadas (WAI-ARIA APG). |
| **2.4.3 Focus Order** | A | Falha de usabilidade: a ordem de foco é excessivamente longa e linear, obrigando dezenas de pressões na tecla Tab desnecessárias para atingir os controles de edição principais. |

### Recomendações de Correção
1. **Adotar Roving Tabindex nas Barras de Ferramentas**:
   - Aplicar `role="toolbar"` e `:aria-label="props.label || 'Barra de ferramentas'"`.
   - Manter um estado reativo `focusedBtnIndex`.
   - O botão no índice ativo recebe `tabindex="0"`; todos os outros recebem `tabindex="-1"`.
   - Adicionar listener de teclado `@keydown.right`, `@keydown.left`, `@keydown.home`, `@keydown.end` que move o foco e atualiza `focusedBtnIndex`.
2. **Navegação no Acordeão**:
   - Coordenar no contexto do acordeão (`accordionContext.ts`) a lista de cabeçalhos registrados.
   - Implementar navegação circular com `ArrowDown` e `ArrowUp`.
3. **Navegação Bidirecional em `MaxChips`**:
   - Ao teclar `ArrowLeft` no input vazio, focar o último chip da lista. Com as setas, permitir percorrer os chips e acionar a tecla `Delete` ou `Backspace` para remover o chip em foco.
