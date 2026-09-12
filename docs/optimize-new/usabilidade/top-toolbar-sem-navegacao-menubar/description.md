# Menubar e submenus não possuem navegação hierárquica completa

## Resumo
`MaxTopToolbar` marca itens como menuitem, mas todos usam tabindex 0; submenus reais têm itens clicáveis sem role/teclado e níveis aninhados abrem somente por hover.

## Severidade e prioridade
Alta — P1. WCAG 2.1.1, 2.4.3 e 4.1.2.

## Evidências
- `src/components/MaxTopToolbar.vue:3-25`: sem roving/ArrowLeft/Right/Home/End; ArrowDown não move foco ao submenu.
- `src/components/MaxTopToolbarSubmenu.vue:2-48,76-80`: itens rotulados são divs click-only; aninhados dependem de mouseenter.
- `tests/unit/MaxTopToolbar.spec.ts:21-39,60-132`: submenu é stub e foco real não é exercitado.

## Afetados
MaxTopToolbar e MaxTopToolbarSubmenu, inclusive níveis recursivos.

## Causa-raiz
Sem controlador compartilhado de foco/itens entre menubar pai e submenu recursivo.

## Impacto e reprodução
Abrir toolbar por teclado: itens do submenu com label e sem botão interno ficam inalcançáveis; setas horizontais não percorrem a barra.

## Direção de correção
Implementar roving no menubar e menus, foco ao abrir, setas por orientação, Home/End/Escape e retorno ao pai.

## Critérios de aceite
Todos os níveis são alcançáveis sem mouse, têm role/nome/estado e seguem um único fluxo de foco.

## Contraevidências
PopoverMenu e UserSection já implementam roving; TopToolbar cobre parcialmente Enter/Espaço/Escape.
