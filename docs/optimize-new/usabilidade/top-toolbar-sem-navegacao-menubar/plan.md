# Plano de implementação

## Objetivo e resultado esperado

Implementar navegação hierárquica completa no menubar e nos submenus recursivos, com um fluxo de foco previsível por teclado e sem dependência de hover.

## Escopo e fora de escopo

- Em escopo: `MaxTopToolbar`, `MaxTopToolbarSubmenu`, todos os níveis, estados e retorno de foco.
- Fora de escopo: conteúdo do store, rotas/commands e menus `MaxPopoverMenu`/`MaxUserSection`.

## Arquivos a alterar/criar

- `src/components/MaxTopToolbar.vue`
- `src/components/MaxTopToolbarSubmenu.vue`
- `src/helpers/useMenuRoving.ts` (novo, se compartilhado)
- `tests/components/MaxTopToolbar.test.ts`
- `tests/unit/MaxTopToolbar.spec.ts`

## Dependências e ordem

1. Definir identidade/ref de itens navegáveis e separadores.
2. Implementar roving no nível raiz.
3. Implementar protocolo recursivo pai/filho.
4. Substituir stubs por integração real nos testes de teclado.

## Passos de implementação

1. Manter `role="menubar"` na raiz e tornar exatamente um `menuitem` habilitado `tabindex="0"`; separadores e itens vazios ficam fora da navegação.
2. Implementar ArrowLeft/Right, Home/End no nível raiz, com foco real e salto de itens desabilitados.
3. Ao usar ArrowDown/Enter/Espaço em item com filhos, abrir o submenu e focar seu primeiro item; expor `aria-haspopup="menu"`, `aria-expanded` e `aria-controls` com IDs existentes.
4. No submenu, trocar divs click-only por alvos nativos ou `menuitem` focável único e implementar ArrowUp/Down, Home/End e ativação por Enter/Espaço.
5. Em nível aninhado, ArrowRight abre/foca filho; ArrowLeft ou Escape fecha o nível e devolve foco ao item pai; Escape na raiz fecha toda a cadeia.
6. Coordenar estado/foco via eventos ou composable compartilhado, mantendo hover como entrada equivalente e cancelando timers ao navegar por teclado.
7. Evitar `MaxIconButton` focável dentro de `menuitem`; ícone é decorativo ou o próprio botão é o único menuitem.

## Migração e compatibilidade

Preservar schema de `toolbar.items`, ações, commands, rotas, classes e hover. A redução de múltiplas paradas de Tab segue o padrão menubar; documentar setas e Escape como novo contrato.

## Testes

- Unitários: roving raiz, setas/Home/End, disabled/separadores, abertura e `aria-expanded/controls`.
- Integração com submenu real: profundidade ≥3, foco ao abrir, ArrowLeft/Right, Escape, retorno ao pai e emissão única.
- Acessibilidade: roles/nome/estado por nível e ausência de interativos aninhados.

## Critérios de aceite mensuráveis

- Exatamente um item habilitado por menu possui `tabindex="0"`.
- Todos os níveis são alcançáveis e fecháveis sem mouse conforme teclas definidas.
- Abrir/fechar sempre move ou restaura foco ao alvo previsto.
- Nenhum item produz ação dupla e todas as suítes da toolbar passam sem timers pendentes.

## Riscos e rollback

Timers de hover podem competir com foco e recursão pode reter refs obsoletas. Cancelar timers na entrada de teclado e limpar refs no unmount. Em regressão, desativar hover atrasado durante foco sem remover o roving.

## Validação final

Executar as suítes unitária/componente, lint/typecheck e percorrer manualmente uma árvore de três níveis apenas com Tab, setas, Home/End, Enter, Espaço e Escape.
