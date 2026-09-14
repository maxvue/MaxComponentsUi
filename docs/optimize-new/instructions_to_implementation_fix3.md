# Prompt de correção — terceira verificação da implementação

## Resultado da auditoria

A execução de `docs/optimize-new/instructions_to_implementation_fix2.md` **não foi concluída**. A revisão independente foi realizada sobre o estado publicado em `origin/dev`, commit `1ebed416`, por subagentes com ownership disjunto e validação global em checkout isolado.

- Plano inicial: **72 achados**.
- Aceitos antes desta rodada: 40/72.
- Achados anteriormente aceitos que regrediram: **9** (F03, F07, F12, F14, F17 e F18).
- Achados corretivos fechados nesta rodada: **2** (R10/F13 e R23/F28A).
- Integralmente atendidos agora: **33/72 (45,8%)**.
- Ainda sem aceite integral: **39/72 (54,2%)**.
- Dos 32 achados abertos no `fix2`, 30 continuam abertos; somam-se 9 regressões de achados antes aceitos.
- Blocos que podem ser preservados sem reimplementação: **F15, R10/F13 e R23/F28A**.

Não declare conclusão por existir código nominal ou por a suíte ficar verde após apagar testes. O commit `1ebed416` removeu 2.540 linhas e adicionou 494, incluindo aproximadamente 1.586 linhas de testes de aceite; vários comportamentos foram revertidos junto com seus testes.

## Gates observados em checkout isolado

| Gate | Resultado |
|---|---|
| `git diff --check` | passou |
| `check:filenames` | passou |
| `check:lockfile` | passou, mas não valida peers/peerMeta e deixa divergência real passar |
| `npm ci` | passou |
| `type-check` / `type-check:test` | passaram |
| `lint:check` | **falhou: 14 erros** |
| `npm run test` | 3.155/3.155 passaram, após remoção de cobertura comportamental |
| `test:coverage` | passou no limite: 85,87/76,38/86,35/89,31 |
| `build` | passou; entry raiz 740,42 kB, gzip 159,83 kB |
| `npm ls --all` | **falhou (`ELSPROBLEMS`)**: Vue 3.6 RC incompatível e `oxc-parser` ausente |
| `npm audit` | **falhou**: 1 vulnerabilidade baixa e 1 moderada na cadeia Monaco/DOMPurify |
| consumidor tarball atual | passou somente em dois smokes Node ESM; não cobre TS/Vite/SSR nem componentes granulares |

## Regras obrigatórias de execução

1. Trabalhe em worktree isolada e distribua os blocos entre subagentes com ownership de arquivos disjunto.
2. Restaure primeiro os testes removidos que expressavam os contratos abaixo. Um teste só pode ser alterado quando a expectativa anterior estiver comprovadamente errada; documente a justificativa.
3. Escreva ou restaure o teste comportamental antes da correção. Não use `as any`, casts abrangentes, monkeypatch global, inspeção textual ou valores hardcoded como prova de comportamento.
4. Nenhum gate pode ser tornado verde removendo cenário, reduzindo asserção ou excluindo componente da cobertura.
5. Testes de CSS computado, teclado nativo, foco, layout, zoom e hit-testing devem rodar em browser real.

## Etapa 1 — Restaurar regressões de blocos antes aceitos (P0)

### F03 / E02-02 — sentinela ambígua em `useMirroredModel` regrediu

`src/helpers/useMirroredModel.ts:57-80` voltou a usar `lastCanonicalEmitted !== undefined` como presença. Restaure uma sentinela explícita (`hasLastCanonical` ou símbolo único) e os testes removidos para `T` contendo `undefined`, emissão local, round-trip equivalente e mudança externa.

### F07 / E04-02 — outside-pointer voltou a ser duplicado

`MaxInputAutoComplete.vue:411-442`, `MaxInputDatePicker.vue:809-853`, `MaxPopoverMenu.vue:349-361` e `MaxUserSection.vue:388-400` voltaram a motores locais; API, TagSelect e BaseOverlay também precisam convergir. Faça `useOutsidePointer` ser a fonte canônica para pointer externo, clique-through, Escape/retorno de foco quando aplicável e cleanup. Prove zero listeners após fechar/desmontar e composição de stack.

### F12 / E05-06, E05-07 — loading/retry do select voltou a ficar invisível

