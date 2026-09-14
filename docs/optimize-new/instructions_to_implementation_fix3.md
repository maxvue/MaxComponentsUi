# Prompt de correção — terceira verificação da implementação

## Resultado da auditoria

A execução de `docs/optimize-new/instructions_to_implementation_fix2.md` **não foi concluída**. A revisão independente foi realizada sobre o estado publicado em `origin/dev`, commit `9c950649`, por subagentes com ownership disjunto, testes focais e gates globais em worktree isolada.

- Plano inicial: **72 achados**.
- Integralmente atendidos agora: **40/72 (55,6%)**.
- Ainda sem aceite integral: **32/72 (44,4%)**.
- Dos 32 blocos acompanhados pelo `fix2`, 7 estão aceitos e 25 continuam abertos.
- Achados anteriormente aceitos e preservados/restaurados: **F03, F12 e F17**.
- Achados anteriormente aceitos que precisam ser reabertos: **F07, F14, F15 e F18**.
- Blocos corretivos fechados nesta rodada: **R05/F06, R06/F08, R10/F13 e R20/F26**.
- Preserve também os demais achados do plano inicial que não aparecem neste prompt; não enfraqueça seus testes.

Não declare conclusão por existir código nominal ou porque um gate incompleto retorna zero. Cada item abaixo só fecha quando todos os comportamentos e critérios de aceite correspondentes forem demonstrados.

## Gates observados no HEAD auditado

| Gate | Resultado |
|---|---|
| `git diff --check` no checkout atual | passou |
| `check:filenames`, `check:lockfile`, type-checks e lint | passaram |
| `npm run test`, duas vezes | 3.253/3.253 passaram, mas as execuções independentes emitiram erros assíncronos inesperados `EPROTO`/`AbortError` |
| `test:coverage` | 86,26/77,21/87,03/89,60; passou os thresholds, mas também emitiu erro assíncrono inesperado |
| `build` | passou; `index.es.js` 761,39 kB, gzip 164,74 kB, Brotli 127,47 kB |
| `npm ls --all` | **falhou (`ELSPROBLEMS`)**: Vue 3.6 RC incompatível e `oxc-parser` ausente |
| `npm audit --audit-level=low` | **falhou**: 1 vulnerabilidade baixa e 1 moderada na cadeia Monaco/DOMPurify |
| `test:browser` | 7/7 passaram, mas existem somente dois specs: `MaxTableFields` e `MaxToast` |
| consumidor do tarball | dois smokes Node ESM passaram; não cobre TS, Vite, SSR ou componentes granulares |

## Regras obrigatórias de execução

1. Trabalhe em worktree isolada e distribua estes blocos entre subagentes com ownership de arquivos disjunto.
2. Leia o `description.md` e o `plan.md` originais de cada achado antes de editar.
3. Produza ou fortaleça o teste comportamental antes da correção. Não aceite inspeção textual, valores hardcoded, casts abrangentes, monkeypatch global ou teste tautológico como evidência.
4. CSS computado, teclado nativo, foco, layout, zoom e hit-testing devem ser validados em Chromium real.
5. Nenhum gate pode ser tornado verde removendo cenário, reduzindo asserção, suprimindo warning ou excluindo arquivo da cobertura.
6. Corrija a causa raiz. Se um problema reaparecer em vários componentes, consolide o contrato canônico em vez de aplicar patches locais.

## Etapa 1 — restaurar contratos reabertos (P0)

### F07 / E04-02 — outside-pointer ainda tem motores paralelos

`MaxTagSelect.vue:739-744,772-773` e `MaxInputAutoCompleteApi.vue:510-527` mantêm listeners próprios. `useOutsidePointer.ts:134-177` instala até quatro listeners por instância, incluindo `keydown` em `window` e `document`, sem ownership global.

Faça `useOutsidePointer` ser a fonte canônica para todos os consumidores, com stack/owner único, clique-through, Escape, retorno de foco, âncora desconectada, resize/zoom e cleanup. Teste contagem zero de listeners após fechar/unmount e comportamento em browser sem flicker.

### F14 / E06-01, E06-02 — modo listbox genérico sem invariantes

Os autocompletes voltaram a separar seleção de foco corretamente, mas `MaxBaseVirtualScroller.vue:53-91` aceita `role="listbox"` e `itemRole="option"` como strings independentes, sem exigir nome, teclado, foco e seleção.

