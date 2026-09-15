# Matriz de orquestração — fix5

Baseline: `31bbd8514e98f3ad83221828e192cdbaffd6d90a` (branch `fixes/optimize-fix5`).
Referência adversarial: `aac16bca`. Esta matriz é atualizada somente com evidências reais: ID do agente, timestamps, HEAD auditado, comandos, saída e status final.

| Papel | Tipo | Bloco/área | Status | Owner/manifest |
|---|---|---|---|---|
| IMP5-F07 | implementação | F07 | concluído — E04-02 reproduzido e corrigido; teste focal aprovado | agente `/root/imp5_f07`; início `2026-09-15T14:21:00-03:00`; fim `2026-09-15T14:24:00-03:00`; HEAD auditado `31bbd8514e98f3ad83221828e192cdbaffd6d90a`; manifesto: `src/helpers/useOutsidePointer.ts`, `tests/helpers/useOutsidePointer.test.ts`, `docs/optimize-new/execution-fix5/IMP5-F07.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-F14 | implementação | F14 | concluído — E06-01/E06-02 reproduzidos e corrigidos; unitário e type-check focal aprovados; cenário Chromium adicionado, mas não executável sem binário Playwright | agente `/root/imp5_f14`; início `2026-09-15T14:20:14-03:00`; fim `2026-09-15T14:25:27-03:00`; HEAD auditado `b44e6b744d4940bb5a05afa7f8c02d04ba1802ed`; manifesto: `src/components/base/MaxBaseVirtualScroller.vue`, `tests/components/base/MaxBaseVirtualScroller.test.ts`, `tests/browser/MaxBaseVirtualScroller.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-F14.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-F15 | implementação | F15 | concluído — E06-03/E08-04 reproduzidos e corrigidos; unitários, type-check e Chromium focais aprovados | agente `/root/imp5_f15`; início `2026-09-15T14:29:00-03:00`; fim `2026-09-15T14:33:49-03:00`; HEAD auditado `31bbd8514e98f3ad83221828e192cdbaffd6d90a`; manifesto: `src/components/MaxTagSelect.vue`, `src/components/MaxTopToolbar.vue`, `src/components/MaxTopToolbarSubmenu.vue`, `src/components/MaxTableFields.vue`, `tests/browser/MaxTagSelect.browser.ts`, `tests/unit/MaxTopToolbar.spec.ts`, `tests/components/MaxTopToolbarSubmenu.test.ts`, `tests/components/MaxTableFields.test.ts`, `docs/optimize-new/execution-fix5/IMP5-F15.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-F18 | implementação | F18 | concluído — retry após REV5-F18: fixture PNG raster de 48 MP e telemetria obrigatória de Long Tasks/heap; Chromium focal aprovado com valores registrados | agente `/root/imp5_f18`; início `2026-09-15T14:35:00-03:00`; retry concluído `2026-09-15T14:50:11-03:00`; HEAD auditado `8ee9e0bc25f3a7f82fd516ffd93b2777a1621eed`; manifesto: `tests/browser/MaxImage.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-F18.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-R01 | implementação | R01 | concluído | package.json, lockfile, CI e verify (serializado); `axe-core@4.11.0` e gate Chromium real integrados; ver `IMP5-R01.md` |
| IMP5-R02 | implementação | R02 | concluído — lint focal aprovado; lint global bloqueado em arquivo fora do ownership; verify bloqueado antes do lint por `svgo` ausente | agente `/root/imp5_r02`; início `2026-09-15T14:20:14-03:00`; fim `2026-09-15T14:21:01-03:00`; HEAD auditado `31bbd8514e98f3ad83221828e192cdbaffd6d90a`; manifesto: `src/locales/pt-br.ts`, `docs/optimize-new/execution-fix5/IMP5-R02.md` |
| IMP5-R03 | implementação | R03 | planejado | anatomia InputBase |
| IMP5-R04 | implementação | R04 | planejado | matriz InputBase |
| IMP5-R07 | implementação | R07 | concluído — E04-04 reproduzido e corrigido; foco, Escape e pointer externo agora compartilham a pilha canônica; testes unitários, lint, type-check e Chromium focal aprovados | agente `/root/imp5_r07`; início `2026-09-15T14:37:00-03:00`; fim `2026-09-15T14:40:00-03:00`; HEAD auditado `41c526941508ddb72c72f1bf31f86d2d2e99bbb4`; manifesto: `src/helpers/useFocusTrap.ts`, `src/components/MaxPopover.vue`, `tests/helpers/useFocusTrap.test.ts`, `docs/optimize-new/execution-fix5/IMP5-R07.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-R08 | implementação | R08 | concluído — IDREFs múltiplos, CSS e ancestrais preservados; Chromium e `axe-core` real aprovados com mutação detectável | agente `/root/imp5_r08`; início `2026-09-15T14:41:00-03:00`; fim `2026-09-15T14:48:00-03:00`; HEAD auditado `927560b08ec668df322b9c62a33e1559e7a5318a`; manifesto: `src/helpers/useAccessibleName.ts`, `tests/helpers/useAccessibleName.test.ts`, `tests/browser/useAccessibleName.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-R08.md`; `axe-core@4.11.0` integrado por IMP5-R01 |
| IMP5-R09 | implementação | R09 | concluído — E04-06/E04-07 reproduzidos e corrigidos; unitários e Chromium focais aprovados (warnings preexistentes de tooltip registrados) | agente `/root/imp5_r09`; início `2026-09-15T14:45:00-03:00`; fim `2026-09-15T14:53:00-03:00`; HEAD auditado `fixes/optimize-fix5` com patch não commitado; manifesto: `src/components/base/MaxBaseOverlay.vue`, `src/composables/useActiveOverlayPosition.ts`, `tests/components/base/MaxBaseOverlay.test.ts`, `tests/composables/useActiveOverlayPosition.test.ts`, `tests/browser/layersMobileClamp.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-R09.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-R12 | implementação | R12 | concluído — E07-04/E07-05 reproduzidos e corrigidos; picker único pelo input nativo, coordenadas zero e controles acessíveis validados por testes focais, lint e type-check | agente `/root/imp5_r12`; início `2026-09-15T14:50:00-03:00`; fim `2026-09-15T14:54:00-03:00`; HEAD auditado `925b8bf1b74fc3e187f12664b784f974e0a402e1`; manifesto: `src/components/MaxInputFileProject.vue`, `src/components/MaxMaps.vue`, `tests/components/MaxInputFileProject.test.ts`, `tests/components/MaxMaps.test.ts`, `tests/components/rev_r12_adversarial_maps.test.ts`, `docs/optimize-new/execution-fix5/IMP5-R12.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-R14 | implementação | R14 | concluído — removidos caminhos paralelos `:action`/`@complete` e guarda de tick; Enter/autofill Chromium e owner live focal aprovados | agente `/root/imp5_r14`; início `2026-09-15T14:53:00-03:00`; fim `2026-09-15T14:57:21-03:00`; HEAD auditado `adc637b1c6b8af0f584dc4af9c1f735d10838bfa` com mudanças locais; manifesto: `src/components/MaxAuthCard.vue`, `tests/components/MaxAuthCard.test.ts`, `tests/browser/MaxAuthCard.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-R14.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` |
| IMP5-R16 | implementação | R16 | concluído — E10-03/E10-04 corrigidos; parser associa alvos Tab ao foco local/rede canônica, inventário de `background-650` e Chromium focal aprovados; aguarda REV5-R16 | agente `/root/imp5_r16`; início `2026-09-15T14:58:00-03:00`; fim `2026-09-15T15:04:00-03:00`; HEAD auditado `288db2242e066d97011664e994b3bdff61c80481`; manifesto: estilos R16, `tests/architecture/focusVisibleInventory.test.ts`, `tests/browser/FocusVisibleInventory.browser.ts`, `docs/optimize-new/execution-fix5/R16-background-650-inventory.md`, `docs/optimize-new/execution-fix5/IMP5-R16.md` |
| IMP5-R17 | implementação | R17 | concluído — matriz derivada do CSS compilado cobre solid/outlined/text/link/dashed, 9 severidades, light/dark e estados; mutação em memória quebra o mesmo gate | agente `/root/imp5_r17`; início `2026-09-15T14:58:00-03:00`; fim `2026-09-15T15:02:00-03:00`; HEAD auditado `fixes/optimize-fix5` com mudanças locais; manifesto: `src/themes/tokens.scss`, `src/components/MaxButton.vue`, `tests/themes/tokensMutationReal.test.ts`, `docs/optimize-new/execution-fix5/IMP5-R17.md` |
| IMP5-R18 | implementação | R18 | planejado | reduced motion |
| IMP5-R19 | implementação | R19 | planejado | playground |
| IMP5-R21 | implementação | R21 | planejado | SVG |
| IMP5-R22 | implementação | R22 | planejado | lista virtual |
| IMP5-R23 | implementação | R23 | planejado | benchmark Vue |
| IMP5-R24 | implementação | R24 | planejado | exports/CSS |
| IMP5-R25 | implementação | R25 | planejado | consumidores |

| REV5-F07 | refutação | F07 | concluído — caso adversarial falha em `aac16bca` e passa no HEAD; ACEITO | agente `/root/rev5_f07`; início `2026-09-15T14:28:00-03:00`; fim `2026-09-15T14:31:56-03:00`; HEAD auditado `925b8bf1b74fc3e187f12664b784f974e0a402e1`; relatório `docs/optimize-new/execution-fix5/REV5-F07.md`; somente leitura |
| REV5-F14 | refutação | F14 | REJEITADO — contrato runtime refutou `aac16bca`, mas o aceite obrigatório Chromium + axe real não foi executado e `axe-core` não existe no checkout | agente `/root/rev5_f14`; início `2026-09-15T14:29:00-03:00`; fim `2026-09-15T14:30:32-03:00`; HEAD auditado `925b8bf1b74fc3e187f12664b784f974e0a402e1`; relatório: `docs/optimize-new/execution-fix5/REV5-F14.md`; somente leitura |
| REV5-F15 | refutação | F15 | concluído — caso adversarial de isButton (Tab/Enter/Espaço/disabled/emissão única) e inventário de icon-buttons passaram; ACEITO | agente `/root/rev5_f15`; início `2026-09-15T14:36:00-03:00`; fim `2026-09-15T14:38:20-03:00`; HEAD auditado `41c526941508ddb72c72f1bf31f86d2d2e99bbb4`; referência `aac16bca`; relatório `docs/optimize-new/execution-fix5/REV5-F15.md`; somente leitura |
| REV5-F18 | refutação | F18 | concluído — retry aceito: raster 48 MP, codificação, payload, erro/lifecycle e budgets obrigatórios aprovados (`831,3 ms`, `690 ms`, `0 B`) | agente `/root/rev5_f18`; início `2026-09-15T14:41:00-03:00`; fim `2026-09-15T14:52:00-03:00`; HEAD auditado `8dabecd0`; referência `aac16bca`; relatório `docs/optimize-new/execution-fix5/REV5-F18.md`; somente leitura |
| REV5-R01 | refutação | R01 | planejado | somente leitura |
| REV5-R02 | refutação | R02 | planejado | somente leitura |
| REV5-R03 | refutação | R03 | planejado | somente leitura |
| REV5-R04 | refutação | R04 | planejado | somente leitura |
| REV5-R07 | refutação | R07 | REJEITADO — o cenário Chromium existente usa Popover real, mas uma camada B sintética; não executa a pilha real IconPicker + Markdown + Popover exigida para Tab/Escape/pointer | agente `/root/rev5_r07`; início `2026-09-15T14:40:00-03:00`; fim `2026-09-15T14:42:31-03:00`; HEAD auditado `927560b08ec668df322b9c62a33e1559e7a5318a`; referência `aac16bca`; relatório `docs/optimize-new/execution-fix5/REV5-R07.md`; somente leitura |
| REV5-R08 | refutação | R08 | concluído — ACEITO; caso adversarial falha em `aac16bca` e passa no HEAD com múltiplos IDREFs/CSS/ancestral inert, Chromium e `axe-core` real com mutação detectável | agente `/root/rev5_r08`; início `2026-09-15T14:48:11-03:00`; fim `2026-09-15T14:49:54-03:00`; HEAD auditado `8ee9e0bc25f3a7f82fd516ffd93b2777a1621eed`; referência `aac16bca`; relatório `docs/optimize-new/execution-fix5/REV5-R08.md`; somente leitura |
| REV5-R09 | refutação | R09 | planejado | somente leitura |
| REV5-R12 | refutação | R12 | planejado | somente leitura |
| REV5-R14 | refutação | R14 | concluído — ACEITO; caso adversarial falha em `aac16bca` pelos caminhos `:action`/`@complete` e guarda de tick, enquanto HEAD usa somente submit nativo; Enter/autofill Chromium e owner live focal aprovados | agente `/root/rev5_r14`; início `2026-09-15T14:58:00-03:00`; fim `2026-09-15T15:00:08-03:00`; HEAD auditado `288db2242e066d97011664e994b3bdff61c80481`; referência `aac16bca`; relatório `docs/optimize-new/execution-fix5/REV5-R14.md`; somente leitura |
| REV5-R16 | refutação | R16 | planejado | somente leitura |
| REV5-R17 | refutação | R17 | planejado | somente leitura |
| REV5-R18 | refutação | R18 | planejado | somente leitura |
| REV5-R19 | refutação | R19 | planejado | somente leitura |
| REV5-R21 | refutação | R21 | planejado | somente leitura |
| REV5-R22 | refutação | R22 | planejado | somente leitura |
| REV5-R23 | refutação | R23 | planejado | somente leitura |
| REV5-R24 | refutação | R24 | planejado | somente leitura |
| REV5-R25 | refutação | R25 | planejado | somente leitura |
| GATE5-LINT-TSC | gate | lint/type-check | planejado | package/TS |
| GATE5-UNIT-ASYNC | gate | unitários/async | planejado | testes |
| GATE5-BROWSER-AXE | gate | browser/axe | planejado | browser |
| GATE5-OVERLAYS-FOCUS | gate | overlays/foco | planejado | browser |
| GATE5-INPUTS-FORMS | gate | inputs/forms | planejado | browser |
| GATE5-IMAGE-PERFORMANCE | gate | imagem/performance | planejado | testes |
| GATE5-MOTION-CONTRAST | gate | motion/contraste | planejado | browser |
| GATE5-PLAYGROUND | gate | playground | planejado | playground |
| GATE5-SVG-BUNDLE | gate | SVG/bundle | planejado | scripts |
| GATE5-PACKAGE-CONSUMERS | gate | consumidores | planejado | scripts |
| GATE5-CI-REPRODUCIBILIDADE | gate | CI/reprodutibilidade | planejado | CI |
| PRES5-F03 | preservação | F03 | planejado | somente leitura |
| PRES5-F12 | preservação | F12 | planejado | somente leitura |
| PRES5-F17 | preservação | F17 | planejado | somente leitura |
| PRES5-R05 | preservação | R05/F06 | planejado | somente leitura |
| PRES5-R06 | preservação | R06/F08 | planejado | somente leitura |
| PRES5-R10 | preservação | R10/F13 | planejado | somente leitura |
| PRES5-R11 | preservação | R11/F16 | planejado | somente leitura |
| PRES5-R13 | preservação | R13/F20 | planejado | somente leitura |
| PRES5-R15 | preservação | R15/F22 | planejado | somente leitura |
| PRES5-R20 | preservação | R20/F26 | planejado | somente leitura |

Nenhum status planejado ou em execução é evidência de conclusão. Cada linha será atualizada com identificador real do agente, timestamps, HEAD e link para seu relatório próprio.

Ordem de ondas: R02 (lint) → commit limpo → implementadores sem conflito → R01 (integração de gates) → refutadores → gates e preservações. Orçamento de cada papel: reprodução, mudança/teste focal quando aplicável, relatório com saída integral relevante.
