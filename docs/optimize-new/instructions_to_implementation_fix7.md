# Prompt corretivo — sétima verificação da implementação

## Resultado auditado, baseline e regra de término

Audite e corrija o `origin/dev` no commit `4cba2b5bf28118f99183b9c5a905c9b3f0488e29`, comparado ao baseline do fix6 (`8aa04c65`). O plano original possui 72 achados. Antes desta rodada, 43/72 estavam aceitos; esta execução aceitou somente **R03** e **R08**. Portanto, são **45/72 aceitos (62,5%)** e **27/72 pendentes (37,5%)**, em **20 dos 22 blocos**. Não declare sucesso sem os 27 aceites e os gates abaixo.

Há 89 arquivos em `docs/optimize-new/execution-fix6/` (matriz + 88 relatórios), mas a matriz não é evidência válida: **55/88** linhas contêm `PLANEJADO`, HEAD final ausente ou data no campo de SHA, apesar do status `CONCLUÍDO`. Assim, só 33 papéis têm rastreabilidade formal completa. Corrija a causa documental, não somente o texto: a matriz final deve ser validada automaticamente contra schema e contra os relatórios.

Preserve os blocos aceitos: `F03`, `F12`, `F17`, `R03`, `R05/F06`, `R06/F08`, `R08`, `R10/F13`, `R11/F16`, `R13/F20`, `R15/F22` e `R20/F26`.

## Contrato obrigatório — 120 subagentes reais, organizados e paralelos

O coordenador integra commits, resolve colisões e decide o aceite; ele não implementa, testa nem refuta blocos. Crie `docs/optimize-new/execution-fix7/MATRIZ_ORQUESTRACAO.md` antes de editar, e instancie **exatamente 120 papéis** com IDs reais diferentes. A capacidade simultânea é quatro: execute ondas de quatro, sempre com ownership disjunto, e registre início/fim. Não conte reexecução, retry ou continuação como novo papel.

| Grupo | Qtde | Regra |
|---|---:|---|
| `DIAG7-<BLOCO>` | 20 | Reproduz o defeito no baseline e define causa-raiz/teste vermelho. |
| `IMP7-<BLOCO>` | 20 | Implementa somente após receber o diagnóstico. |
| `TEST7-<BLOCO>` | 20 | Escreve/valida aceite observável contra a integração. |
| `REV7-<BLOCO>` | 20 | Refuta independentemente; nunca edita a worktree canônica. |
| `GATE7-*` | 20 | Gates transversais, em checkout limpo após a integração. |
| `PRES7-*` | 12 | Confirma os doze blocos previamente aceitos. |
| `REL7-*` | 8 | Confere integridade de relatórios, schema, commits, matriz e release. |

Os vinte `<BLOCO>` são: `F07`, `F14`, `F15`, `F18`, `R01`, `R02`, `R04`, `R07`, `R09`, `R12`, `R14`, `R16`, `R17`, `R18`, `R19`, `R21`, `R22`, `R23`, `R24` e `R25`.

Para cada papel, crie `docs/optimize-new/execution-fix7/<ID>.md` com: ID real, parent ID, responsabilidade, baseline e HEAD final (SHA completo), horários, worktree, manifest, comandos com saída resumida, status, commit, risco, rollback e caminho do relatório. A matriz deve espelhar esses campos e uma validação automática deve falhar para campo vazio, `PLANEJADO`, SHA inválido, horário inválido, relatório ausente ou status não concluído. O papel `REL7-MATRIZ` executa essa validação e reconcilia 120 linhas/120 arquivos; `REL7-EVIDENCIA` compara comandos dos relatórios ao CI.

Sequência: (1) DIAG7 em cinco ondas; (2) IMP7, serializando `package*.json`, CI, helpers de overlay, `InputBase`, `MaxAuthCard`, `MaxTagSelect`, build e scripts; (3) TEST7 após cada merge; (4) REV7 após TEST7; (5) 20 GATE7 + 12 PRES7 + 8 REL7 em ondas de quatro e checkout limpo; (6) duas execuções integrais sem concorrência da mesma suíte; (7) matriz final. Um papel só inicia quando o relatório do predecessor estiver presente e validado.

## Blocos corretivos

### Overlays, acessibilidade e formulários

- **F07:** o fechamento síncrono melhorou em `useOutsidePointer`, mas falta prova Chromium de dois eventos antes de `nextTick`, clique-through, trigger desconectado e zero listeners. Instrumente listeners reais e cubra esses cenários em browser.
- **F14:** `MaxBaseVirtualScroller` ainda declara `VirtualScrollerRole | string`; o runtime rejeita, mas o contrato continua permissivo. Torne o tipo fechado, rejeite valor inválido no limite e prove listbox real com axe, teclado e `aria-activedescendant` montado durante scroll.
- **F15:** o fallback de nome é string, porém não há inventário de consumidores nem browser do TagSelect `isButton`. Faça o inventário obrigatório e cubra Tab, Enter, Espaço, disabled e uma emissão única no elemento real.
- **R04:** a matriz Chromium cobre seis, não as 25 famílias; falta matriz completa de label, owner, submit/FormData, autofill, required e disabled. Remova ou justifique o foco manual de `InputBase`; Birthday permanece separado.
- **R07:** `useOutsidePointer` e `useFocusTrap` ainda possuem registries globais e keydown independentes. Unifique a gestão de overlay/foco/pointer/Escape/Tab e prove pilha IconPicker, Markdown e Popover A→B→A→gatilho.
- **R09:** o token z-index foi restaurado, mas `defaultCompute` ignora `visualViewport.offsetLeft/offsetTop`. Propague offsets e safe-area ao cálculo e teste seta, margem, hit-test, scroll, 280/320px, landscape e zoom 200% reais.
- **R14:** `MaxAuthCard` mantém `@submit.prevent`, actions duplicadas e guarda por tick. Faça um único submit nativo; Chromium deve comprovar Enter/autofill, uma única submissão e uma live region por mensagem.