Modele um contrato listbox completo e tipado ou remova o modo genérico. Todo `aria-activedescendant` deve apontar para item montado. Cubra teclado, seleção, virtualização, axe e browser/leitor.

### F15 / E06-03, E08-04 — botão interno do TagSelect segue habilitado e sem nome específico

No modo `isButton`, `MaxTagSelect.vue:53-55` não propaga `disabled` nem nome acessível ao `MaxIconButton`. O wrapper recebe `aria-disabled`, mas o owner focável interno permanece acionável e usa o fallback genérico `Botão de ação`.

Propague estado e nome contextual ao botão nativo, inventarie todos os icon-buttons e elimine labels genéricos. Teste o elemento real, sem stub que injete `ariaLabel`, para Tab, Enter, Espaço, disabled e emissão única.

### F18 / E07-06 — crop ainda possui fallback base64 e não tem aceite real de performance

`MaxImage.vue:585-600` usa `canvas.toDataURL` quando `toBlob` não existe, mesmo com `includeDataUrl=false`. A tipagem ainda admite `blob/file` nulos e o aceite de 48 MP está restrito a mocks/cálculo puro.

Mantenha Blob/File como payload canônico não nulo; data URL deve ser estritamente opt-in. Falha de `toBlob` deve manter o editor aberto, mostrar erro recuperável e emitir zero eventos. Valide em browser/canvas real, incluindo 48 MP, Long Tasks, heap e orçamento de congelamento.

## Etapa 2 — reprodutibilidade e gates (P0)

### R01 / F01 / E01-02, E01-03, E01-05 — lock e árvore de dependências parciais

O pacote usa `@maxvue/max-use` publicado, removeu aliases locais e ganhou `engines`/`packageManager`. Porém `scripts/check-lockfile.mjs:62-99` compara apenas dependencies/devDependencies; `npm ls --all` falha com Vue `3.6.0-rc.7` incompatível e `oxc-parser >=0.98.0` ausente. O consumidor não integra `verify`.

Valide também `peerDependencies`, `peerDependenciesMeta` e optionalDependencies, ausência de qualquer caminho/link e consistência bidirecional. Corrija a árvore sem flags que escondam conflitos. Faça dois `npm ci` em checkouts sem irmãos, `npm ls --all`, audit e consumidor do `.tgz` com/sem peers. Integre tudo ao CI/`verify`.

### R02 / F02 / E01-04, E12-02 — warnings assíncronos não bloqueiam a suíte

O monkeypatch de botão e o `DEBUG` foram removidos, mas `tests/setup.ts:176-211` desativa a captura sempre que existe qualquer spy. Duas execuções completas imprimiram `EPROTO` e ainda retornaram sucesso.

Faça warning/error inesperado falhar, exija consumo/assert explícito dos esperados e elimine a origem do erro TLS/abort tardio. Execute suíte duas vezes sem stdout/stderr inesperado, cobertura, browser e `verify` completos.

## Etapa 3 — anatomia e atributos (P1)

### R03 / F04 / E03-01 — `.max-*` ainda não é a anatomia canônica completa

O guard passou a controlar cardinalidade, mas `MaxTable.vue:3-5,74-75,94-95,859-931` continua usando `.p-*` em nós centrais e CSS canônico. O catálogo só exige classes Max superficiais.

Defina classes `.max-table-*` para toda a anatomia e deixe `.p-*` apenas como alias público documentado. O guard deve controlar arquivo, bloco/local/contexto e cardinalidade; duplicar ou mover ocorrência allowlisted deve falhar.

### R04 / F05 / E03-02 — matriz de atributos do InputBase incompleta

A classificação semântica foi criada, mas o teste arquitetural ainda espera 24 consumidores e o comportamental cobre somente parte das 25 famílias. Faltam combinações como autofill e matriz completa de required/disabled.

Cubra todas as 25 famílias com owner focável real, label click, form submit, autofill, required e disabled. Nenhum atributo form/ARIA pode permanecer no wrapper; class/style/data continuam no root.

## Etapa 4 — modais, nomes e camadas (P1)

### R07 / F09 / E04-04 — ownership de foco/Escape não está centralizado

Os unitários cobrem Tab/Shift+Tab e cadeia de foco, mas `MaxInputIconPicker.vue:447-497` e `MaxInputMarkdown.vue:145-180` ainda mantêm listeners Escape locais. Não há teste browser de modal/stack.

Centralize trap/Escape no topo do stack. Valide em browser os componentes reais, A→B→A→gatilho, nested stack, unmount e retorno de ownership à camada inferior.

