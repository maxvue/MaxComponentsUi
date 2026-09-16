# Prompt de correção — sexta verificação da implementação

## Resultado auditado e regra de término

Esta auditoria examinou `origin/dev` no commit `4c96fe4c`, contra o ponto de partida do `fix5` (`8b92809d`). A execução do `docs/optimize-new/instructions_to_implementation_fix5.md` **não concluiu o plano**.

- Plano inicial: **72 achados**.
- Aceitos anteriormente: **43/72 (59,7%)**.
- Novos aceites confirmados nesta rodada: **0**.
- Restam **29/72 achados (40,3%)**, distribuídos pelos mesmos **22 blocos**, todos parciais.
- Dos 22 blocos abertos no `fix5`, **0 foram fechados**.
- A evidência formal exigida no `fix5` não existe: `docs/optimize-new/execution-fix5/` está ausente, logo há **0/65 relatórios comprováveis**. Isto prova ausência da evidência no repositório, não quantos agentes a sessão pode ter criado fora dele.

Preserve os dez blocos já aceitos: `F03`, `F12`, `F17`, `R05/F06`, `R06/F08`, `R10/F13`, `R11/F16`, `R13/F20`, `R15/F22` e `R20/F26`.

Não declare sucesso enquanto os 29 achados, a matriz de evidências, todos os gates e a revisão adversarial não forem aprovados. Código nominal, checkbox, teste que retorna cedo, mock que substitui o comportamento real ou teste verde com warnings não constituem aceite.

## Gates reproduzidos

| Gate | Resultado no HEAD auditado |
|---|---|
| `npm ci` | passou; dependências do playground reportaram 6 vulnerabilidades altas |
| `git diff --check` | passou |
| `npm run verify` | falhou no ESLint de `MaxIconButton.vue:153,155` |
| `npm run test:coverage` | 3.680 passaram e 1 falhou: `layers.test.ts` encontra `z-index: 9999` em `MaxInputSelect` e `MaxTagSelect`; também imprimiu `DOMException [AbortError]` no teardown |
| `npm run test:browser` | 55/55 passaram, mas imprimiu repetidamente `Failed to resolve directive: tooltip` |
| `npm --prefix playground run build` | falhou: `media-brand.vue:34,39,44` usa `MaxMaps` sem `modelValue`; há também incompatibilidades de tipos no consumidor/playground |
| `npm run test:benchmark` | falhou com `ERR_UNKNOWN_FILE_EXTENSION` para `MaxBaseVirtualScroller.vue` |
| `node scripts/verify-consumers.mjs` | passou sequencialmente, mas mantém tarball fixo, artefato potencialmente velho e cleanup incorreto em falha |
| `npm ls --all` e audit da biblioteca | passaram; peer opcional pode aparecer como não instalado |
| focais | 22 arquivos e 678 testes passaram; não cobrem as lacunas abaixo |

## Contrato de orquestração — 88 subagentes reais e paralelos

O coordenador somente integra, resolve conflitos e faz o aceite; ele **não implementa nem refuta blocos diretamente**. Instancie e registre **exatamente 88 papéis distintos**, todos concluídos, em ondas paralelas com ownership de arquivos disjunto. Há quatro vagas simultâneas: execute as ondas de até quatro papéis; não conte retry, renomeação ou turno adicional como novo agente.

| Grupo | Quantidade | Responsabilidade |
|---|---:|---|
| `IMP6-*` | 22 | Um implementador para cada bloco aberto |
| `REV6-*` | 22 | Um refutador independente para cada implementador |
| `TEST6-*` | 22 | Um especialista de teste/aceite por bloco, separado do implementador e refutador |
| `GATE6-*` | 12 | Gates transversais independentes |
| `PRES6-*` | 10 | Preservação dos dez blocos aceitos |

Os IDs dos três primeiros grupos são, exatamente: `F07`, `F14`, `F15`, `F18`, `R01`, `R02`, `R03`, `R04`, `R07`, `R08`, `R09`, `R12`, `R14`, `R16`, `R17`, `R18`, `R19`, `R21`, `R22`, `R23`, `R24` e `R25`. Portanto, para cada código existem `IMP6-<código>`, `TEST6-<código>` e `REV6-<código>`.

