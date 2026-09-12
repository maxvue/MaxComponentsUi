# Plano de implementação — foco visível sistêmico

## Objetivo e escopo

Aplicar indicador canônico a todo alvo focável da biblioteca, com contraste ≥3:1 em claro/escuro e sem recorte. Cobrir controles nativos, roles interativos, listboxes, toolbars e overlays; não alterar ordem de tabulação.

## Fora de escopo

Não mudar ordem de tabulação, comportamento de teclado ou semântica dos widgets; focus trap e contratos ARIA específicos permanecem em achados próprios.

## Arquivos

- Criar mixin compartilhado em `src/themes/_focus.scss` ou equivalente.
- Alterar `src/themes/tokens.scss` e os SFCs inventariados, começando por `MaxAccordionItem.vue`, `MaxInputMarkdownToolbar.vue`, `MaxTable.vue`, `MaxListBox.vue` e `InputBase.vue`.
- Ampliar `tests/unit/FocusVisible.spec.ts` e `tests/architecture/styleStandardsValidation.test.ts`.
- Criar matriz visual/a11y no playground/testes browser.

## Dependências e ordem

1. Inventariar todos os alvos.
2. Validar tokens nos dois temas.
3. Criar mixin e migrar por família.
4. Ativar gate arquitetural após zerar pendências.

## Passos

1. Gerar inventário estático de `button`, links, inputs, `tabindex` e roles interativos.
2. Padronizar mixin com `--max-focus-ring-color`/offset e variante inset para containers com overflow.
3. Substituir borda `:focus` e azuis diretos por `:focus-visible` canônico, sem remover foco nativo até o novo indicador estar ativo.
4. Migrar accordion, toolbars, tabela, listbox, menus, popovers e gatilhos customizados.
5. Testar estado combinado selected/disabled/open e evitar anel em clique quando `:focus-visible` não casar.
6. Gate exige regra/mixin ou exceção documentada para cada alvo.

## Migração e testes

Sem mudança de API. Overrides devem usar tokens de foco existentes. Unitários verificam classes/disabled; browser testa Tab/Shift+Tab em claro/escuro/overlays; visual mede recorte e contraste. Performance não é afetada.

## Aceite

100% dos alvos inventariados têm foco explícito/exceção; contraste do anel ≥3:1; nenhum foco é cortado; teste arquitetural detecta novo alvo sem tratamento.

## Riscos e rollback

Seletores globais podem duplicar anéis; aplicar mixin local. Outline pode alterar layout se virar border; usar outline/box-shadow. Rollback por família com exceção temporária no inventário.

## Validação final

Matriz completa por teclado, testes FocusVisible/arquitetura, snapshots claro/escuro a 200% zoom, suíte, stylelint e `git diff --check`.
