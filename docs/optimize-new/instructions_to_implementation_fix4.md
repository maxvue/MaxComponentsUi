# Prompt de correção — quarta verificação da implementação

## Situação auditada

A execução de `docs/optimize-new/instructions_to_implementation_fix3.md` **não concluiu o plano**. A auditoria independente foi feita no commit `86f43f74`, em worktree isolada, com três recortes de ownership disjunto e execução dos gates globais e focais.

- Plano inicial: **72 achados**.
- Aceitos integralmente: **40/72 (55,6%)**.
- Ainda sem aceite integral: **32/72 (44,4%)**.
- Blocos corretivos ainda abertos: **25/25** — 24 parciais e 1 não executado (**R17/F23A**).
- Progresso líquido desta leva: **0 achados**.
- Preserve obrigatoriamente os sete blocos já aceitos: **F03, F12, F17, R05/F06, R06/F08, R10/F13 e R20/F26**.

Não marque um bloco como concluído por haver código nominal ou teste verde que não exercite o requisito. O aceite exige comportamento observável, teste capaz de falhar diante da regressão e evidência reproduzível.

## Evidência do HEAD auditado

| Gate | Resultado |
|---|---|
| `npm ci` | passou; 718 pacotes e 0 vulnerabilidades reportadas |
| `npm run verify` | passou: 229 arquivos e 3.294 testes, type-checks, lint e build |
| suíte completa e cobertura | passaram, mas ainda imprimem `DOMException [AbortError]` assíncrona no teardown |
| cobertura | 86,20% statements; 77,21% branches; 86,95% functions; 89,56% lines |
| `npm ls --all` / `npm audit --audit-level=low` | passaram |
| browser | 11/11 passaram em somente quatro specs; dezenas de warnings `Failed to resolve directive: tooltip` |
| build da biblioteca | passou; entry raiz 334,20 kB e CSS global 317,92 kB |
| build do playground | **falhou** ao resolver `@maxvue/max-components-ui` nos cenários |
| `node scripts/verify-consumers.mjs` | Node ESM, TS e Vite passaram; **falhou ao instalar o cenário SSR** |
| `git diff --check b6cedac7..86f43f74` | **falhou**: quatro ocorrências de whitespace em `docs/THEME.md` e `scripts/verify-consumers.mjs` |

O script `verify` atual não executa browser, cobertura, audit, `npm ls`, playground, consumidores, SVG, budgets ou benchmarks. Portanto seu sucesso isolado não é aceite.

## Contrato obrigatório de orquestração — 55 subagentes distintos

É **proibido ao agente coordenador implementar os blocos diretamente**. Ele deve instanciar e registrar **no mínimo 55 subagentes distintos ao longo da execução**; eles não precisam rodar simultaneamente.

### Grupo A — 25 implementadores, exatamente um por bloco

`IMP-F07`, `IMP-F14`, `IMP-F15`, `IMP-F18`, `IMP-R01`, `IMP-R02`, `IMP-R03`, `IMP-R04`, `IMP-R07`, `IMP-R08`, `IMP-R09`, `IMP-R11`, `IMP-R12`, `IMP-R13`, `IMP-R14`, `IMP-R15`, `IMP-R16`, `IMP-R17`, `IMP-R18`, `IMP-R19`, `IMP-R21`, `IMP-R22`, `IMP-R23`, `IMP-R24` e `IMP-R25`.

Cada implementador deve ler o `description.md`, o `plan.md`, este prompt e os arquivos reais do seu bloco; reproduzir a falha; escrever/fortalecer o teste; corrigir a causa raiz; executar os testes focais; e salvar `docs/optimize-new/execution-fix4/IMP-<ID>.md` com arquivos alterados, comandos, resultados, riscos e rollback.

### Grupo B — 25 refutadores independentes, exatamente um por bloco

