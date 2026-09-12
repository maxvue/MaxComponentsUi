# Plano de implementação — escala semântica de camadas

## Objetivo e resultado esperado

Substituir números globais arbitrários por uma ordem documentada de papéis visuais. Dropdowns, popovers, navegação, modais/drawers, toast, tooltip e bloqueios devem compor-se de modo previsível, mantendo z-index local pequeno apenas dentro do próprio stacking context.

## Escopo e fora de escopo

- Escopo: inventário de stacking contexts, tokens, migração de camadas globais, offsets aninhados e testes de composição.
- Fora: substituir `z-index: 0/1/2` puramente interno ou redesenhar cada overlay.

## Arquivos-alvo

- `src/themes/tokens.scss`, `src/themes/params.scss` e novo `docs/LAYERS.md`.
- `src/components/base/MaxBaseOverlay.vue` e componentes com camada global: selects/autocompletes/date/phone/tag, popovers, menus, Modal, Drawer, IconPicker, Image, Markdown/Code fullscreen, Toast, toolbars e `MaxLoadScreenTarget.vue`.
- Criar `tests/themes/layers.test.ts` e `tests/components/layerComposition.test.ts`.

## Dependências e ordem

1. Inventariar todos os `z-index` e ancestrais com `transform`, `filter`, `opacity`, `isolation` ou positioned context.
2. Aprovar ordem de papéis no design system.
3. Materializar tokens e migrar componentes por nível, começando por navegação/dropdown e terminando em bloqueios.
4. Integrar com planos de posicionamento ativo, overlays SSR e playground.

## Passos detalhados

1. Definir tokens ordenados para sticky local, navegação, dropdown, popover, modal/drawer, fullscreen, toast, tooltip e bloqueio global; documentar quando toast/tooltip deve ou não aparecer sobre bloqueio.
2. Diferenciar `--max-layer-*` globais de índices locais (`0–10`) e remover `!important` onde não houver conflito real.
3. Fazer overlays teleportados consumirem papel explícito; `MaxBaseOverlay` aceita camada/offset contextual validado em vez de contador por instância.
4. Permitir que dropdown dentro de modal fique acima do modal sem ultrapassar tooltip/bloqueio global.
5. Migrar `.max-tooltip`, submenu superior e `MaxLoadScreenTarget` para tokens; eliminar o caso em que submenu fica acima do tooltip por acaso.
6. Guardrail estático deve rejeitar novo z-index global literal fora da allowlist de valores locais documentados.

## Migração e compatibilidade

- Classes, props e Teleports permanecem; uma prop/opção de layer só é adicionada se necessária para nesting.
- Expor tokens como custom properties permite override controlado do host.
- Mudança de ordem visual é correção deliberada; registrar tabela antes/depois.

## Testes pertinentes

- Compor select em modal, tooltip em submenu, toast durante loading, IconPicker em modal e preview com toolbar.
- Verificar por CSS computado e hit-testing (`elementFromPoint`) qual camada recebe interação.
- Afirmar ordem numérica dos tokens e ausência de literais globais fora da allowlist.
- Screenshots claro/escuro e teclado/foco; bloqueio não pode deixar conteúdo inferior acionável.
- Benchmark não se aplica.

## Critérios de aceite

- Toda camada global usa `--max-layer-*` e possui papel documentado.
- Testes de composição confirmam a ordem aprovada e hit target correto.
- Nenhum componente funcional depende de `59`, `99`, `940`, `1100`, `9999`, `99999`, `100000` ou `999999` literal.
- Valores locais restantes estão classificados e não escapam do contexto.
- Stylelint/guardrail, testes, type-check e build passam.

## Riscos, rollback e validação final

- Riscos: stacking context ancestral neutralizar token e bloqueio esconder feedback crítico. Mitigar com inventário e testes reais de composição.
- Rollback: reverter migração por papel, mantendo tokens/documentação; não restaurar números distintos por componente.
- Validar todas as combinações, viewport móvel, temas, hit-testing, foco e busca final por literais.
