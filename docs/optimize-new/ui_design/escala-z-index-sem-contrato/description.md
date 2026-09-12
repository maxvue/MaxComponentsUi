# Camadas visuais usam valores de z-index sem contrato compartilhado

## Resumo

Overlays, modais, menus, tooltips, toasts e estados de loading adotam dezenas de valores locais (`59`, `99`, `940`, `950`, `1100`, `1200`, `9999`, `99999`, `100000`, `999999`). A ordem final passa a depender do componente usado, não do papel visual da camada.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/components/MaxModal.vue:430-445`: modal global em 59.
- `src/components/MaxPopover.vue:245-263`: popover em 99.
- `src/components/MaxInputSelect.vue:746-752`: seletor em 1100/1101.
- `src/components/MaxInputIconPicker.vue:383`: drawer do picker em 1200.
- `src/components/MaxToast.vue:130-139`: toast em 9999.
- `src/themes/params.scss:158-168`: tooltip global em 99999.
- `src/components/MaxTopToolbarSubmenu.vue:180`: submenu em 100000, acima do tooltip.
- `src/components/MaxLoadScreenTarget.vue:72-103`: loading local usa simultaneamente 2, 10000 e 999999 com `!important`.
- A varredura encontra mais de 60 declarações de `z-index` em componentes, sem tokens de camada em `src/themes/tokens.scss`.

## Componentes e consumidores afetados

Todos os overlays e composições entre modal, drawer, dropdown, autocomplete, datepicker, toolbar, tooltip, toast, image preview e loading target.

## Causa-raiz

Cada componente reconstruiu sua própria ordem de empilhamento após a migração. `MaxBaseOverlay` padroniza parte do posicionamento, mas não existe escala global por papel nem coordenação entre stacking contexts criados por `position`, `transform` e `filter`.

## Impacto visual e funcional

Menus podem aparecer por cima de loading bloqueante, tooltips atrás ou abaixo de submenus, e overlays internos de modal podem escapar da hierarquia esperada. O uso de `!important` impede correção contextual por consumidores.

## Reprodução e verificação

Montar combinações cruzadas: select dentro de modal; tooltip sobre submenu; toast durante loading; icon picker aberto a partir de modal; preview de imagem com toolbar. Inspecionar também ancestrais que criam stacking context.

## Direção recomendada

Definir tokens de camada por papel (conteúdo sticky, navegação, dropdown, popover, modal/drawer, toast, tooltip, bloqueio global), e permitir offset contextual quando overlays forem aninhados. Migrar valores sem alterar a compatibilidade de classes públicas.

## Critérios de aceite

- A ordem de empilhamento é documentada e coberta por testes de composição.
- Nenhum overlay funcional depende de números arbitrários locais.
- Loading bloqueante, modal, tooltip e notificações têm precedência deliberada e verificável.

## Contraevidências consideradas

- Alguns valores pequenos (`1`, `2`, `5`) são internos ao próprio componente e podem permanecer locais.
- O tooltip em 99999 é o único valor global documentado no GEMINI; o problema é a ausência de contrato para as demais camadas e a existência de componentes acima dele.