`REV-F07`, `REV-F14`, `REV-F15`, `REV-F18`, `REV-R01`, `REV-R02`, `REV-R03`, `REV-R04`, `REV-R07`, `REV-R08`, `REV-R09`, `REV-R11`, `REV-R12`, `REV-R13`, `REV-R14`, `REV-R15`, `REV-R16`, `REV-R17`, `REV-R18`, `REV-R19`, `REV-R21`, `REV-R22`, `REV-R23`, `REV-R24` e `REV-R25`.

O refutador não pode ser o implementador do mesmo bloco. Deve tentar provar que a correção está incompleta, executar casos adversariais e inspecionar a causa raiz. Trabalha em modo somente leitura ou em worktree própria; se precisar criar teste, entrega o patch ao implementador, que é o único autorizado a integrá-lo. Deve salvar `docs/optimize-new/execution-fix4/REV-<ID>.md` com veredito `ACEITO` ou `REJEITADO`, evidências e comandos. Um `REJEITADO` retorna ao implementador e exige nova revisão pelo mesmo refutador.

### Grupo C — 5 especialistas de gates transversais

1. `GATE-DEPENDENCIAS-CONSUMIDORES`: lock, peers, instalações limpas, pacote e consumidores.
2. `GATE-ACESSIBILIDADE-BROWSER`: axe, teclado, foco, nomes e leitores em Chromium real.
3. `GATE-VISUAL-PERFORMANCE`: viewport, zoom, contraste, motion, canvas, benchmarks e budgets.
4. `GATE-DISTRIBUICAO-PLAYGROUND`: exports, tree-shaking, CSS opt-in, SVG e todos os cenários.
5. `GATE-ESTABILIDADE-FINAL`: suíte repetida, warnings, erros assíncronos, cobertura e matriz final.

Cada especialista deve salvar `docs/optimize-new/execution-fix4/GATE-<AREA>.md`. A matriz `subagente → bloco → arquivos → testes → resultado → evidência` é obrigatória. Cada relatório deve registrar o **ID real emitido pela plataforma**, nome/caminho canônico, parent ID, horário inicial/final, tarefa original e status final; o coordenador deve anexar a listagem de criação. Renomear um agente ou reutilizar seu ID em vários turnos não cria outro subagente. Se a plataforma não conseguir criar os **55 IDs reais e distintos**, continue apenas para preservar o trabalho e registrar o impedimento, mas não declare sucesso nem compacte vários papéis em um único agente.

Preservações com dupla revisão nominal:

| Bloco preservado | Owner | Segundo revisor | Teste focal mínimo |
|---|---|---|---|
| F03 | `GATE-ESTABILIDADE-FINAL` | `GATE-DEPENDENCIAS-CONSUMIDORES` | `tests/helpers/useMirroredModel.test.ts` |
| F12 | `GATE-ESTABILIDADE-FINAL` | `GATE-ACESSIBILIDADE-BROWSER` | `tests/components/MaxInputSelect.test.ts` |
| F17 | `GATE-ESTABILIDADE-FINAL` | `GATE-DISTRIBUICAO-PLAYGROUND` | testes de MaxInputFileProject e MaxInputFileUpload |
| R05/F06 | `GATE-ACESSIBILIDADE-BROWSER` | `GATE-ESTABILIDADE-FINAL` | `tests/components/inputSharedValidationMatrix.test.ts` |
| R06/F08 | `GATE-ACESSIBILIDADE-BROWSER` | `GATE-ESTABILIDADE-FINAL` | `tests/components/MaxModal.test.ts` |
| R10/F13 | `GATE-ESTABILIDADE-FINAL` | `GATE-DEPENDENCIAS-CONSUMIDORES` | `tests/components/MaxInputAutoCompleteApi.test.ts` |
| R20/F26 | `GATE-DISTRIBUICAO-PLAYGROUND` | `GATE-VISUAL-PERFORMANCE` | `tests/architecture/tableAnatomyConsistency.test.ts` |

### Ondas, locks e arquivos compartilhados