### Reprodutibilidade, console e distribuição

- **R01:** `verify` ampliou cobertura, mas não executa duas instalações limpas nem audit; o CI só possui uma instalação. Implemente dois ambientes independentes, `npm audit`, lock bidirecional e validações import→declaração e declaração→import com consumidores reais/peers.
- **R02:** `consolePolicy` mascara globalmente `AbortError`/`ERR_CANCELED`, violando a eliminação da causa. Remova a allowlist global, corrija o lifecycle que gera o AbortError e prove que um AbortError injetado após teardown falha em unitário, cobertura e browser.
- **R24:** o mapa de entradas melhorou, mas `exports` ainda usa wildcard e os testes o exigem. Substitua por mapa explícito, atualize o contrato de teste, valide build fresco, CSS global opt-in, ausência de injeção e budget transitivo real de MaxButton abaixo de 238.886 bytes.
- **R25:** `mkdtemp` e `finally` do processo pai corrigem parte do problema; falta provar duas execuções concorrentes e cleanup após falha forçada. Adicione ambos, mantendo cenários Node, TS, Vite, SSR, CSS/temas e peers com/sem opcionais.

### Imagem, UI, playground, SVG e benchmark

- **F18:** Long Task/heap são opcionais e `eventLoopTicks >= 0` não prova congelamento. Use raster 48 MP real, Blob/File não nulo, uma chamada `toBlob`, zero `toDataURL` padrão, erro recuperável e budgets obrigatórios de long task, heap e responsividade.
- **R12:** o `<label for>` com botão que chama `nativeInputRef.click()` ainda pode abrir dois pickers; o teste browser citado nem existe. Use uma única via de ativação e prove um file chooser; mantenha coordenadas zero e alternativa gráfica acessível em browser.
- **R16:** inventário e browser usam heurística/mocks, não controles reais; `--background-650` persiste. Meça alvo, estado e estilo computado real em claro/escuro, forced-colors, zoom e Tab; elimine/classifique cada ocorrência do token proibido.
- **R17:** testes calculam SCSS ou span genérico, não contraste computado de variantes/severidades/estados. Crie matriz Chromium real e mutação de token fonte que quebre o mesmo gate.
- **R18:** a lista de motion é manual e não prova lifecycle de cada classe. Derive inventário do código, emule reduce/no-preference e valide transform, duração, iteração e lifecycle por classe.
- **R19:** o playground compila, mas limite de 2.510.000 é maior que baseline 2.507.440 e faltam smoke tests de loaders/estados; há warnings de imports duplicados. Elimine warnings, teste loaders reais e fixe teto estritamente menor que o baseline.
- **R21:** não há snapshot/regressão visual e o grafo é condicional a `dist`. Torne build fresco obrigatório, percorra grafo transitivo, integre SVGO em CI e compare visualmente assets, mantendo budgets bruto/gzip/Brotli.
- **R22:** o teste ainda espelha fórmula e admite não medir a posição DOM. Meça número/linha no DOM em começo/meio/fim de 10 mil itens a 100%/200%, preservando cursor, teclado e resize.
- **R23:** o runner legado ainda requer `tsx` ausente e `test:benchmark` altera `tests/benchmarks/benchmark-results.json` rastreado. Remova o runner morto ou forneça runner Vue funcional; benchmarks não podem sujar git e a medição temporal deve ficar separada da suíte determinística.

## Gates finais e aceite

Nomeie os gates `GATE7-INSTALACAO-A`, `GATE7-INSTALACAO-B`, `GATE7-LINT-TIPOS`, `GATE7-UNIT-A`, `GATE7-UNIT-B`, `GATE7-COBERTURA-A`, `GATE7-COBERTURA-B`, `GATE7-BROWSER-AXE`, `GATE7-OVERLAYS`, `GATE7-FORMULARIOS`, `GATE7-IMAGEM`, `GATE7-MOTION`, `GATE7-CONTRASTE`, `GATE7-PLAYGROUND`, `GATE7-SVG`, `GATE7-BUNDLE`, `GATE7-BENCHMARK`, `GATE7-CONSUMIDORES`, `GATE7-CI` e `GATE7-GIT-LIMPO`. Os doze `PRES7-*` correspondem exatamente aos blocos preservados listados acima. Os oito `REL7-*` são `MATRIZ`, `EVIDENCIA`, `COMMITS`, `OWNERSHIP`, `SCHEMA`, `RELEASE`, `ROLLBACK` e `REPRODUCIBILIDADE`.

Aceite somente se: os 27 achados e 20 blocos forem aprovados; R03/R08 e os demais dez blocos preservados passarem; 120 relatórios/matriz forem validados; duas instalações e duas execuções completas forem limpas, sem `AbortError`, warnings, artefato pré-existente ou arquivos rastreados alterados; e `git diff --check`/`git status --porcelain` estiverem limpos ao final.
