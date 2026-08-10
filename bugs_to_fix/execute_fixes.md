# Plano de execução das correções — `bugs_to_fix`

Consolida os **182 achados** em [`bugs_to_fix/plans/`](plans/), produzidos por 8 agentes de auditoria em paralelo (helpers/composables, stores/barrel, inputs de texto, inputs de seleção/arquivo, overlays/navegação, tabela/layout, build/config, docs/qualidade de testes).

## Baseline verificado no início da auditoria

| Verificação | Resultado |
|---|---|
| `npx vitest run` | **1235 testes / 109 arquivos — todos passando** |
| `npm run type-check` | limpo |
| `npx eslint .` | limpo |
| `npx stylelint "**/*.{scss,vue}"` | limpo |
| Cobertura v8 | 90,6% stmts / 81,09% branches / 87,4% functions / 94% lines |

**Consequência importante:** a suíte verde **não** significa ausência de bugs — vários achados críticos existem justamente em código coberto por testes que não asseveram comportamento (ver Etapa 9). Nenhuma etapa abaixo pode ser considerada concluída sem *novos* testes que falhem antes da correção e passem depois.

## Distribuição dos achados

| Severidade | Qtd. | | Categoria | Qtd. |
|---|---|---|---|---|
| Crítica | 5 | | bug | 60 |
| Alta | 41 | | falta-de-teste | 29 |
| Média | 109 | | falha | 21 |
| Baixa | 27 | | divergência | 19 |
| | | | acessibilidade | 18 |
| | | | melhoria | 10 |
| | | | build | 8 |
| | | | segurança | 5 |
| | | | qualidade-de-teste | 5 |
| | | | performance / documentação | 8 |

---

## Regras de execução (obrigatórias)

1. **Worktree isolado por etapa** — conforme `CLAUDE.md`:
   ```bash
   git worktree add ../MaxComponentsUi-wt-<slug> -b fix/<slug>
   ```
   Nunca execute agentes que modificam código no working tree principal. Valide no worktree, só então integre.

2. **Nenhum agente commita.** O agente entrega o diff validado; a decisão de commit/merge é do mantenedor. *(Durante esta auditoria um subagente commitou sem autorização no `dev` — commit `86c1e737`, revertido; ele havia deletado os 41 arquivos de `implementations/`.)*

3. **TDD obrigatório** — para cada achado: escrever o teste que reproduz a falha, **ver o teste falhar**, corrigir, ver passar. Achados de categoria `falta-de-teste` são bugs por definição do escopo desta auditoria.

4. **Verificação padrão ao fim de cada etapa:**
   ```bash
   npm run type-check && npm run lint && npm run test
   ```
   Nenhuma etapa "conclui" com regressão. Se componentes forem adicionados/removidos: `npx tsx src/scripts/generateResolver.ts`.

5. **Não sobrescrever** o [`execute_fixes.md`](../execute_fixes.md) da raiz — é de uma auditoria anterior (commit `ad023262`, referente aos 40 achados de [`implementations/`](../implementations/)) e está fora deste escopo.

6. **Paralelismo:** etapas com o mesmo número podem rodar em paralelo (worktrees distintos, arquivos disjuntos). Etapas numeradas em sequência têm dependência real.

---

# ETAPA 0 — Ação humana, fora do escopo de agentes

> **Bloqueia release. Não delegue a um agente.**

### 0.1 Revogar a chave da API do Google Maps 🔴
[`layout-maxmaps-api-key-hardcoded.md`](plans/layout-maxmaps-api-key-hardcoded.md)