As etapas 2–13 abaixo são também as ondas de implementação. Agentes da mesma onda só podem rodar em paralelo após o coordenador comparar seus manifests de arquivos e confirmar interseção vazia. `package.json`, lockfile, scripts de `verify`/CI, TagSelect e helpers de overlay são recursos serializados: **um único owner por arquivo em cada onda**. Alterações transversais são integradas por commits pequenos antes da onda seguinte. Cada `REV-*` inicia somente depois do merge e dos testes focais de seu `IMP-*`; os cinco `GATE-*` iniciam somente após os 25 `REV-*` aceitarem seus blocos.

## Regras comuns para todos os blocos

1. Trabalhe somente em worktree isolada e mantenha ownership de arquivos explícito. Conflitos devem ser serializados pelo coordenador.
2. Teste comportamental deve preceder a correção. Proíba `expect(true)`, fórmulas comparadas consigo mesmas, regex superficial, mocks que eliminem o comportamento real, tolerância que sempre passa e remoção de cobertura.
3. CSS computado, teclado nativo, foco, layout, hit-testing, zoom, canvas e motion devem ser validados em Chromium real quando fizerem parte do aceite.
4. Não use `--legacy-peer-deps`, supressão de warning, casts abrangentes ou exclusões para tornar gates verdes.
5. Corrija a abstração canônica quando a causa for transversal; não replique patches mecânicos em dezenas de SFCs.
6. A preservação dos sete blocos aceitos é atribuída aos cinco `GATE-*`, com testes focais explícitos e dois revisores nos contratos críticos de model, async e tabela; os `REV-*` permanecem focados em seus próprios blocos.

## Plano de execução em 15 etapas

### Etapa 1 — inventário, reprodução e divisão de ownership

O coordenador cria a matriz dos 55 subagentes, lê os 25 achados e congela antes da edição os baselines, budgets, artefatos e métricas que serão comparados. Atualizar baseline depois da correção exige justificativa e aceite independente. Execute e capture todos os gates da tabela acima. Nenhuma edição começa sem reprodução ou justificativa verificável de por que o teste anterior era insuficiente.

### Etapa 2 — R01 e R02: dependências e estabilidade dos gates

- **R01/F01:** remover `legacy-peer-deps=true` de `.npmrc` e todas as flags equivalentes; validar `dependencies`, `devDependencies`, `peerDependencies`, `peerDependenciesMeta` e opcionais bidirecionalmente. Integrar ao gate canônico duas instalações em checkouts sem repositórios irmãos, `npm ls --all`, audit e consumidores do tarball.
- **R02/F02:** fazer todo warning/error inesperado falhar mesmo sob `vi.spyOn`, com allowlist/consumo explícitos. Eliminar a causa do `AbortError` tardio e provar duas suítes completas limpas, sem stdout/stderr inesperado.

### Etapa 3 — F07 e R07: ownership único de camada, pointer, Escape e foco

- **F07:** `useOutsidePointer` deve possuir listener/dispatcher global único, fechar apenas a camada superior, suportar clique-through, âncora desconectada, resize/zoom, retorno de foco ao trigger e contagem zero de listeners após close/unmount. Hoje instala `keydown` em `window` e `document`, conta listeners incorretamente e trata camada inferior como inside.
- **R07:** manter o registro de cada overlay no gerenciador canônico e remover apenas processamento/listeners Escape/Tab duplicados em IconPicker, Markdown e Popover. Provar A→B→A→gatilho, nested stack, unmount, Tab/Shift+Tab e retorno à camada inferior em browser.

### Etapa 4 — F14, F15 e R08: semântica e nomes acessíveis

- **F14:** tipar e impor contrato listbox completo no VirtualScroller — nome, foco, teclado, seleção, IDs e `aria-selected`; ou remover o modo genérico permissivo. `aria-activedescendant` deve sempre apontar para item montado durante scroll/virtualização; validar também axe, browser e leitor.
- **F15:** definir um único owner focável no TagSelect `isButton`; propagar disabled e nome contextual; inventariar todos os icon-buttons e eliminar labels genéricos como `Botão de ação`. Testar o componente real, sem stub, com Tab, Enter, Espaço e emissão única.
- **R08:** resolver múltiplos IDREFs, CSS computado e ancestral `aria-hidden`/`inert`. Validar slot vazio, ID órfão e referência externa com `getByRole`, axe e Chromium.

