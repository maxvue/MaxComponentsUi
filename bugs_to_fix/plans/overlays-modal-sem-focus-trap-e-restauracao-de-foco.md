# MaxModal não usa `useFocusTrap` — foco escapa para o fundo e não é restaurado ao fechar

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxModal.vue:8-29`, `src/components/MaxModal.vue:33-41`, `src/helpers/useFocusTrap.ts:24`
- **Domínio:** overlays-navegacao

## Problema

O `MaxModal` renderiza o overlay via `<teleport to="body">` (linha 8) com `.background-modal` / `.max-modal`, mas **não importa nem usa** o helper `useFocusTrap` (`src/helpers/useFocusTrap.ts`), ao contrário do `MaxDrawer` (`src/components/MaxDrawer.vue:59,113,184,194`).

Consequências concretas:

1. Ao abrir o modal, o foco do teclado permanece no botão gatilho, fora do painel teleportado. Nenhum elemento do modal recebe foco inicial.
2. Tabulando, o usuário sai do modal e navega pelo conteúdo da página que está atrás da máscara (que continua no fluxo de foco — não há `inert` nem `aria-hidden` no restante da página).
3. Ao fechar (via `modal_store.hide` na linha 9 ou 18, ou via `close()` na linha 230), o foco não é devolvido a nenhum elemento — ele fica em um nó que foi removido do DOM, e o browser reverte para `document.body`, perdendo o ponto de navegação.

O `MaxDrawer` já demonstra o padrão correto no mesmo repositório: `const trap = useFocusTrap(panel_el)` + `trap.activate()` na abertura + `trap.deactivate()` no fechamento + `@keydown="trap.onKeydown"` no painel.

## Impacto

Usuários de teclado e de leitor de tela não conseguem operar o modal de forma previsível: interagem com controles invisíveis atrás da máscara, e perdem a posição de navegação ao fechar. É uma falha de conformidade WAI-ARIA para o padrão `dialog` e afeta toda aplicação consumidora que usa `MaxModal`.

## Plano de correção

1. Em `src/components/MaxModal.vue`, importar `useFocusTrap` de `../helpers/useFocusTrap`.
2. Adicionar `const panel_el = useTemplateRef<HTMLElement>('el')` — o ref `el` já existe na linha 10/111, aproveitá-lo.
3. Criar `const trap = useFocusTrap(el as Ref<HTMLElement | null>)`.
4. Adicionar `@keydown="trap.onKeydown"` no `<div class="max-modal" ref="el">` (linha 10).
5. Adicionar um `watch(is_show, (value) => { if (value) trap.activate(); else trap.deactivate(); })` — `is_show` já existe na linha 100. Usar `nextTick` implícito já embutido no `activate()`.
6. Garantir `trap.deactivate()` também em `onBeforeUnmount`, para o caso de o modal ser desmontado aberto.
7. Manter a indentação de 4 espaços, aspas simples e ponto e vírgula (convenção do projeto).

## Verificação

- Novo teste em `tests/components/MaxModal.test.ts`: montar o modal com um `<button>` no slot de conteúdo, abrir via `open()`, avançar timers e afirmar que `document.activeElement` é o botão interno.
- Teste de restauração: focar um botão externo, abrir, fechar, avançar 300ms e afirmar que `document.activeElement` voltou ao botão externo.
- Teste de ciclo de Tab: disparar `keydown` com `key: 'Tab'` no último focável e afirmar que o foco volta ao primeiro (espelhando os testes já existentes de `useFocusTrap` em `tests/components/MaxDrawer.test.ts:41`).
- `npx vitest run tests/components/MaxModal.test.ts`
