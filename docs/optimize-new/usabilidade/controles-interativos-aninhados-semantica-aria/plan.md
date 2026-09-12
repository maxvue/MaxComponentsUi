# Plano de implementação

## Objetivo e resultado esperado

Eliminar controles interativos aninhados e estabelecer propriedade única de cada ação. Cada superfície visual deve resultar em um único Tab stop e uma única invocação, inclusive com slots customizados.

## Escopo e fora de escopo

- Em escopo: gatilhos de Popover/PopoverMenu/BottomMenu, itens de menus, limpar/remover em selects/tags e visualizar/remover upload.
- Fora de escopo: redesenho visual, lógica de negócio das ações e o roving dos itens já corretos de `MaxPopoverMenu`.

## Arquivos a alterar/criar

- `src/components/MaxPopoverMenu.vue`, `src/components/MaxPopover.vue`, `src/components/MaxBottomMenu.vue`
- `src/components/MaxMenuVerticalItem.vue`, `src/components/MaxTopToolbar.vue`
- `src/components/MaxInputSelect.vue`, `src/components/MaxTagSelect.vue`, `src/components/MaxTagsList.vue`
- `src/components/MaxInputFileUpload.vue`
- Testes homônimos em `tests/components/` e `tests/unit/`
- `tests/architecture/noNestedInteractiveControls.test.ts` (novo)

## Dependências e ordem

1. Definir contrato único para gatilhos e slots.
2. Corrigir popovers e menus.
3. Separar ações secundárias de selects/tags/upload.
4. Adicionar teste arquitetural e regressões por componente.

## Passos de implementação

1. Nos popovers, usar botão nativo no fallback e fornecer ao slot escopado os attrs/handlers/ref do gatilho (`aria-expanded`, `aria-controls`, teclado e foco), sem wrapper focável adicional.
2. Ajustar `MaxBottomMenu` para não envolver seu FAB nativo em outro link/botão e manter a mesma emissão/rota.
3. Em `MaxMenuVerticalItem` e `MaxTopToolbar`, tornar conteúdo decorativo não focável e posicionar ações secundárias como irmãos; remover guards criados apenas para compensar bubbling entre controles aninhados.
4. Em `MaxInputSelect` e `MaxTagSelect`, separar botão de limpar/remover do nó `combobox`, mantendo associação visual, nomes acessíveis e eventos sem propagação.
5. Em `MaxTagsList`, renderizar remoção como botão nativo irmão do conteúdo da tag.
6. Em `MaxInputFileUpload`, separar botão de visualização e botão de remoção dentro de contêiner não interativo; ambos recebem nome contextual com o arquivo.
7. Marcar ícones puramente visuais como `aria-hidden`/não focáveis.
8. Criar teste que monte variantes padrão e por slot e falhe se um seletor interativo contiver outro; complementar com contagem de foco e emissão.

## Migração e compatibilidade

Preservar classes, props, emits e slots existentes. Introduzir attrs de slot de forma aditiva e aceitar temporariamente slots antigos com aviso de desenvolvimento quando gerarem raiz interativa incompatível. Documentar que o consumidor deve aplicar os attrs a um único elemento.

## Testes

- Unitários por família: clique/Enter/Espaço emite uma vez; ação secundária não aciona a primária.
- Integração: ordem de Tab, foco ao abrir/fechar, slots padrão e customizados, estados expanded/selected.
- Arquitetura/a11y: zero ocorrências de botão/link/input/combobox focável dentro de outro interativo nos cenários montados.

## Critérios de aceite mensuráveis

- Zero elementos interativos aninhados nos componentes listados.
- Cada ação visível possui um único Tab stop e uma emissão por ativação.
- Slots padrão e customizados mantêm nome, estado e teclado.
- Suítes existentes de menus, selects, tags e upload permanecem verdes.

## Riscos e rollback

Mudanças de DOM podem afetar CSS e slots de consumidores. Mitigar conservando classes e oferecendo transição aditiva. Se necessário, reverter uma família isoladamente sem remover o contrato/teste das famílias já migradas.

## Validação final

Executar testes focados e completos, lint/typecheck, teste arquitetural e inspeção manual do DOM/Tab em todas as variantes listadas.