### Etapa 5 — R03 e R04: anatomia e atributos de inputs

- **R03/F04:** tornar `.max-table-*` a anatomia canônica e `.p-*` somente alias público documentado. Substituir o guard regex por análise que controle arquivo, bloco, posição/contexto e cardinalidade, incluindo `:class` e templates aninhados. Mutation test deve duplicar/mover ocorrência allowlisted e obrigatoriamente falhar.
- **R04/F05:** cobrir as 25 famílias InputBase com owner focável real, label click, submit, autofill, required e disabled. Form/ARIA ficam somente no owner; class/style/data ficam no root; nenhum atributo de controle permanece no wrapper. O teste não pode chamar `focus()` manualmente nem reduzir a matriz para 24/13 famílias.

### Etapa 6 — R09 e R11: layout, camadas e TagSelect visual

- **R09/F11:** usar tokens para z-index de camadas entre componentes/portais; stacking interno local pode permanecer literal se documentado. Usar visualViewport e safe-area. Testar override dos tokens, `elementFromPoint`, seta, scroll e conteúdo longo em 280/320 px, landscape e zoom 200%.
- **R11/F16:** preservar virtualização >500 itens e medir contraste por CSS computado nos estados default/hover/focus, light/dark, first paint, scroll, seleção e active descendant em browser.

### Etapa 7 — R12, R13 e R14: ações nativas, tabela e feedback

- **R12/F19:** file chooser com associação nativa explícita e foco visível; alternativas de Chart/Maps perceptíveis ao foco. Provar Enter/Espaço, disabled, múltiplos arquivos e emissão única em browser.
- **R13/F20:** `scope="col"`, nome estável mesmo com header slot vazio e exatamente uma ordenação/emissão por Enter ou Espaço reais.
- **R14/F21:** exatamente um owner live por mensagem, sem live region aninhada; testar duas instâncias, atualização e um anúncio por evento. AuthCard deve usar submit nativo sem handler duplicado, inclusive Enter e autofill.

### Etapa 8 — R15, R16 e R17: loading, contraste e foco

- **R15/F22:** `start()` deve retornar handle opaco; `end/retry/dismiss(handle)` opera exatamente uma instância, permitindo controlar A e B independentemente quando compartilham chave. A compatibilidade de `end(chave lógica)` deve ser explícita: ou encerra todas documentadamente, ou rejeita ambiguidade sem alterar nenhuma. Cubra retry, concorrência, dispose e timers.
- **R16/F23:** inventariar todas as cores e todos os alvos focáveis, migrar conteúdo habilitado para tokens semânticos e documentar exceções. O gate não pode usar lista fixa nem aceitar mera ocorrência de `:focus`; validar CSS computado em light/dark/forced-colors, zoom 200% e navegação Tab no browser.
- **R17/F23A:** substituir matriz hardcoded e falso mutation test por CSS compilado/computado de todas as severidades/estados; compilar em memória/temporário uma mutação real do token e provar que o mesmo teste falha, sem modificar fonte rastreada.

### Etapa 9 — F18: crop funcional e performance real

Preserve Blob/File não nulos e data URL estritamente opt-in, com uma única chamada `toBlob`, zero `toDataURL` por padrão, limites explícitos de dimensões/pixels e revogação de Object URL. Falha de `toBlob` mantém editor aberto, exibe erro recuperável e emite zero eventos. Execute canvas real de 48 MP em browser e aprove/reprove Long Tasks, heap, congelamento e lifecycle contra os limites congelados na etapa 1; cálculo puro/mocks não contam como aceite.

### Etapa 10 — R18: reduced motion completo

Classifique todos os SFCs com transition/animation, inclusive SideMenuMobile, InputOTP e TabItem. Centralize regras quando possível, documente exceções e corrija o inventário que hoje exige tratamento apenas para keyframes. Emule `reduce` e `no-preference`, medindo transform, duração, iteração e lifecycle.