### R08 / F10 / E04-05 — accessible name usa heurística incompleta

Modal/Popover verificam apenas `hidden`, `aria-hidden` do próprio nó e style inline; não resolvem CSS computado, ancestral `aria-hidden`/`inert` nem múltiplos IDREFs. Os testes duplicam um algoritmo simplificado.

Garanta nome estável por construção e use cálculo real (`getByRole`, axe e browser) para slot/header vazio, CSS hidden, ancestral oculto/inert, múltiplos IDs, ID órfão e referência externa.

### R09 / F11 / E04-06, E04-07 — camada/clamp sem aceite visual completo

O clamp básico existe, mas usa viewport/margem fixa, sem safe-area/visualViewport. `MaxPageMobileLayout.vue:193` conserva z-index literal. Não há hit-test de composição.

Migre z-index global para tokens e teste CSS computado + `elementFromPoint` em 280/320 px, landscape, zoom 200%, safe-area, seta, scroll, conteúdo longo e override de tokens.

## Etapa 5 — seleção, arquivos e tabela (P1)

### R11 / F16 / E06-05, E06-06 — contraste/virtualização sem prova browser

Preserve os testes de mais de 500 itens, scroll e active descendant do TagSelect. Substitua o parser próprio de SCSS por CSS computado dos estados default/hover/focus em light/dark. Cubra first paint, scroll e seleção no navegador real.

### R12 / F19 / E07-04, E07-05 — ações nativas e alternativas gráficas regredidas

`MaxInputFile.vue:2-16` mantém `role=region` focável com keydown manual. Chart e Maps deixam alternativas sempre `sr-only`, sem revelação ao foco.

Use botão/label nativo associado ao input e torne painéis/toggles gráficos perceptíveis ao foco. Teste Enter/Espaço, disabled, foco visível, emissão única e múltiplos arquivos em browser.

### R13 / F20 / E08-05 — tabela sem escopo/nome e sem teclado browser

O botão de ordenação é nativo e o unitário usa click, mas `MaxTable.vue:55-67` não possui `scope="col"`; header-slot vazio pode deixar o controle sem nome.

Restaure semântica/nome e valide Enter/Espaço reais, exigindo exatamente uma ordenação/emissão por tecla.

## Etapa 6 — feedback, loading e identidade (P1/P2)

### R14 / F21 / E09-01 — live region duplicada e submit nativo quebrado

IDs únicos e owner inicial do Toast melhoraram, mas `MaxToast.vue:13,64-80` cria regiões live aninhadas após mudança da mensagem. `MaxButton.vue:2-8` força `type="button"`, impedindo submit nativo no AuthCard.

Mantenha exatamente um owner live por mensagem e respeite o `resolvedType` do botão. Teste duas instâncias, atualização da mensagem, um anúncio por evento, Enter/autofill e submissão nativa.

### R15 / F22 / E09-02 — mesma chave lógica em targets diferentes deixa loading preso

`useLoading.Store.ts:95-103,134-161` usa mapa 1:1 e sobrescreve a chave ao iniciar A/B. Foi reproduzido que `end(chave)` remove B e deixa A em loading.

Use identidade composta, multimap ou handle público. Teste mesma chave em A/B, retry/end independente, concorrência, unmount/dispose e zero timers/pending.

### R16 / F23 / E10-03, E10-04 — contraste e foco continuam amostrais

Persistem cerca de 66 usos de `--background-650` em 39 arquivos. O gate de foco usa lista fixa e aceita mera menção a `:focus`; o teste de texto usa fundos hex hardcoded.

Classifique todas as ocorrências e alvos focáveis, migre conteúdo habilitado para tokens semânticos e documente exceções. Valide contraste/foco computado em light/dark/high-contrast, zoom 200% e navegação Tab.

### R17 / F23A / E10-02 — teste de contraste continua hardcoded

Preserve os tokens WhatsApp corrigidos, mas substitua a matriz de pares e o falso mutation test por CSS compilado/computado para todas as severidades/estados. Uma mutação real do token deve quebrar o mesmo teste.

## Etapa 7 — motion, playground e distribuição (P1/P2)

### R18 / F24 / E10-09 — reduced motion parcial

Foram encontrados 59 SFCs com motion; 38 não possuem regra explícita. O inventário só exige tratamento para componentes com `@keyframes`.

Classifique transitions, animations e exceções; migre todos os casos aplicáveis. Emule `reduce` e `no-preference` no browser e meça transform, duração, iteração e lifecycle.