A chave `AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY` está em [MaxMaps.vue:4](../src/components/MaxMaps.vue#L4). Verificado:

- presente no histórico do git desde o commit `7c44d240`;
- presente no bundle `dist/MaxMaps-Ds7gD1BI.js` **e** no `.map`;
- `package.json` declara `"files": ["dist"]` → **a chave é publicada no npm a cada release**.

**Remover do código não resolve.** É necessário:
1. Revogar/rotacionar a chave no Google Cloud Console;
2. Aplicar restrição de HTTP referrer na chave nova;
3. Só então executar a Etapa 1.4 (parametrização via `maxAppConfig`/prop).

### 0.2 Decidir qual sistema de migração é a fonte de verdade 🔴
[`docs-dois-sistemas-de-migracao-concorrentes.md`](plans/docs-dois-sistemas-de-migracao-concorrentes.md)

Existem **dois sistemas completos e contraditórios**, ambos se declarando fonte de verdade:

| Sistema | Localização | Status |
|---|---|---|
| A (documentado no CLAUDE.md) | `status-primevue.migration.yaml` + `migration_plans/` + `migration_executor.md` | 35 planos |
| B (não mencionado no CLAUDE.md) | [`prime_vue_migration/`](../prime_vue_migration/) — 38 itens, 4 arquivos de status, executor próprio | produziu `src/components/base/` |

Os 4 componentes de [`src/components/base/`](../src/components/base/) vieram do sistema B e **nenhum doc oficial os menciona**. O `status.yaml` do sistema B marca itens 1–5 como "Aguardando" enquanto seu próprio git log mostra o item 5 implementado.

**Risco concreto:** dois agentes lendo docs diferentes reescrevem os mesmos componentes com arquiteturas incompatíveis. Esta é a causa provável da confusão de processo observada durante a auditoria.

**Decisão necessária do mantenedor** antes de qualquer trabalho de migração. Nenhuma etapa deste plano depende dessa decisão — as correções abaixo são ortogonais à migração.

---

# ETAPA 1 — Segurança (paralelizável: 1.1 ‖ 1.2 ‖ 1.3 ‖ 1.4)

Worktree sugerido: `fix/seguranca`

### 1.1 XSS na diretiva `v-tooltip`
[`helpers-tooltip-escape-false-permite-xss.md`](plans/helpers-tooltip-escape-false-permite-xss.md) — **alta**
`escape: false` injeta HTML cru via `innerHTML` sem DOMPurify, que a lib já usa em `sanitizeSvg`.

### 1.2 XSS armazenado no editor markdown
[`inputs-selecao-markdown-link-javascript-uri.md`](plans/inputs-selecao-markdown-link-javascript-uri.md) — **alta**
`applyLink`/`applyImage` aceitam `javascript:`/`data:`; `Link.configure` sem `protocols`/`isAllowedUri`.

### 1.3 SVG remoto sem sanitização
[`layout-maxicon-vhtml-svg-sem-sanitizacao.md`](plans/layout-maxicon-vhtml-svg-sem-sanitizacao.md) — **alta**
[`inputs-selecao-fileuploadbutton-vhtml-label.md`](plans/inputs-selecao-fileuploadbutton-vhtml-label.md) — média
[`helpers-sanitize-svg-regex-falso-positivo.md`](plans/helpers-sanitize-svg-regex-falso-positivo.md) — média (a regex atual descarta ícones legítimos em silêncio)

### 1.4 Parametrizar a chave do Google Maps
**Depende da Etapa 0.1.** Substituir o literal por `maxAppConfig`/prop, com erro explícito se ausente.

### 1.5 CSS de depuração em produção
[`inputs-selecao-markdown-css-debug.md`](plans/inputs-selecao-markdown-css-debug.md) — **alta**
`border: red !important` e `outline: blue !important` enviados em produção no `MaxInputMarkdown`. Além disso, a classe do template é `max-input-mark-down` e o seletor é `.max-input-markdown` — ou seja, **nenhum estilo do editor é aplicado hoje**. Corrigir os dois: remover o CSS de depuração e alinhar a classe.

**Verificação da etapa:** testes com payload malicioso (`<script>`, `onerror=`, `javascript:`) para cada vetor; `npm run test`.

---

# ETAPA 2 — Bugs críticos de perda/corrupção de dados (paralelizável: 2.1 ‖ 2.2)

Worktree sugerido: `fix/perda-de-dados`

### 2.1 Máscara de latitude corrompe valor colado 🔴
[`inputs-texto-lat-mascara-corrompe-valor-colado.md`](plans/inputs-texto-lat-mascara-corrompe-valor-colado.md) — **crítica**
Colar `-23.550520` grava `-2.355052`. O token `[0-5-]` consome o sinal `-` como dígito porque a máscara só vira negativa após o watch. **O valor corrompido passa na validação de faixa** — nenhum aviso. Só o caminho "colar" é afetado.

### 2.2 `MaxTableFields` descarta edições 🔴
[`layout-maxtablefields-debounce-global-perde-edicoes.md`](plans/layout-maxtablefields-debounce-global-perde-edicoes.md) — **crítica**
`refAutoReset(false, 100)` é flag único para a tabela inteira: durante digitação normal, qualquer segunda alteração em < 100 ms tem `update:field` e `col.action` **descartados silenciosamente**, enquanto a linha é mutada. Estado interno diverge do que o consumidor recebe.

Correlatos do mesmo componente (mesmo worktree):
- [`layout-maxtablefields-key-por-index.md`](plans/layout-maxtablefields-key-por-index.md) — **alta**, corrompe inputs ao remover/reordenar linhas
- [`layout-falta-teste-maxtablefields-branches.md`](plans/layout-falta-teste-maxtablefields-branches.md) — os ramos descobertos são exatamente os que contêm os defeitos acima
- [`layout-maxtablefields-colspan-ignora-props-buttons.md`](plans/layout-maxtablefields-colspan-ignora-props-buttons.md), [`layout-maxtablefields-slot-default-vaza-metadados.md`](plans/layout-maxtablefields-slot-default-vaza-metadados.md)

**Verificação:** teste que cola coordenada negativa e assevera o valor emitido; teste que dispara duas edições em < 100 ms e assevera que **ambos** os `update:field` saem.

---

# ETAPA 3 — API pública quebrada (paralelizável: 3.1 ‖ 3.2 ‖ 3.3)

Worktree sugerido: `fix/api-publica`

Props e emits documentados que **não funcionam** — cada um é uma quebra de contrato com o consumidor.

### 3.1 Plugin e stores
- [`stores-install-options-spread-sobrescreve-tema.md`](plans/stores-install-options-spread-sobrescreve-tema.md) — **alta**: `...options` descarta o `preset: MaxStyle` quando o consumidor passa `options.theme`. O teste existente passa esse caso e assevera só `toHaveBeenCalled()`.
- [`stores-login-submit-sem-try-catch.md`](plans/stores-login-submit-sem-try-catch.md) — **alta**: sem `try/finally`, rejeição deixa `loading` travado em `true` na tela de login, sem erro nem toast.
- [`stores-user-waitrequest-watcher-nunca-liberado.md`](plans/stores-user-waitrequest-watcher-nunca-liberado.md), [`stores-icon-errors-por-icone-nunca-resetam.md`](plans/stores-icon-errors-por-icone-nunca-resetam.md), [`stores-icon-timer-e-endpoint-hardcoded.md`](plans/stores-icon-timer-e-endpoint-hardcoded.md), [`stores-loading-keys-target-cresce-indefinidamente.md`](plans/stores-loading-keys-target-cresce-indefinidamente.md), [`stores-toast-remaining-nao-reduz-em-pausas-sucessivas.md`](plans/stores-toast-remaining-nao-reduz-em-pausas-sucessivas.md)

### 3.2 Props/emits inertes nos inputs
- [`inputs-selecao-toggle-truevalue-falsevalue-ignorados.md`](plans/inputs-selecao-toggle-truevalue-falsevalue-ignorados.md) — **alta**
- [`inputs-selecao-fileuploadbutton-emit-upload-nunca-dispara.md`](plans/inputs-selecao-fileuploadbutton-emit-upload-nunca-dispara.md) — **alta**
- [`inputs-selecao-autocomplete-emit-nunca-limpa-valor.md`](plans/inputs-selecao-autocomplete-emit-nunca-limpa-valor.md) — **alta**: pai mantém valor que o usuário apagou
- [`inputs-selecao-fileproject-ondrop-vazio.md`](plans/inputs-selecao-fileproject-ondrop-vazio.md) — **alta**: UI promete "arraste e solte", handler é no-op
- [`inputs-texto-phonefield-unmaskedvalue-nao-exposto.md`](plans/inputs-texto-phonefield-unmaskedvalue-nao-exposto.md) — **alta**
- [`inputs-texto-search-nao-repassa-props-ao-inputbase.md`](plans/inputs-texto-search-nao-repassa-props-ao-inputbase.md), [`inputs-texto-lng-watch-modelvalue-nao-limpa.md`](plans/inputs-texto-lng-watch-modelvalue-nao-limpa.md) (quebra reset de formulário), [`inputs-texto-lng-erro-com-campo-vazio.md`](plans/inputs-texto-lng-erro-com-campo-vazio.md), [`inputs-texto-cartao-erro-nao-acompanha-done.md`](plans/inputs-texto-cartao-erro-nao-acompanha-done.md), [`inputs-texto-attrs-any-mensagem-erro-nao-tipada.md`](plans/inputs-texto-attrs-any-mensagem-erro-nao-tipada.md) (renderiza `"Valor esperado: undefined"` ao usuário)
- [`inputs-selecao-select-watch-default-duplicado.md`](plans/inputs-selecao-select-watch-default-duplicado.md), [`inputs-selecao-tagselect-hover-typeerror.md`](plans/inputs-selecao-tagselect-hover-typeerror.md), [`inputs-selecao-checkbox-radio-props-ignoradas.md`](plans/inputs-selecao-checkbox-radio-props-ignoradas.md), [`inputs-selecao-colorpicker-dois-inputs-mesmo-model.md`](plans/inputs-selecao-colorpicker-dois-inputs-mesmo-model.md), [`inputs-selecao-fileupload-sem-validacao-de-tamanho.md`](plans/inputs-selecao-fileupload-sem-validacao-de-tamanho.md), [`inputs-selecao-fileuploadbig-sem-validacao-de-arquivo.md`](plans/inputs-selecao-fileuploadbig-sem-validacao-de-arquivo.md) (**alta**)

### 3.3 Tabela e display
- [`layout-maxtable-coluna-buttons-duplicada-por-slot.md`](plans/layout-maxtable-coluna-buttons-duplicada-por-slot.md) — **alta**
- [`layout-maxloadericon-useattrs-sem-chamada.md`](plans/layout-maxloadericon-useattrs-sem-chamada.md) (`const attrs = useAttrs;` sem parênteses), [`layout-maxaiicon-seletor-svg-invalido.md`](plans/layout-maxaiicon-seletor-svg-invalido.md) (blocos `svg: {` que o Stylelint não acusa), [`layout-maxgrid-classe-trocada-com-maxgridcols.md`](plans/layout-maxgrid-classe-trocada-com-maxgridcols.md), [`layout-maxanimatefade-componente-sem-efeito.md`](plans/layout-maxanimatefade-componente-sem-efeito.md), [`layout-maxlink-route-indefinida-quebra-router.md`](plans/layout-maxlink-route-indefinida-quebra-router.md), [`layout-maxicon-props-iconcolor-e-colorhover-nao-usadas.md`](plans/layout-maxicon-props-iconcolor-e-colorhover-nao-usadas.md), [`layout-maxbadgecomponent-overlaybadge-sem-conteudo.md`](plans/layout-maxbadgecomponent-overlaybadge-sem-conteudo.md), [`layout-maxiconbutton-guard-executing-nunca-libera.md`](plans/layout-maxiconbutton-guard-executing-nunca-libera.md), [`layout-maxloadscreentarget-key-por-index.md`](plans/layout-maxloadscreentarget-key-por-index.md), [`layout-maxtable-ref-el-dentro-de-v-for.md`](plans/layout-maxtable-ref-el-dentro-de-v-for.md), [`layout-maxmaps-loop-de-watchers-e-any.md`](plans/layout-maxmaps-loop-de-watchers-e-any.md)

---

# ETAPA 4 — Vazamentos de memória e ciclo de vida

Worktree sugerido: `fix/ciclo-de-vida`

- [`helpers-tooltip-vazamento-de-nos-em-scroll-e-remocao.md`](plans/helpers-tooltip-vazamento-de-nos-em-scroll-e-remocao.md) — **alta**: nós órfãos no `body`; timer cria tooltip para elemento desconectado
- [`helpers-tooltip-updated-nao-reanexa-listeners.md`](plans/helpers-tooltip-updated-nao-reanexa-listeners.md)
- [`overlays-modal-nao-desmonta-nem-restaura-estado-global-no-unmount.md`](plans/overlays-modal-nao-desmonta-nem-restaura-estado-global-no-unmount.md) — **alta**: timers órfãos mutam a store global após unmount
- [`overlays-toast-timers-vazam-quando-store-nao-e-limpa.md`](plans/overlays-toast-timers-vazam-quando-store-nao-e-limpa.md)
- [`overlays-popover-teleport-desabilitado-deixa-wrapper-orfao-no-fluxo.md`](plans/overlays-popover-teleport-desabilitado-deixa-wrapper-orfao-no-fluxo.md)
- [`inputs-selecao-fileproject-objecturl-nao-revogado.md`](plans/inputs-selecao-fileproject-objecturl-nao-revogado.md)
- [`inputs-selecao-markdown-teste-mock-esconde-comportamento.md`](plans/inputs-selecao-markdown-teste-mock-esconde-comportamento.md) — **alta**: inclui o `destroy()` do TipTap sem teste

**Verificação:** montar/desmontar em loop e asseverar `document.body.children.length` estável e ausência de timers pendentes (`vi.getTimerCount()`).

---

# ETAPA 5 — Acessibilidade (18 achados)

Worktree sugerido: `fix/acessibilidade`

**Modelo a seguir:** `MaxDrawer` é o **único overlay correto** — usa `useFocusTrap` e `useScrollLock`, trata Escape, e sua suíte (42 casos) é a referência. `MaxModal`, `MaxPopover` e `MaxPopoverConfirm` não usam **nenhum** dos dois helpers.

### 5.1 Overlays
[`overlays-modal-sem-focus-trap-e-restauracao-de-foco.md`](plans/overlays-modal-sem-focus-trap-e-restauracao-de-foco.md) · [`overlays-modal-sem-role-dialog-e-aria-modal.md`](plans/overlays-modal-sem-role-dialog-e-aria-modal.md) · [`overlays-modal-sem-fechamento-por-escape.md`](plans/overlays-modal-sem-fechamento-por-escape.md) · [`overlays-modal-sem-scroll-lock.md`](plans/overlays-modal-sem-scroll-lock.md) · [`overlays-popover-sem-escape-focus-trap-e-aria.md`](plans/overlays-popover-sem-escape-focus-trap-e-aria.md) · [`overlays-popover-confirm-sem-teleport-escape-e-aria.md`](plans/overlays-popover-confirm-sem-teleport-escape-e-aria.md) · [`overlays-toast-sem-aria-live-e-sem-pausa-por-foco.md`](plans/overlays-toast-sem-aria-live-e-sem-pausa-por-foco.md) · [`layout-maxpdfview-nao-fecha-por-teclado-nem-trava-foco.md`](plans/layout-maxpdfview-nao-fecha-por-teclado-nem-trava-foco.md)

### 5.2 Controles inoperáveis por teclado
- [`layout-maxiconbutton-sem-semantica-de-botao.md`](plans/layout-maxiconbutton-sem-semantica-de-botao.md) — **alta**: `<div>` clicável sem role/tabindex → **toda ação de linha de tabela é inacessível por teclado**
- [`inputs-selecao-switch-sem-acessibilidade-teclado.md`](plans/inputs-selecao-switch-sem-acessibilidade-teclado.md) — **alta**
- [`overlays-user-section-raiz-clicavel-sem-semantica-de-botao.md`](plans/overlays-user-section-raiz-clicavel-sem-semantica-de-botao.md) — logout inalcançável por teclado
- [`overlays-side-menu-e-menu-vertical-item-sem-semantica-de-navegacao.md`](plans/overlays-side-menu-e-menu-vertical-item-sem-semantica-de-navegacao.md)

### 5.3 Rótulos e semântica
- [`inputs-texto-inputbase-label-sem-input-associado.md`](plans/inputs-texto-inputbase-label-sem-input-associado.md) — **alta**, transversal: o `inputId` do `InputBase` não é consumido por **nenhum** dos 13 inputs de texto. `<label for>` aponta para id inexistente, clicar no rótulo não foca, erro nunca é anunciado, `aria-invalid` fica num `<div>`. **Corrigir o `InputBase` primeiro**, depois propagar.
- [`layout-maxtablefields-semantica-de-tabela-destruida-por-css.md`](plans/layout-maxtablefields-semantica-de-tabela-destruida-por-css.md) — **alta**
- [`overlays-tab-usa-div-em-vez-de-button-como-role-tab.md`](plans/overlays-tab-usa-div-em-vez-de-button-como-role-tab.md) · [`overlays-tab-item-titulo-sem-semantica-de-tab.md`](plans/overlays-tab-item-titulo-sem-semantica-de-tab.md) · [`overlays-tab-list-teclas-nao-alcancam-o-handler-quando-foco-esta-no-tab.md`](plans/overlays-tab-list-teclas-nao-alcancam-o-handler-quando-foco-esta-no-tab.md) (bug real: `event.target` sem `data-tab-value` cai no tab *ativo*, não no focado) · [`layout-maxlogo-alt-generico.md`](plans/layout-maxlogo-alt-generico.md)

---

# ETAPA 6 — Overlays: posicionamento, z-index e colisões de ID

Worktree sugerido: `fix/overlays-runtime`

- [`overlays-modal-z-index-abaixo-do-popover-e-do-toast.md`](plans/overlays-modal-z-index-abaixo-do-popover-e-do-toast.md) — escala incoerente (modal 59, popover 99/9999, **confirm 3**): confirmação aberta de dentro de um modal fica **invisível e não clicável**
- [`overlays-popover-position-nao-recalcula-em-scroll.md`](plans/overlays-popover-position-nao-recalcula-em-scroll.md) — coordenadas congeladas: ao rolar, a confirmação aponta para outra linha
- [`overlays-popover-menu-e-user-section-id-dom-hardcoded.md`](plans/overlays-popover-menu-e-user-section-id-dom-hardcoded.md) — `id="overlay_menu"` duplicado em toda instância
- [`overlays-tab-item-teleport-por-id-global-colide-entre-instancias.md`](plans/overlays-tab-item-teleport-por-id-global-colide-entre-instancias.md)
- [`overlays-modal-e-popover-singleton-impede-overlays-simultaneos.md`](plans/overlays-modal-e-popover-singleton-impede-overlays-simultaneos.md)
- [`overlays-toggle-popover-envolve-maxpopover-sem-usar-o-overlay.md`](plans/overlays-toggle-popover-envolve-maxpopover-sem-usar-o-overlay.md)
- [`overlays-tabs-dois-sistemas-de-contexto-coexistindo.md`](plans/overlays-tabs-dois-sistemas-de-contexto-coexistindo.md) · [`overlays-accordion-e-tabs-registro-fora-de-ordem-do-dom.md`](plans/overlays-accordion-e-tabs-registro-fora-de-ordem-do-dom.md)
- [`overlays-top-menu-search-bar-sequestra-ctrl-f-globalmente.md`](plans/overlays-top-menu-search-bar-sequestra-ctrl-f-globalmente.md)
- [`overlays-tabs-cache-em-localstorage-compartilha-estado-entre-usuarios.md`](plans/overlays-tabs-cache-em-localstorage-compartilha-estado-entre-usuarios.md)
- Menores: [`overlays-popover-menu-guard-de-execucao-bloqueia-item-sem-acao.md`](plans/overlays-popover-menu-guard-de-execucao-bloqueia-item-sem-acao.md) · [`overlays-popover-menu-toggle-sem-guard-de-ref-nulo.md`](plans/overlays-popover-menu-toggle-sem-guard-de-ref-nulo.md) · [`overlays-modal-no-button-injeta-elemento-fixo-no-canto-da-tela.md`](plans/overlays-modal-no-button-injeta-elemento-fixo-no-canto-da-tela.md) · [`overlays-top-menu-reload-all-flag-inutil.md`](plans/overlays-top-menu-reload-all-flag-inutil.md)

---

# ETAPA 7 — Build, empacotamento e preset

Worktree sugerido: `fix/build`

### 7.1 Empacotamento (afeta consumidores)
- [`build-resolver-bundla-devdependency.md`](plans/build-resolver-bundla-devdependency.md) — **alta**: `@primevue/auto-import-resolver` é devDependency → não entra nos externals → **inlinado** em `dist/resolver.es.js` (26 KB, zero imports) e os tipos quebram no consumidor
- [`build-dependencias-deveriam-ser-peer.md`](plans/build-dependencias-deveriam-ser-peer.md) — **alta**: `pinia`, `primevue`, `@primeuix/themes` em `dependencies` → risco de instância dupla
- [`build-peer-vue-versao-divergente.md`](plans/build-peer-vue-versao-divergente.md) · [`build-dependencias-nao-utilizadas.md`](plans/build-dependencias-nao-utilizadas.md) · [`build-package-sem-campo-sideeffects.md`](plans/build-package-sem-campo-sideeffects.md) · [`build-cp-r-nao-portavel.md`](plans/build-cp-r-nao-portavel.md) · [`build-script-release-shell-posix.md`](plans/build-script-release-shell-posix.md) · [`build-npmrc-legacy-peer-deps.md`](plans/build-npmrc-legacy-peer-deps.md)

### 7.2 Preset UnoCSS
- [`build-preset-hover-primary-nao-gera-css.md`](plans/build-preset-hover-primary-nao-gera-css.md) — **alta**: `hover-primary-600`, **documentada no CLAUDE.md**, gera string vazia (a variante `hover-` do presetWind3 captura o token antes). `hover-red-500` funciona por acaso.
- [`build-preset-color-fallback-silencioso.md`](plans/build-preset-color-fallback-silencioso.md) · [`build-preset-opacity-valor-invalido.md`](plans/build-preset-opacity-valor-invalido.md) (`opacity-150` → `opacity:1.5`)

### 7.3 Tema e higiene do repositório
- [`build-tema-import-remoto-google-fonts.md`](plans/build-tema-import-remoto-google-fonts.md) · [`build-tema-estilos-globais-invasivos.md`](plans/build-tema-estilos-globais-invasivos.md) (`overflow:hidden` e `font-size:16px !important` globais)
- [`build-artefatos-versionados-indevidamente.md`](plans/build-artefatos-versionados-indevidamente.md) (`coverage/` versionado) · [`build-vitest-dirname-config-loader-nativo.md`](plans/build-vitest-dirname-config-loader-nativo.md)

---

# ETAPA 8 — Testes ausentes (29 achados)

Worktree sugerido: `fix/testes-ausentes`
Paralelizável por subdomínio (8.1 ‖ 8.2 ‖ 8.3 ‖ 8.4).

### 8.1 Helpers e composables sem teste algum
[`helpers-focus-trap-sem-teste.md`](plans/helpers-focus-trap-sem-teste.md) (**alta**) · [`helpers-scroll-lock-sem-teste-estado-global.md`](plans/helpers-scroll-lock-sem-teste-estado-global.md) (**alta** — estado de módulo sem reset exportado torna o teste isolado impossível: é bug de design, corrigir junto) · [`helpers-svg-to-data-uri-sem-teste.md`](plans/helpers-svg-to-data-uri-sem-teste.md) · [`helpers-accordion-context-sem-teste.md`](plans/helpers-accordion-context-sem-teste.md) · [`helpers-tabs-context-sem-teste.md`](plans/helpers-tabs-context-sem-teste.md) · [`helpers-locale-pt-br-sem-teste-e-sem-tipo.md`](plans/helpers-locale-pt-br-sem-teste-e-sem-tipo.md) · [`helpers-generate-resolver-sem-teste-e-regex-fragil.md`](plans/helpers-generate-resolver-sem-teste-e-regex-fragil.md)

### 8.2 Stores sem teste
[`stores-searchbar-sem-teste.md`](plans/stores-searchbar-sem-teste.md) (explica 0% de branches) · [`stores-toptoolbar-sem-teste.md`](plans/stores-toptoolbar-sem-teste.md) · [`stores-listmenus-sem-teste.md`](plans/stores-listmenus-sem-teste.md) · [`stores-confirm-actions-sem-teste.md`](plans/stores-confirm-actions-sem-teste.md)

### 8.3 Componentes
- [`overlays-falta-de-teste-user-avatar-fluxo-de-remocao.md`](plans/overlays-falta-de-teste-user-avatar-fluxo-de-remocao.md) — 🔴 **crítica**: `onAvatarClick` com 0% de funções; **fluxo de remoção destrutiva sem nenhum teste**, e escreve campo a campo no `useConfirmStore` em vez de usar `confirm()`
- [`overlays-falta-de-teste-ciclo-de-vida-e-teclado-dos-overlays.md`](plans/overlays-falta-de-teste-ciclo-de-vida-e-teclado-dos-overlays.md) (**alta**) · [`overlays-falta-de-teste-top-toolbar-handle-item-click.md`](plans/overlays-falta-de-teste-top-toolbar-handle-item-click.md) (**alta**) · [`overlays-falta-de-teste-menu-vertical-item.md`](plans/overlays-falta-de-teste-menu-vertical-item.md) (sem teste algum) · [`overlays-falta-de-teste-tab-panels-e-accordion-panel-validacao-de-contexto.md`](plans/overlays-falta-de-teste-tab-panels-e-accordion-panel-validacao-de-contexto.md)
- [`inputs-selecao-iconpicker-falta-teste-fetch-e-scroll.md`](plans/inputs-selecao-iconpicker-falta-teste-fetch-e-scroll.md) (**alta**, um único teste hoje) · [`inputs-selecao-toolbar-falta-teste-popovers-e-comandos.md`](plans/inputs-selecao-toolbar-falta-teste-popovers-e-comandos.md) (11 de 17 comandos com spy pronto e **zero asserções**) · [`inputs-selecao-listbox-falta-teste-teclado-e-virtual.md`](plans/inputs-selecao-listbox-falta-teste-teclado-e-virtual.md)
- [`layout-falta-teste-maxcontainerapp.md`](plans/layout-falta-teste-maxcontainerapp.md) (único do domínio sem teste dedicado) · [`layout-falta-teste-componentes-de-icone-estatico.md`](plans/layout-falta-teste-componentes-de-icone-estatico.md)

### 8.4 Validação de domínio
- [`inputs-texto-falta-teste-cpf-cnpj-digito-verificador.md`](plans/inputs-texto-falta-teste-cpf-cnpj-digito-verificador.md) — **o DV nunca é exercitado**: os casos "inválidos" são reprovados antes, por tamanho ou dígitos repetidos. **Trocar a validação por uma checagem de tamanho manteria a suíte verde.** (Os algoritmos em `../MaxUse` foram conferidos e estão corretos — o problema é só de cobertura.)
- [`inputs-texto-falta-teste-phonefield-formato-internacional.md`](plans/inputs-texto-falta-teste-phonefield-formato-internacional.md) · [`inputs-texto-falta-teste-limites-coordenadas.md`](plans/inputs-texto-falta-teste-limites-coordenadas.md) (a assimetria `< -33.8` Lat vs `<= -74` Lng segue indefinida)

---

# ETAPA 9 — Qualidade dos testes existentes

Worktree sugerido: `fix/qualidade-testes`

> **Por que importa:** os testes abaixo passam sem verificar comportamento. São eles que permitiram os bugs críticos das Etapas 2 e 3 coexistirem com uma suíte 100% verde.

- [`testes-maxtable-stub-total-nao-testa-nada.md`](plans/testes-maxtable-stub-total-nao-testa-nada.md) — stuba `DataTable`/`Column` e assevera `.p-datatable`, classe escrita **no próprio stub**: 4 de 5 casos passariam com o componente vazio
- [`layout-falta-teste-maxtable-multiplos-slots.md`](plans/layout-falta-teste-maxtable-multiplos-slots.md) — **alta**: o stub simplista mascara o bug da coluna duplicada (Etapa 3.3)
- [`testes-smoke-tautologicos-sem-comportamento.md`](plans/testes-smoke-tautologicos-sem-comportamento.md) — 254 `exists()).toBe(true)`; `MaxWaitIcon` valida a **classe errada** (`.icon-done-max`); *"usa grid com 24 colunas"* nunca checa colunas
- [`testes-uso-de-any-e-acesso-a-internals-via-vm.md`](plans/testes-uso-de-any-e-acesso-a-internals-via-vm.md) — `MaxButton` invoca `onClick()` direto: remover o `@click` do template **não falharia**
- [`testes-icon-store-tres-arquivos-sobrepostos.md`](plans/testes-icon-store-tres-arquivos-sobrepostos.md) — 3 suítes para o mesmo store, dois `describe('useIconStore')` idênticos (`cache-sanitize` é legítimo, manter)
- [`testes-ausencia-de-cenarios-de-erro-assincrono.md`](plans/testes-ausencia-de-cenarios-de-erro-assincrono.md)
- [`build-setup-getcomputedstyle-mock-incompleto.md`](plans/build-setup-getcomputedstyle-mock-incompleto.md) — **alta**: o mock substitui a implementação do happy-dom por objeto de 4 chaves; `position`, `width`, `length`, `item` retornam `undefined`
- [`build-setup-pinia-compartilhado-entre-testes.md`](plans/build-setup-pinia-compartilhado-entre-testes.md) — vazamento **intra-arquivo** (verificado: não atravessa arquivos)
- [`build-vitest-sem-thresholds-de-cobertura.md`](plans/build-vitest-sem-thresholds-de-cobertura.md) · [`build-tsconfig-nao-checa-tests-nem-configs.md`](plans/build-tsconfig-nao-checa-tests-nem-configs.md)

**Critério de saída da etapa:** para cada teste corrigido, provar que ele **falha** quando o comportamento é removido (mutação manual), antes de reintegrar.

---

# ETAPA 10 — Tipagem (`any`)

Worktree sugerido: `fix/tipagem`

181 ocorrências de `any` em `src/`, contra a regra no-any do projeto:
[`helpers-tipos-any-espalhados-na-api-publica.md`](plans/helpers-tipos-any-espalhados-na-api-publica.md) · [`stores-tipos-any-generalizados.md`](plans/stores-tipos-any-generalizados.md) (os `as any` apagam a checagem de `status.server.get.is_success`, **flag que governa todo o branching de autenticação**) · [`overlays-tipos-any-em-componentes-de-navegacao.md`](plans/overlays-tipos-any-em-componentes-de-navegacao.md) · [`inputs-selecao-select-tipos-any-generalizado.md`](plans/inputs-selecao-select-tipos-any-generalizado.md) · [`layout-maxsplitpanescontent-store-tipada-como-any.md`](plans/layout-maxsplitpanescontent-store-tipada-como-any.md) · [`layout-maxloader-attrs-any-e-show-como-atributo.md`](plans/layout-maxloader-attrs-any-e-show-como-atributo.md)

Correlatos: [`helpers-use-mirrored-model-watch-raso.md`](plans/helpers-use-mirrored-model-watch-raso.md) · [`helpers-use-virtual-list-divisao-por-zero.md`](plans/helpers-use-virtual-list-divisao-por-zero.md) · [`helpers-colisao-de-nome-max-table-column.md`](plans/helpers-colisao-de-nome-max-table-column.md) · [`helpers-use-input-validation-on-blur-vazio.md`](plans/helpers-use-input-validation-on-blur-vazio.md) · [`helpers-gap-nao-trata-col-column.md`](plans/helpers-gap-nao-trata-col-column.md) (**alta**) · [`helpers-padding-margin-colisao-de-letras.md`](plans/helpers-padding-margin-colisao-de-letras.md) · [`helpers-set-cached-sem-try-catch-quota.md`](plans/helpers-set-cached-sem-try-catch-quota.md) · [`helpers-ddi-flags-dados-inconsistentes.md`](plans/helpers-ddi-flags-dados-inconsistentes.md) · demais `helpers-*` de severidade baixa

---

# ETAPA 11 — Documentação

Worktree sugerido: `fix/docs`
**Executar por último** — reflete o estado final do código após as etapas anteriores.

- [`docs-readme-setup-omite-maxuse-e-conta-errada.md`](plans/docs-readme-setup-omite-maxuse-e-conta-errada.md) — **alta**: `npm install` do README **falha em clone limpo** (omite `../MaxUse` e `../MaxPinia`); declara 59 componentes contra 101 reais
- [`docs-components-md-43-componentes-nao-documentados.md`](plans/docs-components-md-43-componentes-nao-documentados.md) — **alta**: 58 de 101 documentados; faltam as famílias inteiras de abas e accordion
- [`docs-stores-md-subpath-inexistente-e-chave-de-cache-errada.md`](plans/docs-stores-md-subpath-inexistente-e-chave-de-cache-errada.md) — **alta**: exemplos importam de `/stores`, subpath ausente do `exports` → `ERR_PACKAGE_PATH_NOT_EXPORTED`
- [`stores-claudemd-cinco-stores-divergencia.md`](plans/stores-claudemd-cinco-stores-divergencia.md) — CLAUDE.md documenta 5 stores; o barrel exporta 12 **corretamente** (divergência só de documentação)
- [`docs-claude-md-contagem-de-planos-e-fila-divergentes.md`](plans/docs-claude-md-contagem-de-planos-e-fila-divergentes.md) · [`docs-executor-protocolo-violado-execucao-fora-de-ordem.md`](plans/docs-executor-protocolo-violado-execucao-fora-de-ordem.md) · [`docs-arquivos-de-trabalho-temporarios-versionados-na-raiz.md`](plans/docs-arquivos-de-trabalho-temporarios-versionados-na-raiz.md)

---

# ETAPA 12 — Achados menores (média/baixa) e higiene de código

Worktree sugerido: `fix/menores`
**Sem dependências.** Pode rodar em paralelo com qualquer etapa, ou ser absorvida pelas etapas de mesmo domínio se o executor preferir agrupar por arquivo.

### 12.1 Inputs de seleção
[`inputs-selecao-autocomplete-busca-nao-normaliza-caixa.md`](plans/inputs-selecao-autocomplete-busca-nao-normaliza-caixa.md) · [`inputs-selecao-fileproject-fileicon-precedencia.md`](plans/inputs-selecao-fileproject-fileicon-precedencia.md) (precedência de operadores) · [`inputs-selecao-iconpicker-viola-inputbase-drawer-fora.md`](plans/inputs-selecao-iconpicker-viola-inputbase-drawer-fora.md) (**único componente que viola a regra do `InputBase` sem exceção documentada** — decidir: corrigir ou documentar) · [`inputs-selecao-inputfile-componente-vazio-exportado.md`](plans/inputs-selecao-inputfile-componente-vazio-exportado.md) · [`inputs-selecao-tagslist-vfor-sem-key.md`](plans/inputs-selecao-tagslist-vfor-sem-key.md) · [`inputs-selecao-datepicker-props-de-select-irrelevantes.md`](plans/inputs-selecao-datepicker-props-de-select-irrelevantes.md) · [`inputs-selecao-iconpicker-emits-duplicado-definemodel.md`](plans/inputs-selecao-iconpicker-emits-duplicado-definemodel.md)

### 12.2 Tabela e display
[`layout-maxtablecolumn-componente-vazio-e-css-duplicado.md`](plans/layout-maxtablecolumn-componente-vazio-e-css-duplicado.md) — **relevante para a migração**: `MaxTableColumn.vue` não renderiza nada e seu único efeito é um `<style>` global que **redeclara `.max-table-main-div` divergindo de `MaxTable.vue`** em seis propriedades; qual vence depende da ordem de bundling · [`layout-maxtablefields-prop-buttonswidth-nao-usada.md`](plans/layout-maxtablefields-prop-buttonswidth-nao-usada.md) · [`layout-maxtablefields-tableid-ulid-instavel.md`](plans/layout-maxtablefields-tableid-ulid-instavel.md) · [`layout-maxtitle1-usa-a-classe-max-title-2.md`](plans/layout-maxtitle1-usa-a-classe-max-title-2.md) · [`layout-maxmsglabels-props-nao-usadas-e-lang-hardcoded.md`](plans/layout-maxmsglabels-props-nao-usadas-e-lang-hardcoded.md) · [`layout-maxicon-darken-com-valor-fora-de-faixa.md`](plans/layout-maxicon-darken-com-valor-fora-de-faixa.md)

### 12.3 Overlays e convenções de SFC
[`overlays-user-section-e-avatar-jsdoc-fora-de-bloco-sfc.md`](plans/overlays-user-section-e-avatar-jsdoc-fora-de-bloco-sfc.md) · [`overlays-tab-panel-caractere-invalido-no-fim-do-arquivo.md`](plans/overlays-tab-panel-caractere-invalido-no-fim-do-arquivo.md) (`\` solto após `</style>`) · [`overlays-user-avatar-default-de-prop-inexistente-route.md`](plans/overlays-user-avatar-default-de-prop-inexistente-route.md)

### 12.4 Helpers de severidade baixa
[`helpers-get-cached-assincrono-sem-necessidade.md`](plans/helpers-get-cached-assincrono-sem-necessidade.md) · [`helpers-get-css-size-regex-aceita-valores-invalidos.md`](plans/helpers-get-css-size-regex-aceita-valores-invalidos.md) · [`helpers-max-app-config-merge-raso-e-sem-validacao.md`](plans/helpers-max-app-config-merge-raso-e-sem-validacao.md) · [`helpers-resolver-nao-diferencia-maiusculas-e-loop-desnecessario.md`](plans/helpers-resolver-nao-diferencia-maiusculas-e-loop-desnecessario.md) (o loop redundante atrela `resolver.es.js` ao PrimeVue, **contra o objetivo de independência**) · [`helpers-select-group-options-element-com-ponto-e-virgula-espurio.md`](plans/helpers-select-group-options-element-com-ponto-e-virgula-espurio.md) · [`helpers-toast-sem-tratamento-de-pinia-ausente.md`](plans/helpers-toast-sem-tratamento-de-pinia-ausente.md) · [`helpers-tooltip-aria-describedby-sobrescrito.md`](plans/helpers-tooltip-aria-describedby-sobrescrito.md) · [`helpers-use-virtual-list-options-exige-ref.md`](plans/helpers-use-virtual-list-options-exige-ref.md)

---

## Roteiro sugerido de paralelização

```
Etapa 0  ── AÇÃO HUMANA (revogar chave; decidir sistema de migração)
             │
   ┌─────────┼─────────┬─────────┬─────────┐
Etapa 1   Etapa 2   Etapa 3   Etapa 4   Etapa 7      (4 worktrees em paralelo)
(segurança)(dados)  (API)   (memória)  (build)
   └─────────┴─────────┴─────────┴─────────┘
             │
        Etapa 8 + 9  (testes ausentes + qualidade) ── depende das correções acima
             │
   ┌─────────┴─────────┐
Etapa 5           Etapa 6                             (2 worktrees em paralelo)
(a11y)          (overlays runtime)
   └─────────┬─────────┘
        Etapa 10 (tipagem)
             │
        Etapa 11 (docs)
```

**Ordem inegociável:** Etapa 0 antes de tudo; Etapas 8/9 depois das correções de comportamento (senão os testes são escritos contra código errado); Etapa 11 por último.

## Modelo de prompt para o agente executor

```
Você trabalha no worktree ../MaxComponentsUi-wt-<slug> (branch fix/<slug>).
Execute EXCLUSIVAMENTE os achados listados na Etapa <N> de bugs_to_fix/execute_fixes.md.

Para cada achado, nesta ordem:
1. Leia o plano em bugs_to_fix/plans/<arquivo>.md
2. Escreva o teste que reproduz a falha e RODE-O — ele DEVE falhar. Cole a saída.
3. Aplique a correção descrita no plano.
4. Rode o teste de novo — deve passar. Cole a saída.

Ao final da etapa: npm run type-check && npm run lint && npm run test

REGRAS:
- NÃO commite. NÃO faça merge. NÃO altere arquivos fora do escopo da etapa.
- NÃO altere planos de outras etapas nem os arquivos de controle da migração.
- Se um achado não se confirmar ao ler o código, NÃO invente correção:
  relate como "não reproduzido" com a evidência e siga para o próximo.

RETORNE: por achado — status (corrigido / não reproduzido / bloqueado),
o diff resumido, e a saída do teste antes e depois.
```

## Observações de método desta auditoria

- Os agentes **descartaram achados** que não se confirmaram (`MaxDrawer` pareia lock/unlock corretamente; siglas de `ddiFlags` são únicas; `quill` aparece só como nome de icon set Iconify, não como editor) e **se autocorrigiram** (o `<LoaderIcon />` sem import é alias do resolver, reclassificado de "quebra em runtime" para "fragilidade de acoplamento"). Achados marcados como verificados por execução são mais confiáveis que os inferidos por leitura.
- Três premissas do briefing inicial foram **refutadas com evidência** e os planos registram o dado correto: o `allow-git=false` vem do `~/.npmrc` do usuário (o do projeto tem `legacy-peer-deps=true`); `src/presetMaxUno.ts` não tinha mudança pendente; o vazamento do Pinia é intra-arquivo, não entre arquivos.
- `grep -rn "\.skip\|\.only" tests/` retornou **zero** — nada esquecido.
- O `components-manifest.json` está **100% sincronizado** (101 componentes, 101 `.vue`, 590 aliases válidos) e `src/index.ts` exporta todos os 101 — nenhum achado nessas frentes.
- A amostragem de 9 planos de `migration_plans/` mostrou **boa qualidade**: todos referenciam arquivos existentes e batem com o código. O problema da migração é de processo (Etapa 0.2), não de conteúdo dos planos.