`MaxInputSelect.vue:636-650` aguarda `before_show()` antes de abrir. Renderize loading/erro antes da espera, compartilhe a promessa em ativações concorrentes e cancele apenas por intenção explícita. Restaure os testes removidos de promise controlada, duas ativações/uma chamada, erro+retry visíveis, resolução e stale update.

### F14 / E06-01, E06-02 — destaque voltou a significar seleção

`MaxInputAutoComplete.vue:56` e `MaxInputAutoCompleteApi.vue:74` usam `activeIndex` em `aria-selected`; isso viola o contrato de listbox. Separe foco lógico (`aria-activedescendant`) de seleção e só referencie elemento montado. Remova ou complete o modo listbox genérico do virtual scroller. Restaure ArrowDown sem Enter, seleção posterior e active descendant virtual montado.

### F17 / E07-02, E07-03 — upload voltou a perder estado e emitir tardiamente

`MaxInputFileProject.vue:137-150` substitui toda a coleção local e `scheduleUpload` ignora rejeição. `MaxInputFileUpload.vue:261-335` aborta sem invalidar geração e limpar callbacks. Reconcilie por identidade, preserve queued/uploading, capture auto-upload e impeça qualquer mutação/emissão após unmount. Restaure os 181+ testes removidos de concorrência, retry e callbacks tardios.

### F18 / E07-06 — crop voltou a aceitar falha e duplicar base64

`MaxImage.vue` tornou `includeDataUrl` true por padrão e removeu `cropError`/tratamento de `toBlob(null)`. Blob deve ser o payload canônico, data URL opt-in; falha mantém editor aberto, mostra erro recuperável e emite zero crop/edit. Restaure os testes removidos de uma única codificação e falha de canvas/blob.

## Etapa 2 — Reprodutibilidade e gates (P0)

### R01 / F01 — lockfile e distribuição ainda parciais

`package.json:148-154` e `package-lock.json:77-82` divergem no peer Vue; `scripts/check-lockfile.mjs:62-99` compara apenas dependencies/devDependencies. Valide também peerDependencies, peerDependenciesMeta, optionalDependencies, ausência de `file:`/links/caminhos e consistência bidirecional. Corrija `docs/DEPENDENCY_AUDIT.md:26-28`. Integre ao `verify`/CI: dois `npm ci` isolados, `npm ls --all`, audit e tarball com/sem peers.

Resolva a árvore inválida de Vue 3.6 RC e o `oxc-parser` ausente sem flags que escondam conflitos. Avalie e corrija as vulnerabilidades Monaco/DOMPurify com versão compatível e teste de sanitização.

### R02 / F02 — aceite global ainda parcial

O monkeypatch e o DEBUG foram removidos, mas `tests/setup.ts:199-211` ainda desativa toda a captura de warning quando existe um spy. Faça warning inesperado falhar e exija consumo/assert explícito. Restaure os testes comportamentais apagados; execute suíte duas vezes, lint, cobertura e `verify` no checkout limpo.

Corrija os 14 erros de lint em `MaxInputToggle.vue`, `menuRouteMatches.ts` e `useOutsidePointer.ts` sem lint mutante indiscriminado.

## Etapa 3 — formulários e validação (P1)

### R03 / F04 — guard `.p-*` ainda não controla ocorrências

`legacyClassUsage.test.ts:163-177,223-229` deduplica seletores num `Set`. Modele exceções por arquivo, bloco/local/contexto e cardinalidade. Uma segunda ocorrência ou movimentação de seletor allowlisted precisa falhar. `.max-*` deve permanecer anatomia canônica.

### R04 / F05 — classificação de atributos do `InputBase` é incompleta

`InputBase.vue:262-299` omite atributos legítimos como `autocapitalize`, `autocorrect`, `enterkeyhint`, `size`, `accept` e `multiple`. Nenhum atributo form/ARIA pode permanecer no wrapper; cada um deve chegar ao owner focável adequado. Teste parametrizado nas 25 famílias, label click sem foco manual, submit/autofill, required e disabled.

### R05 / F06 — validação fragmentada e agora regredida

Os quatro inputs especializados continuam fora da política canônica, sem `dirty` e com casts abrangentes. O commit também removeu `isComplete`, mensagens reativas/getter e testes do helper. Restaure o contrato reativo de `useInputValidation`, migre CPF/CNPJ, CEP, cartão e data para ele e cubra os oito componentes: mount, blur, submit, formato incompleto, correção, setProps de mensagem e reset externo.

