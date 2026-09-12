# Controles compostos aninham elementos interativos

## Resumo
Wrappers com `role`, tabindex e handlers contêm botões nativos, criando dois nós/Tab stops para a mesma superfície e ownership ambíguo.

## Severidade e prioridade
Alta — P1. WCAG 1.3.1, 2.4.3 e 4.1.2.

## Evidências
- `src/components/MaxPopoverMenu.vue:3-22` e `MaxPopover.vue:3-16`: `div role=button` contém `MaxButton`.
- `src/components/MaxBottomMenu.vue:35-48`: injeta botão no mesmo gatilho.
- `src/components/MaxMenuVerticalItem.vue:2-19,85-90`: link ARIA contém `MaxIconButton`, exigindo lógica para evitar ação duplicada.
- `src/components/MaxTopToolbar.vue:17-30`: menuitem contém botão focável.
- `src/components/MaxInputSelect.vue:7-18,37-45`: combobox contém botão de limpar.
- `src/components/MaxTagSelect.vue:15-55` com `MaxTagsList.vue:4-8`: slot injeta botão no combobox.
- `src/components/MaxInputFileUpload.vue:79-100`: miniatura `role=button` contém botão de remoção.

## Afetados
Popover/Menu, BottomMenu, MenuVerticalItem, TopToolbar, InputSelect, TagSelect/TagsList e InputFileUpload.

## Causa-raiz
Contêiner e filho disputam propriedade da interação; slots não distinguem gatilho interativo de conteúdo apresentacional.

## Impacto e reprodução
Inspecionar DOM real e navegar com Tab: há controles sobrepostos, anúncios redundantes e caminhos divergentes para clique/Enter/Espaço; eventos podem executar duas vezes.

## Direção de correção
Usar um único elemento nativo por ação; fornecer attrs/handlers ao slot do gatilho; manter ações secundárias como irmãs e ícones decorativos não focáveis.

## Critérios de aceite
- Nenhum interativo contém outro.
- Uma ação visual equivale a um Tab stop e uma invocação.
- Slots padrão/customizados preservam nome, estado e teclado.

## Contraevidências
Botões isolados são nativos. Itens do menu de `MaxPopoverMenu` já têm roving tabindex; não são a causa.
