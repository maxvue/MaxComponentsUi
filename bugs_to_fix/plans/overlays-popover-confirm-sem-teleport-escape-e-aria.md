# MaxPopoverConfirm: sem teleport, sem Escape, sem focus trap e sem `role="alertdialog"`

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxPopoverConfirm.vue:1-18`, `src/components/MaxPopoverConfirm.vue:66-75`
- **Domínio:** overlays-navegacao

## Problema

O `MaxPopoverConfirm` é o diálogo de confirmação global da biblioteca (acionado por `MaxButtonConfirm`, `MaxIconConfirm`, `MaxTogglePopover` e `MaxUserAvatar`). Ele apresenta um conjunto de lacunas:

1. **Não é teleportado.** O template (linha 2) renderiza a máscara `.background-popover-confirm` diretamente no ponto de montagem do componente, sem `<Teleport to="body">`. Combinado com o `z-index: 3` (linha 73), o overlay fica sujeito a qualquer contexto de empilhamento (`transform`, `filter`, `overflow`) de um ancestral do consumidor — cenário em que a máscara `position: fixed` deixa de ser relativa à viewport e o diálogo aparece no lugar errado ou é cortado.
2. **Sem fechamento por Escape.** Nenhum listener de `keydown` no arquivo. As únicas saídas são clicar na máscara (linha 3), em "Sim" ou em "Não".
3. **Sem focus trap e sem foco inicial.** `useFocusTrap` não é usado. Ao abrir, o foco continua no gatilho; os botões "Sim"/"Não" (linhas 12-13) não recebem foco e são alcançáveis apenas tabulando por todo o resto do documento.
4. **Sem semântica de diálogo.** O painel `.max-icon-confirm-dialog` (linha 4) não tem `role="alertdialog"` (o papel correto para uma confirmação que interrompe o fluxo), nem `aria-modal`, nem `aria-labelledby` apontando para o texto da mensagem (linha 8).
5. **Ordem dos botões.** "Não" (reject) vem antes de "Sim" (accept) na ordem do DOM (linhas 12-13). Não é um bug em si, mas significa que o primeiro elemento focável de um eventual focus trap seria o de rejeição — o que é, na verdade, o default seguro desejado e deve ser mantido deliberadamente ao implementar o trap.

## Impacto

O diálogo que confirma ações destrutivas ("Remover responsável?", `src/components/MaxUserAvatar.vue:50`) não é operável por teclado nem anunciado por leitores de tela como uma confirmação. Um usuário de tecnologia assistiva pode não perceber que uma confirmação foi solicitada. A ausência de teleport ainda cria risco de o diálogo ficar visualmente inacessível dentro de contêineres com `transform`/`overflow`.

## Plano de correção

1. Envolver o conteúdo em `<Teleport to="body">` (mantendo o `TransitionFade` externo ou interno conforme o que preservar a animação).
2. Adicionar no `.max-icon-confirm-dialog`: `role="alertdialog"`, `aria-modal="true"` e `:aria-labelledby` apontando para um `id` aplicado ao `<div>{{ confirm_store.message }}</div>` (linha 8).
3. Importar `useFocusTrap` de `../helpers/useFocusTrap`, instanciar com o ref `el` (linha 33), e ativar/desativar num `watch(() => confirm_store.show, ...)`. Adicionar `@keydown="trap.onKeydown"` no painel.
4. Adicionar `onEscape` chamando `confirm_store.hide()` (equivalente a rejeitar sem executar a ação — confirmar com o time se Escape deve executar `rejectProps.action` ou apenas fechar), registrado enquanto `confirm_store.show` for verdadeiro e removido no fechamento e em `onBeforeUnmount`.
5. Elevar o `z-index` conforme a escala proposta em `overlays-modal-z-index-abaixo-do-popover-e-do-toast.md`, para que a confirmação sempre fique acima de modais e drawers.

## Verificação

- Teste em `tests/components/MaxPopoverConfirm.test.ts`: acionar `confirm_store.confirm(...)`, afirmar que o painel foi teleportado para `document.body` e que possui `role="alertdialog"` e `aria-modal="true"`.
- Teste de foco: afirmar que `document.activeElement` é o botão "Não" após a abertura.
- Teste de Escape: disparar `keydown` com `Escape` e afirmar que `confirm_store.show === false` e que nem `acceptProps.action` nem `rejectProps.action` foram chamadas indevidamente (conforme a decisão do passo 4).
- Teste de vínculo: afirmar que `aria-labelledby` aponta para o elemento com o texto da mensagem.
- `npx vitest run tests/components/MaxPopoverConfirm.test.ts`