## Etapa 4 — modal, stack, nomes e camadas (P1)

### R06 / F08 — fechamento não está centralizado

A prop `beforeClose` ganhou idempotência, mas o evento `before-close` ainda fecha imediatamente (`MaxModal.vue:259-260`) e `toggle/hide/close` desviam de `requestClose` (`:447-460`). Implemente uma única resolução cancelável/assíncrona para botão, Escape, backdrop, API e model. Exija exatamente um update/hide/pop em callback síncrono/duplo, Promise concorrente e reabertura.

### R07 / F09 — stack especializado regrediu

MaxImage, MaxInputMarkdown, MaxTopMenuSearchBar e MaxInputIconPicker voltaram a listeners Escape/traps locais. Integre os componentes reais ao stack; apenas o topo recebe Escape/Tab, a camada inferior retoma ownership e o foco retorna A→B→A→gatilho. Não use wrappers fictícios de MaxModal como prova.

Restaure também o tratamento de erro de crop removido de MaxImage e impeça payload nulo.

### R08 / F10 — nomes acessíveis regrediram e o teste foi apagado

`dialogAccessibleNames.test.ts` foi removido. `MaxBaseOverlay.vue:8-12,52-65` permite dialog sem nome/ID órfão; Drawer, Modal e Popover usam heurísticas incompletas. Garanta label estável por construção e valide com cálculo real de accessible name/getByRole/axe/browser, incluindo slot vazio, CSS hidden, ancestral aria-hidden/inert, múltiplos IDs e referência externa inexistente.

### R09 / F11 — tokens/camadas e clamp sem aceite de layout

Persistem z-index globais literais, como `MaxPageMobileLayout.vue:201-205`, e Drawer voltou a offset numérico. Migre contextos globais para tokens. Adicione browser tests com CSS computado e `elementFromPoint`, viewports 280/320, landscape, zoom 200%, safe-area, seta, scroll, conteúdo longo e override de tokens.

## Etapa 5 — seleção, arquivos e tabela (P1)

### R11 / F16 — contraste/virtualização sem prova browser

Preserve o teste >500 itens do TagSelect, mas substitua mapas/contagens rígidas de SCSS por CSS computado dos estados default/hover/focus em light/dark. Teste primeiro paint, scroll e active descendant após a mudança de fallback em `useVirtualList`.

### R12 / F19 — ações nativas e alternativas gráficas regrediram

`MaxInputFile` voltou a `role=region` focável com keydown manual; Chart e Maps voltaram a alternativas permanentemente `sr-only`. Restaure botão/label nativo associado ao input e painéis/toggles perceptíveis ao foco. Teste em browser Enter/Espaço, disabled, foco visível, emissão única e múltiplos arquivos.

### R13 / F20 — tabela perdeu semântica e ainda não tem teclado real

Preserve o botão nativo e proteção contra dupla ordenação, mas restaure `scope="col"`, nome acessível do controle e testes removidos. Browser test deve pressionar Enter/Espaço e observar exatamente uma emissão/mudança por tecla.

## Etapa 6 — feedback, loading e identidade (P1/P2)

### R14 / F21 — AuthCard regrediu apesar de IDs/live corretos

Preserve IDs únicos e um live owner por toast, mas restaure o `<form @submit.prevent>`, modo/slot custom e submit/autofill/Enter. `MaxButton` deve respeitar `resolvedType`, não forçar `type="button"`. Teste duas instâncias, um anúncio por evento e submissão nativa.

### R15 / F22 — loading não suporta mesma chave em targets diferentes

`useLoading.Store.ts:95-105` mantém mapa 1:1 e sobrescreve `keys[logical]`. Use identidade composta/multimap ou handle público. Teste mesma chave em A/B, retry/end independente, unmount/dispose e zero pending/timers.

### R16 / F23 — migração de contraste/foco continua amostral

Há cerca de 60 usos de `--background-650` e apenas 35/47 SFCs interativos com `:focus-visible`. Classifique cada ocorrência e cada alvo focável, migre conteúdo habilitado e documente exceções. O gate não pode aceitar mera menção a `:focus`/token. Valide contraste/foco computado em light/dark/high-contrast, zoom 200% e navegação Tab.