### Etapa 11 — R19: playground executável

Conectar catálogo → `SCENARIO_LOADERS` → arquivo → mount de componentes e estados reais. Remover imports self-package sem alias válido. Incluir App e cenários no type-check. Build e smoke devem carregar todos os cenários, falhar em warnings, aplicar o budget de chunks congelado na etapa 1 e validar light/dark em 320 px e desktop.

### Etapa 12 — R21, R22 e R23: SVG e benchmarks confiáveis

- **R21/F27:** integrar SVGO ao package/CI, check idempotente e budgets bruto/gzip/Brotli congelados na etapa 1. Inspecionar scripts/handlers/URLs, executar regressão visual e demonstrar por grafo/tarball que importar Visa não inclui outras bandeiras.
- **R22/F28:** substituir a asserção browser sempre verdadeira por medida entre linhas correspondentes no início/meio/fim de 10 mil itens, 100%/200%, erro <=1 px. Registrar benchmark informativo de mount/input/scroll/memória para 100/1k/10k e preservar cursor, teclado e resize.
- **R23/F28A:** integrar benchmark temporal separado da suíte determinística e produzir artefato comparável; a suíte comum conserva somente cardinalidade, coalescência e cleanup.

### Etapa 13 — R24 e R25: distribuição granular e consumidores reais

- **R24/F29:** exports explícitos por componente, entries JS/tipos e resolver canônico; CSS global estritamente opt-in. Remover o entry raiz de `sideEffects` quando tecnicamente correto. Medir bytes transferidos do grafo transitivo minificado: baseline fixo de **477.773 bytes**, teto estrito de **238.886 bytes** para MaxButton e ausência de CSS/módulos alheios.
- **R25/F30:** validar `.`, stores, styles, preset, resolver, componentes, CSS e temas no `.tgz`, com e sem peers, em Node ESM, TypeScript, Vite e SSR; subpath desconhecido deve falhar. Remover `--legacy-peer-deps`, integrar ao `verify`, corrigir `THEME.md` e garantir cleanup em qualquer falha. Corrigir a falha SSR observada nesta auditoria.

### Etapa 14 — refutação independente dos 25 blocos

Somente após o relatório de cada `IMP-*`, execute seu `REV-*`. O refutador deve inspecionar diff e arquivos, executar focais e criar pelo menos um caso adversarial relevante. Qualquer bloco rejeitado retorna ao ciclo implementação→refutação. Não conte bloco sem relatório `REV-*` com `ACEITO` e evidência reproduzida pelo coordenador.

### Etapa 15 — cinco gates transversais e aceite final

Os cinco agentes `GATE-*` executam seus escopos sem reaproveitar o veredito dos implementadores. O coordenador então executa, em checkout limpo:

1. `git diff --check`, nomes, lock, type-checks e lint, sem warnings.
2. Duas instalações e duas suítes completas; zero flutuação, debug, warning, `AbortError` ou erro tardio.
3. Cobertura >= 85/76/84/89 sem reduzir include/threshold/cenários.
4. Browser para teclado/foco, stack, nomes, layout/zoom, gráficos/mapas, virtualização, tabela, crop e motion; zero warning de diretiva.
5. Build da biblioteca e playground; smoke de todos os cenários.
6. Audit, `npm ls`, SVG, budgets bruto/gzip/Brotli, sourcemaps, CSS, exports e side effects.
7. Consumidores instalando somente o tarball em Node/TS/Vite/SSR, com e sem peers opcionais e sem flags de resolução permissiva.
8. Matriz final dos 72 achados, métricas antes/depois, riscos, rollback e links para os 55 relatórios.

## Critério de término

Só declare sucesso quando os **25 blocos corretivos** forem aceitos pelos respectivos refutadores, os **32 achados restantes** obtiverem aceite integral, os sete blocos preservados não regredirem, os cinco gates transversais passarem e existirem evidências dos **55 subagentes distintos**. Enquanto qualquer condição falhar, informe a contagem exata restante e não marque o plano como concluído.
