# MaxPopover: sem fechamento por Escape, sem focus trap e sem semântica ARIA no gatilho

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxPopover.vue:2-28`, `src/components/MaxPopover.vue:133-155`
- **Domínio:** overlays-navegacao

## Problema

O `MaxPopover` renderiza um diálogo flutuante (`.max-popover-dialog`, linha 12) com título, subtítulo, botão de fechar e conteúdo arbitrário — ou seja, é semanticamente um diálogo não-modal. Faltam todas as garantias de teclado e ARIA:

1. **Nenhum listener de Escape.** As funções `toggle` (133) e `hide` (143) só são acionadas por clique. Não há `document.addEventListener('keydown', ...)` em lugar nenhum do arquivo.
2. **Sem focus trap e sem foco inicial.** `useFocusTrap` não é importado. Ao abrir, o foco permanece no gatilho; o conteúdo do popover (que pode conter inputs) só é alcançável tabulando por todo o resto da página, já que o popover é teleportado para o fim do `<body>`.
3. **Foco não restaurado ao fechar.** Nenhuma referência ao elemento anterior.
4. **Gatilho sem semântica.** O gatilho é um `<div>` (linha 3) com `@click.stop="toggle"`, sem `role="button"`, sem `tabindex`, sem `aria-expanded` e sem `aria-controls` apontando para o painel. Usuários de teclado não conseguem sequer abrir o popover.
5. **Painel sem `role`.** O `.max-popover-dialog` não tem `role="dialog"` nem `aria-labelledby` vinculado ao `MaxTitle1` da linha 15.
6. **Botão de fechar sem `aria-label`** (linha 16).

Compare com o `MaxAccordionHeader`, que faz tudo certo no mesmo repositório (`<button>` real, `aria-expanded`, `aria-controls`, `@keydown` — `src/components/MaxAccordionHeader.vue:3-16`).

## Impacto

O `MaxPopover` é inoperável por teclado: não abre, não fecha e seu conteúdo não é anunciado como um agrupamento. Como ele é a base do `MaxTogglePopover` (`src/components/MaxTogglePopover.vue:2`), o defeito se propaga.

## Plano de correção

1. **Escape:** criar `onEscape` e registrar `document.addEventListener('keydown', onEscape)` num `watch(isOpen, ...)`, removendo no fechamento e em `onBeforeUnmount`.
2. **Focus trap:** importar `useFocusTrap` de `../helpers/useFocusTrap`, instanciar com o ref `el` (linha 100), chamar `activate()`/`deactivate()` no mesmo `watch(isOpen, ...)` e adicionar `@keydown="trap.onKeydown"` no `.max-popover-dialog`.
3. **Gatilho acessível:** transformar o wrapper da linha 3 em `<button type="button">` (ou adicionar `role="button"` + `tabindex="0"` + handler de `keydown` para Enter/Espaço), com `:aria-expanded="isOpen"` e `:aria-controls="dialog_id"`.
4. **Painel:** adicionar `role="dialog"`, `:id="dialog_id"` e `:aria-labelledby` no `.max-popover-dialog`; gerar os ids a partir do `id` já existente (linha 94).
5. **Botão de fechar:** `aria-label="Fechar"` no `MaxIconButton` da linha 16.
6. Manter indentação de 4 espaços, aspas simples, ponto e vírgula.

## Verificação

- Teste em `tests/components/MaxPopover.test.ts`: abrir via `toggle()`, disparar Escape no `document` e afirmar que `popover_store.show_id === null`.
- Teste de foco: com um `<button>` no slot de conteúdo, abrir e afirmar que `document.activeElement` é esse botão; fechar e afirmar que o foco voltou ao gatilho.
- Teste de ARIA: afirmar `aria-expanded="false"` antes de abrir e `"true"` depois; afirmar que `aria-controls` do gatilho corresponde ao `id` do painel.
- Teste de teclado no gatilho: `trigger('keydown', { key: 'Enter' })` deve abrir.
- `npx vitest run tests/components/MaxPopover.test.ts`