Os gates são `GATE6-INSTALACAO`, `GATE6-LINT-TIPOS`, `GATE6-UNIT-ASYNC`, `GATE6-COBERTURA`, `GATE6-BROWSER-AXE`, `GATE6-OVERLAYS`, `GATE6-FORMULARIOS`, `GATE6-IMAGEM-MOTION`, `GATE6-PLAYGROUND`, `GATE6-SVG-BUNDLE`, `GATE6-CONSUMIDORES` e `GATE6-CI`. As preservações são `PRES6-F03`, `PRES6-F12`, `PRES6-F17`, `PRES6-R05`, `PRES6-R06`, `PRES6-R10`, `PRES6-R11`, `PRES6-R13`, `PRES6-R15` e `PRES6-R20`.

Antes de qualquer edição, crie `docs/optimize-new/execution-fix6/MATRIZ_ORQUESTRACAO.md`. Para cada um dos 88 papéis registre: ID real, parent ID, tarefa, HEAD inicial/final, início/fim, worktree, manifest de arquivos, comandos, status, commit, risco e caminho do relatório. Cada papel salva seu relatório em `docs/optimize-new/execution-fix6/<ID>.md`; ausência de relatório, status diferente de concluído ou relatório sem comando e saída invalida o aceite.

Ordem obrigatória: (1) matriz e baseline, (2) ondas de `IMP6-*` por ownership sem sobreposição, (3) `TEST6-*` após o respectivo merge, (4) `REV6-*` após os testes, (5) gates e preservações em checkout limpo, (6) matriz final. Serialize `package.json`, lockfile, CI, scripts, helpers de overlay, `InputBase`, `MaxTagSelect` e arquivos de build; o dono seguinte relê o diff integrado. Refutadores não alteram a worktree canônica.

## Blocos corretivos obrigatórios

### 1. Overlays, listbox e formulários

- **F07 / E04-02:** `useOutsidePointer.ts:114,150` chama `onClose` antes de remover/marcar a entrada; o watcher posterior não é síncrono. Marque o topo como fechando antes do callback, prove dois eventos antes de `nextTick`, clique-through, trigger desconectado e zero listeners em Chromium.
- **F14 / E06-01,E06-02:** `MaxBaseVirtualScroller.vue:96,98,162,182` aceita roles arbitrárias e nome indefinido. Modele/rejeite contrato inválido; cubra listbox real, axe-core, teclado e `aria-activedescendant` montado durante scroll.
- **F15 / E06-03,E08-04:** `MaxIconButton.vue:84-123` ainda permite nome `undefined` para ícone desconhecido. O TagSelect encaminha parte do estado, mas faltam browser reais no modo `isButton`. Faça nome contextual obrigatório, inventário dos consumidores e Tab/Enter/Espaço/disabled/emissão única no elemento real.
- **R03 / E03-01:** o guard coleta `parentTag/path`, mas `legacyClassUsage.test.ts:337-345` não os valida. Imponha estrutura canônica e mutation que mova alias e classe para div plausível.
- **R04 / E03-02:** 25 famílias são enumeradas, mas autofill é apenas atributo, submit/FormData só cobrem Text e `InputBase` chama foco manual. Execute matriz Chromium de label, owner, submit, autofill, required e disabled; mantenha Birthday separado da contagem original.
- **R07 / E04-04:** `useFocusTrap`, `useOutsidePointer` e consumidores mantêm stacks/listeners Escape concorrentes. Centralize registro, Tab, Escape e pointer e teste IconPicker, Markdown, Popover e pilha A→B→A→gatilho.
- **R08 / E04-05:** o arquivo browser chama helper próprio de “axe”; `axe-core` não é dependência. Integre axe real e cubra slot vazio, múltiplos IDREFs, CSS/ancestral oculto ou inert, órfão e referência externa.
- **R09 / E04-06,E04-07:** offsets de `visualViewport` são coletados e ignorados; safe-area/margem continuam parciais. Regressão nova: `MaxTagSelect.vue:1012` substituiu token por `z-index:9999`. Restaure token, aplique offsets/safe-area e valide seta, margem, scroll, hit-test, 280/320px, landscape e zoom 200% em componentes reais.
- **R14 / E09-01:** `MaxAuthCard` conserva `@submit.prevent`, `action` duplicada e guarda por tick. Deixe somente submit nativo, com Enter/autofill em Chromium e exatamente uma live region por mensagem.

### 2. Reprodutibilidade, testes e distribuição

