# Foco visual fragmentado em controles interativos

## Resumo

A biblioteca possui tokens canônicos de foco, mas sua adoção é parcial. Há botões nativos, elementos com `role="button"`, listboxes e controles de toolbar sem qualquer regra `:focus-visible`; outros usam apenas mudança sutil de borda em `:focus`. A navegação por teclado, portanto, alterna entre anel canônico, indicação fraca e nenhuma indicação visual.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/themes/tokens.scss:32-36`: existem `--max-focus-ring`, `--max-focus-outline` e cores próprias.
- `src/components/MaxAccordionItem.vue:4-18` torna o cabeçalho focável, mas `src/components/MaxAccordionItem.vue:115-145` só estiliza hover/ativo/disabled.
- `src/components/MaxInputMarkdownToolbar.vue:358-390`: dezenas de botões de formatação não têm `:focus-visible`; os botões do popover em `434-462` também não.
- `src/components/MaxInputMarkdownToolbar.vue:416-431`: o input remove outline e substitui por uma mudança de borda de 1 px com fallback azul não canônico.
- `src/components/MaxTable.vue:231-278` contém controles nativos de paginação; `src/components/MaxTable.vue:950-973` define hover e disabled, mas nenhum foco.
- `src/components/MaxListBox.vue:21-30` torna o listbox focável; o arquivo não declara `:focus-visible` para o container.
- `src/components/InputBase.vue:258-274` e controles especializados usam `--max-primary-500` diretamente; contra `--background-0: #17293D` no dark, `#00768E` produz só 2,80:1. O token dark-aware troca para `#178DA5` (`src/themes/tokens.scss:60-65`).
- A busca estática encontra apenas 22 SFCs com `:focus-visible`, apesar de pelo menos 25 arquivos adicionais conterem botões, `tabindex` ou papéis interativos.
- `tests/unit/FocusVisible.spec.ts:66-83` cobre somente `MaxButton` e `MaxIconButton`.

## Componentes e consumidores afetados

Accordion, Markdown/Code toolbars, Table/paginador/cabeçalhos ordenáveis, ListBox, menus, popovers, transições acionáveis, visualizadores e componentes com gatilhos customizados.

## Causa-raiz

O foco foi corrigido componente a componente após a migração, sem uma primitiva/contrato visual aplicado a todos os elementos acionáveis. Os testes também foram escritos para dois botões-base, permitindo que controles nativos internos escapem do padrão.

## Impacto visual e funcional

Usuários de teclado perdem a posição atual e não conseguem distinguir qual ação será executada. Visualmente, componentes da mesma biblioteca parecem adotar sistemas de foco diferentes.

## Reprodução e verificação

Navegar somente com Tab/Shift+Tab pelo playground ou por uma matriz de stories contendo todos os controles. Verificar o foco sob temas claro e escuro, inclusive em overlays teleportados.

## Direção recomendada

Criar uma regra/primitiva compartilhada de foco baseada nos tokens existentes e aplicá-la a toda parte interativa, sem remover aliases legados. Validar contraste e recorte do anel dentro de containers com `overflow: hidden`.

## Critérios de aceite

- Todo alvo teclado-focável possui indicador persistente e perceptível em ambos os temas.
- O anel usa tokens canônicos e atinge contraste mínimo de 3:1 contra estados adjacentes.
- Teste arquitetural inventaria controles focáveis e exige tratamento explícito ou exceção documentada.

## Contraevidências consideradas

- `MaxButton`, `MaxIconButton`, inputs de seleção e parte dos menus já têm foco visível; a existência desses bons exemplos reforça, mas não universaliza, o contrato.
- O outline nativo pode aparecer em alguns navegadores quando não foi removido; depender de estilo do UA não garante identidade nem contraste no tema escuro.