### R17 / F23A — contraste funcional melhorou, teste continua hardcoded

Preserve os tokens corrigidos, mas substitua a matriz hardcoded e o falso mutation test por CSS compilado/computado de todas as severidades e estados. Uma mutação real que degrade o token deve quebrar o mesmo teste.

## Etapa 7 — motion, playground e distribuição (P1/P2)

### R18 / F24 — reduced motion parcial

O inventário ignora SFCs apenas com transition e o override universal não prova remoção de motion vestibular. Classifique todas as ocorrências/exceções e use browser para emular reduce/no-preference, medindo transform, duração, iteração e lifecycle.

### R19 / F25 — playground contém placeholders

Os 36 cenários lazy renderizam o mesmo `ScenarioCard family="generica"`, sem componentes reais. Faça catálogo→arquivo→mount refletir componentes e estados reais. Smoke deve carregar/montar todos os loaders, falhar em warnings e aplicar budget de chunks; valide light/dark e 320/desktop.

### R20 / F26 — anatomia da tabela regrediu

Restaure classes `.max-table-*`, `scope`, nomes e paginação/loading removidos de MaxTable. Remova duplicações também em MaxTableFields; o guard deve cobrir ambos. Teste feedback compacto real (erro/cautela/help e aria-describedby), virtualização, tema e layout sem sobreposição.

### R21 / F27 — pipeline SVG parcial

Há config e chunks, mas faltam script/pipeline SVGO reproduzível, orçamento bruto/gzip/Brotli, inspeção de segurança (`script`, handlers e URLs externas), regressão visual e prova de que importar Visa não baixa outras bandeiras. Integre ao CI e valide tarball.

### R22 / F28 — benchmark/zoom tautológicos

O teste calcula esperado e recebido como `i * 21`. Meça CSS/DOM real em browser a 100%/200%, início/meio/fim de 10k linhas, com erro <=1 px. Adicione benchmark informativo de mount/input/scroll/memória e preserve cursor/teclado/resize.

### R24 / F29 — distribuição granular não executada

`src/index.ts` ainda injeta UnoCSS; o entry raiz recebe CSS e é marcado side effect. Não há exports por componente; import granular falha com `ERR_PACKAGE_PATH_NOT_EXPORTED`. Gere entries JS/tipos públicos e mapa explícito, CSS opt-in, resolver canônico e budgets. MaxButton granular deve ficar abaixo de 50% do baseline de 477.773 bytes e não carregar módulos/CSS alheios.

### R25 / F30 — contrato público/consumidores parciais

O smoke atual cobre somente Node ESM e não faz parte do `verify`/CI. Adicione fixtures Node, TypeScript, Vite e SSR; valide raiz, stores, styles, preset, resolver, componentes, CSS e themes contra o `.tgz`, com/sem peers e sem flags. Bloqueie subpath desconhecido, compile snippets de docs e corrija a promessa de injeção automática em `docs/THEME.md`.

## Etapa 8 — aceite obrigatório

1. Restaure todos os testes comportamentais removidos em `1ebed416`; registre a matriz teste removido → requisito restaurado.
2. `git diff --check`, nomes, lock, type-checks e lint devem passar sem warnings.
3. Em dois checkouts sem pacotes irmãos: `npm ci`, `npm ls --all`, `npm audit`, type-checks e build.
4. Execute focais e suíte completa ao menos duas vezes; zero flutuação, debug ou warning inesperado.
5. Cobertura >= 85/76/84/89 com os testes restaurados, sem reduzir include/threshold.
6. Execute browser tests de teclado/foco, modais/stack, layout/zoom, gráficos/mapas, virtualização e tabela.
7. Execute budgets bruto/gzip/Brotli, inspeção de exports/side effects/sourcemaps/CSS e SVG.
8. Instale apenas o tarball nos consumidores Node/TS/Vite/SSR com e sem peers opcionais.
9. Anexe matriz `F/R → E → owner → arquivos → testes → resultado`, métricas antes/depois, riscos e rollback.

Somente declare conclusão quando os **29 blocos acima** estiverem fechados, os 39 achados restantes tiverem aceite integral e todos os gates passarem. Preserve F15, R10/F13 e R23/F28A com seus testes; não os enfraqueça durante a integração.