- **R01 / E01-02,E01-03,E01-05:** `verify` testa antes de build e omite cobertura, browser, playground, SVGO, benchmark, budgets, `npm ls` e audit. Integre gate canônico e CI com duas instalações limpas, lock bidirecional, import→declaração e declaração→import, consumidor com peers e contratos reais.
- **R02 / E01-04 + E12-02 transversal:** a política de console aceita chamada por leitura de spy e não fecha a janela após teardown; browser não usa política equivalente. Elimine a origem de `AbortError`, faça warning/erro tardio falhar e exija consumo explícito. Duas suítes e duas coberturas devem sair sem stderr inesperado.
- **R24 / E11-04:** `vite.config.ts` injeta CSS no entry raiz; `sideEffects` inclui `index.es.js`, exports são wildcard e testes retornam cedo sem `dist`. Gere mapa explícito por componente, CSS global opt-in, build fresco obrigatório e orçamento real de MaxButton abaixo de 238.886 bytes.
- **R25 / E11-05:** consumidores empacotam tarball fixo antes do temporário e usam `process.exit` antes do `finally`. Use diretório/tarball exclusivo por processo, `finally` efetivo, build fresco, cenários Node/TS/Vite/SSR/CSS/temas, peers com e sem opcionais e concorrência.

### 3. Imagem, UI, playground, SVG e benchmarks

- **F18 / E07-06:** o teste de “48 MP” é SVG `8000x6000` e mede somente duração. Use raster real, Blob/File não nulo, uma chamada `toBlob`, zero `toDataURL` default, falha recuperável e métricas de Long Tasks, heap, congelamento e budgets.
- **R12 / E07-04,E07-05:** `MaxInputFileProject.vue:130-131` abre dois pickers; `MaxMaps.vue:2` elimina coordenada zero. Faça um picker nativo e aceite latitude/longitude zero, com alternativa gráfica acessível e browser que prove ambos.
- **R16 / E10-03,E10-04:** inventário aceita `:disabled` e menções genéricas a foco; browser injeta CSS próprio. Associe alvo real, estado e estilo computado; classifique `--background-650`, contraste, foco, claro/escuro, forced-colors, zoom e Tab.
- **R17 / E10-02:** contraste usa pares hardcoded e mutação artificial. Use CSS computado para todas as variantes, severidades e estados; uma mutação real de token deve quebrar o mesmo gate.
- **R18 / E10-09:** reduced motion é regex/compilação Sass. Emule `reduce` e `no-preference` em Chromium e meça transform, duração, iteração e lifecycle de cada classe inventariada.
- **R19 / E10-10:** corrija os três `MaxMaps` sem `modelValue`; o budget atual aceita 2,6 MB, acima do baseline de 2,507 MB. Compile e monte todos os loaders/estados reais, elimine warnings e estabeleça budget menor que o baseline.
- **R21 / E11-03:** SVGO passa isolado, mas não integra `verify`/CI; teste de Visa não percorre grafo e não há regressão visual. Integre pipeline, budgets bruto/gzip/Brotli, grafo transitivo e comparação visual.
- **R22 / E11-01:** teste de TextList espelha a fórmula do componente. Meça DOM real de número e linha no começo/meio/fim de 10 mil itens, em 100%/200%, mantendo cursor, teclado e resize.
- **R23 / E11-02:** runner `tsx` importa SFC sem loader e falha. Configure runner Vue, gere artefato comparável em checkout limpo e separe medição temporal da suíte determinística.

## Aceite final

1. Cada `IMP6-*` produz teste que falha no baseline apropriado e corrige a causa raiz; cada `TEST6-*` prova o critério observável; cada `REV6-*` tenta refutá-lo com cenário independente.
2. Execute os 12 gates e as 10 preservações após a última integração, em checkout limpo. Não silencie warnings, não reduza cobertura/include/threshold e não aceite artefato `dist` pré-existente.
3. Exija duas execuções completas de unitários e cobertura sem flutuação, `AbortError`, EPROTO, debug ou warnings de tooltip; browser/axe, biblioteca, playground, SVG, benchmark, budgets e consumidores devem aprovar.
4. A matriz final deve mapear os 72 achados para bloco, agente, arquivos, teste, comando, resultado, métrica, risco e rollback.

Somente declare o plano concluído quando os **29 achados** restantes e os **22 blocos** forem aceitos, os dez blocos preservados estiverem aprovados e os **88 papéis** estiverem comprovados no repositório.
