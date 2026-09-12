# Superfícies modais especializadas não completam o ciclo de foco

## Resumo
Drawers e lightboxes especializados reimplementam overlay modal sem foco inicial previsível, contenção e restauração. O calendário teleportado tem um problema separado de foco/semântica, mas não deve receber focus trap automaticamente por ser um popup modeless.

## Severidade e prioridade
Alta — P1. WCAG 2.1.1, 2.4.3 e 4.1.2.

## Evidências
- `src/components/MaxInputIconPicker.vue:32-103,301-319`: drawer com backdrop sem `role="dialog"`, `aria-modal`, Escape, foco inicial, contenção ou retorno ao gatilho.
- `src/components/MaxInputMarkdown.vue:12-58,151-170`: lightbox declara modal e trava scroll, mas não move foco, não contém Tab e não restaura o foco.
- `src/components/MaxImage.vue:18-29,275-294`: modal recebe foco no contêiner, porém não contém Tab nem devolve foco ao originador.
- `src/components/MaxTopMenuSearchBar.vue:17-53,92-101`: dialog móvel tenta focar a busca, mas não contém Tab nem restaura ao botão de abertura.
- `src/helpers/useFocusTrap.ts:35-45,70-76`: o trap central não exclui descendentes de ancestral oculto e deixa Tab escapar quando não encontra descendentes focáveis; este caso-limite afeta consumidores modais que dependem do helper.
- `src/components/MaxInputDatePicker.vue:27-34,65-106,646-669`: a grade possui teclado, mas a abertura não transfere foco nem declara a relação/papel do popup; por estar teleportada ao fim de `body`, Tab não entra previsivelmente na grade.

## Afetados
`MaxInputIconPicker`, lightboxes de `MaxInputMarkdown` e `MaxImage`, busca móvel e o calendário de `MaxInputDatePicker`. O caso-limite do helper alcança consumidores modais sem descendentes focáveis.

## Causa-raiz
Há arquiteturas paralelas: modais centrais usam `useFocusTrap`; overlays especializados controlam apenas visibilidade/backdrop. O DatePicker implementa teclado da grade sem definir um contrato completo entre input e popup.

## Impacto e reprodução
Abrir cada modal especializado e pressionar Tab até o fim: o foco alcança conteúdo encoberto; ao fechar, não retorna ao originador. No DatePicker, a grade operável não é o próximo destino previsível de foco e o popup não é identificado pelo input.

## Direção de correção
Centralizar superfícies bloqueantes em gerenciador comum com semântica, foco inicial/retorno, Escape, stack e scroll lock. Para o calendário, escolher e documentar um padrão combobox/dialog modeless e implementar o fluxo de foco correspondente, sem presumir contenção modal.

## Critérios de aceite
- Modal tem nome/papel, foco inicial e retorno.
- Tab/Shift+Tab não alcançam conteúdo encoberto em superfícies realmente modais.
- Calendário é identificado, alcançável e operável sem mouse.
- Testes cobrem abertura, ciclo de Tab, Escape e retorno.

## Contraevidências
`MaxInputSelect`, `MaxTagSelect`, autocompletes e o calendário podem ser popups modeless; focus trap não é requisito por si só. `MaxModal`, `MaxDrawer`, `MaxPopoverConfirm` e `MaxPdfView` já usam trap nos fluxos comuns. `MaxBaseOverlay` move/restaura foco e é uma base genérica sem `aria-modal`, portanto foi retirado da alegação de ausência de trap.