### R19 / F25 / E10-10 — cenários do playground são placeholders

Existem 36 loaders, mas os 36 arquivos renderizam apenas `ScenarioCard` genérico, sem componentes Max reais; `App.vue` não usa `SCENARIO_LOADERS`.

Faça catálogo→arquivo→loader→mount representar componentes e estados reais. Smoke deve carregar todos os cenários, falhar em warnings, aplicar budget de chunks e validar light/dark em 320 px e desktop.

### R21 / F27 / E11-03 — pipeline SVG não é reproduzível

Há `svgo.config.mjs` e medição Brotli unitária, mas `svgo` não está instalado nem existe script/CI. Falta integrar o budget Brotli ao pipeline com baseline, além de inspeção de scripts/handlers/URLs externas, regressão visual e prova de tree-shaking por bandeira.

Crie pipeline SVGO reproduzível, budgets bruto/gzip/Brotli e gate CI. Valide tarball e demonstre que importar Visa não baixa as demais bandeiras.

### R22 / F28 / E11-01 — benchmark e alinhamento são tautológicos

`LINE_HEIGHT` foi centralizado, mas `MaxInputTextList.test.ts:320` compara `i * 21` com o mesmo cálculo, sem DOM. O teste nominal de 100/1k/10k mede apenas cardinalidade/spacer, não tempo, memória ou layout real.

Meça CSS/DOM real em browser a 100%/200%, início/meio/fim de 10 mil linhas, erro <=1 px. Adicione benchmark informativo de mount/input/scroll/memória e preserve cursor, teclado e resize.

### R23 / F28A / E11-02 — medição temporal inútil continua na suíte comum

O teto `<1500ms` saiu, mas `MaxInputTextArea.performance.test.ts:58-80` ainda mede wall clock e apenas exige duração `>=0`.

Retire wall clock da suíte determinística; preserve cardinalidade, coalescência e cleanup. Mova tempo para benchmark separado, informativo e com artefato comparável.

### R24 / F29 / E11-04 — distribuição granular não executada

`src/index.ts:1` ainda injeta UnoCSS, `vite.config.ts:16` injeta CSS no entry raiz e `package.json:65` marca o JS raiz como side effect. Não há JS em `dist/components`; import granular falha com `ERR_PACKAGE_PATH_NOT_EXPORTED`.

Gere entries JS/tipos públicos por componente, mapa explícito de exports, resolver canônico e CSS global opt-in. O import granular de MaxButton deve ficar abaixo de 50% do baseline de 477.773 bytes e não carregar módulos/CSS alheios.

### R25 / F30 / E11-05 — contrato público e consumidores incompletos

Os subpaths principais funcionam em dois smokes Node, mas o mapa usa wildcard de temas, não exporta componentes e o script não integra `verify`. Não existem fixtures TS/Vite/SSR; `docs/THEME.md:158` ainda promete injeção global automática.

Use mapa público estrito e valide `.`, stores, styles, preset, resolver, componentes, CSS e temas contra o `.tgz`, com/sem peers, em Node/TS/Vite/SSR. Bloqueie subpath desconhecido, compile exemplos da documentação, corrija `THEME.md` e garanta cleanup do tarball mesmo em falha.

## Etapa 8 — aceite obrigatório

1. Preserve os 7 blocos aceitos desta rodada: F03, F12, F17, R05/F06, R06/F08, R10/F13 e R20/F26.
2. `git diff --check`, nomes, lock, type-checks e lint devem passar sem warnings.
3. Em dois checkouts sem pacotes irmãos: `npm ci`, `npm ls --all`, `npm audit`, type-checks e build.
4. Execute focais e suíte completa duas vezes; zero flutuação, debug, warning ou erro assíncrono.
5. Cobertura >= 85/76/84/89 sem reduzir include/threshold ou remover cenários.
6. Execute browser tests para teclado/foco, modal/stack, nomes, layout/zoom, gráficos/mapas, virtualização, tabela, crop e motion.
7. Execute budgets bruto/gzip/Brotli, inspeção SVG, exports, side effects, sourcemaps e CSS.
8. Instale somente o tarball nos consumidores Node/TS/Vite/SSR com e sem peers opcionais.
9. Anexe matriz `F/R → E → owner → arquivos → testes → resultado`, métricas antes/depois, riscos e rollback.

Somente declare conclusão quando os **25 blocos acima** estiverem fechados, os **32 achados restantes** tiverem aceite integral e todos os gates passarem.
