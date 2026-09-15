# Prompt de correção — quinta verificação da implementação

## Resultado da auditoria do fix4

A execução de `docs/optimize-new/instructions_to_implementation_fix4.md` **não foi concluída**. A revisão independente analisou o estado publicado em `dev` no commit `aac16bca`, comparando-o ao baseline `ea9c6869`, com três subagentes de ownership disjunto, testes focais, browser e gates globais.

- Plano inicial: **72 achados**.
- Aceitos antes do fix4: **40/72 (55,6%)**.
- Novos aceites técnicos confirmados: **R11/F16, R13/F20 e R15/F22**.
- Aceitos agora: **43/72 (59,7%)**.
- Ainda sem aceite integral: **29/72 (40,3%)**.
- Dos 25 blocos do fix4, **3 fecharam e 22 continuam abertos**.
- Preserve os dez blocos aceitos: **F03, F12, F17, R05/F06, R06/F08, R10/F13, R11/F16, R13/F20, R15/F22 e R20/F26**.

Contabilidade obrigatória dos 29 achados ainda abertos:

| Bloco | Achados originais | Quantidade |
|---|---|---:|
| F07 | E04-02 | 1 |
| F14 | E06-01, E06-02 | 2 |
| F15 | E06-03, E08-04 | 2 |
| F18 | E07-06 | 1 |
| R01 | E01-02, E01-03, E01-05 | 3 |
| R02 | E01-04 | 1 |
| R03 | E03-01 | 1 |
| R04 | E03-02 | 1 |
| R07 | E04-04 | 1 |
| R08 | E04-05 | 1 |
| R09 | E04-06, E04-07 | 2 |
| R12 | E07-04, E07-05 | 2 |
| R14 | E09-01 | 1 |
| R16 | E10-03, E10-04 | 2 |
| R17 | E10-02 | 1 |
| R18 | E10-09 | 1 |
| R19 | E10-10 | 1 |
| R21 | E11-03 | 1 |
| R22 | E11-01 | 1 |
| R23 | E11-02 | 1 |
| R24 | E11-04 | 1 |
| R25 | E11-05 | 1 |
| **Total** |  | **29** |

`E12-02` é o gate transversal de estabilidade associado a R02, não um achado adicional na contabilidade dos 72; ele continua obrigatório no aceite de R02 e na Etapa 15.

## Descumprimento formal da orquestração anterior

O fix4 exigia 55 subagentes reais e concluídos. A evidência entregue não satisfaz o contrato:

- `MATRIZ_ORQUESTRACAO.md` contém somente **51 IDs**, incluindo tentativas falhas/reinícios.
- Existem apenas **20/25** relatórios `REV-*`.
- Faltam `REV-R19`, `REV-R22`, `REV-R23`, `REV-R24` e `REV-R25`.
- Existem **0/5** relatórios `GATE-*`.
- Há agentes ainda marcados `EM EXECUÇÃO` e uma tentativa `FALHOU`.
- A matriz declara 55 no título, mas não demonstra 55 papéis concluídos.

Uma tentativa falha, retry, renomeação ou novo turno do mesmo ID **não conta** como outro subagente concluído.

## Gates reproduzidos no HEAD auditado

| Gate | Resultado |
|---|---|
| `npm ci` | passou; 718 pacotes, 0 vulnerabilidades |
| `npm run verify` | **falhou** no lint de `src/locales/pt-br.ts` |
| suíte unitária | 239 arquivos e 3.669 testes passaram, mas ainda emite `DOMException [AbortError]` no teardown |
| cobertura | passou: 86,87 / 77,97 / 87,73 / 90,23; também emite `AbortError` |
| browser | 13 arquivos e 55 testes passaram, mas emitem muitos warnings `Failed to resolve directive: tooltip` |
| build da biblioteca | passou; `index.es.js` 349,15 kB e CSS 333,5 kB |
| build completo do playground | **falhou** no type-check de `media-brand.vue` por `modelValue` ausente em MaxMaps |
| build Vite isolado do playground | gera bundle, mas com imports duplicados, CSS `:global` inválido e chunk de 2.507.440 bytes |
| benchmark | **falhou** com `ERR_UNKNOWN_FILE_EXTENSION` ao importar `.vue` |
| consumidores | passam sequencialmente; em concorrência colidem no tarball de nome fixo e deixam temporários após falha |
| `npm ls --all` / audit | passaram |
| `git diff --check` | passou |

O `verify` continua sem executar `npm ls`, audit, browser, cobertura, playground, SVGO, benchmark ou budgets. Testes que dependem de `dist` rodam antes do build e podem usar artefato velho ou retornar cedo.

## Contrato obrigatório — 65 subagentes reais, distintos e concluídos

É proibido ao coordenador implementar ou refutar blocos diretamente. Instancie **exatamente os 65 papéis abaixo**, em ondas compatíveis com a capacidade da plataforma. Todos devem terminar com ID real, tarefa original, parent ID, timestamps, commit/HEAD auditado, status final e relatório próprio.

### Grupo A — 22 implementadores

`IMP5-F07`, `IMP5-F14`, `IMP5-F15`, `IMP5-F18`, `IMP5-R01`, `IMP5-R02`, `IMP5-R03`, `IMP5-R04`, `IMP5-R07`, `IMP5-R08`, `IMP5-R09`, `IMP5-R12`, `IMP5-R14`, `IMP5-R16`, `IMP5-R17`, `IMP5-R18`, `IMP5-R19`, `IMP5-R21`, `IMP5-R22`, `IMP5-R23`, `IMP5-R24` e `IMP5-R25`.

Cada agente possui exatamente um bloco, reproduz a falha antes da edição, corrige a causa raiz, fortalece testes e salva `docs/optimize-new/execution-fix5/IMP5-<ID>.md`.

### Grupo B — 22 refutadores independentes

`REV5-F07`, `REV5-F14`, `REV5-F15`, `REV5-F18`, `REV5-R01`, `REV5-R02`, `REV5-R03`, `REV5-R04`, `REV5-R07`, `REV5-R08`, `REV5-R09`, `REV5-R12`, `REV5-R14`, `REV5-R16`, `REV5-R17`, `REV5-R18`, `REV5-R19`, `REV5-R21`, `REV5-R22`, `REV5-R23`, `REV5-R24` e `REV5-R25`.

O refutador não pode compartilhar ID ou papel com o implementador. Trabalha somente leitura ou em worktree própria, cria casos adversariais e salva `docs/optimize-new/execution-fix5/REV5-<ID>.md`. Somente `ACEITO` após execução independente fecha o bloco.

### Grupo C — 11 especialistas de gates

1. `GATE5-LINT-TSC`
2. `GATE5-UNIT-ASYNC`
3. `GATE5-BROWSER-AXE`
4. `GATE5-OVERLAYS-FOCUS`
5. `GATE5-INPUTS-FORMS`
6. `GATE5-IMAGE-PERFORMANCE`
7. `GATE5-MOTION-CONTRAST`
8. `GATE5-PLAYGROUND`
9. `GATE5-SVG-BUNDLE`
10. `GATE5-PACKAGE-CONSUMERS`
11. `GATE5-CI-REPRODUCIBILIDADE`

Cada um salva `docs/optimize-new/execution-fix5/GATE5-<AREA>.md` com comandos, saída, métricas e veredito.

### Grupo D — 10 auditores de preservação

`PRES5-F03`, `PRES5-F12`, `PRES5-F17`, `PRES5-R05`, `PRES5-R06`, `PRES5-R10`, `PRES5-R11`, `PRES5-R13`, `PRES5-R15` e `PRES5-R20`.

Cada auditor testa exclusivamente o bloco aceito correspondente e salva `docs/optimize-new/execution-fix5/PRES5-<ID>.md`.

### Evidência antifraude e ownership

- A matriz deve conter **65 IDs reais distintos com status concluído**; retries falhos não contam.
- Arquivo ausente, status em execução ou relatório sem comando/saída invalida o papel.
- Antes de cada onda, os agentes declaram manifest de arquivos. Um arquivo possui um owner por vez.
- `package.json`, lockfile, CI, scripts de gate, TagSelect e helpers de overlay são serializados.
- Refutadores não editam a worktree canônica; patches adversariais voltam ao implementador.
- Se não houver 65 agentes concluídos, registre a execução como incompleta e não declare sucesso.

## Plano em 15 etapas

### Etapa 1 — matriz dos 65 agentes e baseline limpo

Crie a matriz completa antes das edições. Registre HEAD, arquivos por owner, dependências entre ondas, budgets fixos e comandos. **IMP5-R02** é o owner da correção do lint de `src/locales/pt-br.ts`, sem relaxar ESLint; faça commit dessa correção antes da onda seguinte, deixando zero alteração não registrada.

### Etapa 2 — gate canônico realmente completo

**IMP5-R01** é o único owner de `package.json`, scripts de `verify` e CI; os demais implementadores entregam seus scripts focais a ele. Integre ao `verify`, na ordem correta: build limpo antes dos testes dependentes de `dist`, lint/type-check, unitários, cobertura, browser, playground completo, SVGO, benchmarks, budgets, `npm ls`, audit e consumidores. Proíba retorno antecipado quando `dist` não existe e artefato stale. Nesta etapa, execute uma vez como **baseline esperado-falhar** e registre cada falha; as duas execuções limpas de aceite ocorrem somente na Etapa 15, depois das correções das Etapas 3–13.

### Etapa 3 — F07 e R07: um único motor de overlay

- **F07:** ao solicitar close, marque/remova sincronicamente o topo para impedir múltiplos callbacks antes do tick. Teste outside-pointer real, clique-through, trigger desconectado, retorno de foco, listener count exato e zero após unmount em Chromium.
- **R07:** unifique Escape/Tab/pointer em um gerenciador canônico. Remova stacks e listeners globais concorrentes de `useFocusTrap`, `useOutsidePointer` e MaxPopover, preservando o registro de cada overlay. Browser deve usar IconPicker, Markdown e Popover reais, incluindo stack aninhado.

### Etapa 4 — F14, F15 e R08: semântica acessível real

- **F14:** remova `| string` de roles ou rejeite combinações arbitrárias; nome ausente deve ser impossível ou erro de contrato. Teste listbox real em Chromium, axe e virtualização/active-descendant durante scroll.
- **F15:** cubra `isButton` real no browser com Tab, Enter, Espaço, disabled e emissão única. Inventarie todos os icon-buttons dinâmicos; nome desconhecido não pode resultar em `undefined` nem fallback genérico.
- **R08:** preserve múltiplos IDREFs/CSS/ancestrais, mas execute `axe-core` real; helper caseiro chamado axe não vale.

### Etapa 5 — R09, R12 e R14: viewport e ações nativas

- **R09:** aplique `visualViewport.offsetLeft/offsetTop`, safe-area e tokens em BaseOverlay e composable. Meça margem, seta, scroll e hit-testing em 280/320 px, landscape e zoom 200%; conferir somente z-index não basta.
- **R12:** `MaxInputFileProject` deve abrir exatamente um picker; não chame input nativo e `useFileDialog.open()` juntos. MaxMaps deve renderizar coordenadas zero válidas no equador/meridiano e manter alternativa acessível.
- **R14:** formulário possui somente o caminho nativo de submit; não duplique a função em `:action` e `@submit` nem masque com guarda de tick. Teste Enter/autofill em Chromium. Preserve um único live owner por mensagem.

### Etapa 6 — R16 e R17: inventários e contraste completos

- **R16:** use parser/DOM para associar cada alvo focável ao seu estilo e estado; `:disabled` textual ou presença genérica de `:focus` não contam. Inventarie todos os `--background-650`, documente exceções e teste componentes reais em light/dark/forced-colors, zoom e Tab.
- **R17:** inclua solid, outlined, text, link, dashed, default/hover/focus/active/disabled e todas as severidades. Remova a matriz hardcoded e o falso mutation antigo; mutação temporária deve quebrar o mesmo gate computado.

### Etapa 7 — F18: crop de 48 MP mensurável

Use bitmap raster real de 48 MP, não SVG com atributos dimensionais. Registre Long Tasks, heap, congelamento e lifecycle contra budgets congelados. Preserve uma chamada `toBlob`, zero `toDataURL` default, Blob/File não nulos, erro recuperável e revogação de Object URL.

### Etapa 8 — R01 e R02: reprodutibilidade e erros tardios

- **R01:** o gate canônico deve executar duas instalações `npm ci` em checkouts limpos sem repositórios irmãos, além de lock bidirecional, `npm ls`, audit e consumidores.
- **R02:** elimine a origem do `AbortError` do happy-dom e faça warning/error tardio falhar mesmo sob spy. Duas suítes e cobertura devem sair com stdout/stderr limpo.

### Etapa 9 — R03 e R04: anatomia e matriz InputBase

- **R03:** valide parent/path/localização real, não somente tag e classe irmã. Mutation deve mover alias para outra `div` plausível e falhar.
- **R04:** execute submit, autofill, required, disabled, label e owner nas 25 famílias, incluindo browser/autofill real. Não simule associação nativa chamando `.focus()` manualmente no wrapper.

### Etapa 10 — R18: reduced motion em navegador

Além do inventário SCSS, use Chromium com `reduce` e `no-preference`; meça estilo computado, transform, duração, iteração e lifecycle de todos os componentes classificados. Regex de presença de media query não fecha o bloco.

### Etapa 11 — R19: playground compilável e montável

Corrija os três usos de MaxMaps sem `modelValue` em `media-brand.vue`. `npm --prefix playground run build` deve executar type-check, build e budget. Elimine imports duplicados, CSS `:global` inválido e warnings. Monte todos os loaders e estados reais em smoke browser. Defina budget de chunk abaixo do baseline, não quase igual ao chunk atual de 2,5 MB.

### Etapa 12 — R21, R22 e R23: SVG e benchmarks honestos

- **R21:** exponha e integre `optimize-svgs --check` ao verify/CI; adicione regressão visual. Prove pelo grafo transitivo que importar uma bandeira/componente não referencia todas as demais.
- **R22:** meça a posição DOM de cada número contra sua linha correspondente no início/meio/fim de 10 mil itens; não compare `translateY` com a mesma fórmula do componente. Preserve cursor, teclado e resize.
- **R23:** configure loader Vue compatível no runner; `npm run test:benchmark` deve gerar artefato comparável em checkout limpo, sem `ERR_UNKNOWN_FILE_EXTENSION`.

### Etapa 13 — R24 e R25: distribuição e consumidores concorrentes

- **R24:** use mapa explícito de exports por componente, remova injeção automática de CSS do entry raiz e `index.es.js` de side effects quando correto. Testes de tree-shaking devem construir `dist` limpo e nunca retornar cedo. Meça grafo MaxButton contra teto de 238.886 bytes.
- **R25:** cubra import direto de CSS e todos os temas, rejeite subpath desconhecido e falhe em warnings de chunk. Use diretório/tarball único por processo (`npm pack --pack-destination` temporário) para permitir concorrência; cleanup deve ocorrer mesmo em falha, sem `process.exit()` antes do `finally`.

### Etapa 14 — refutação dos 22 blocos

Execute os 22 `REV5-*` somente após merge e focais do respectivo `IMP5-*`. Cada refutador deve criar caso adversarial capaz de falhar no commit de referência **`aac16bca`**. Um `REJEITADO` volta ao implementador e é revalidado pelo mesmo ID; o retry não aumenta a contagem de agentes.

### Etapa 15 — 11 gates, 10 preservações e aceite final

Execute os 11 `GATE5-*` e os 10 `PRES5-*` em checkout limpo. Exija:

1. 65 IDs reais, distintos e concluídos; 65 relatórios presentes.
2. `git diff --check`, lint, type-checks e todos os gates sem warnings inesperados da aplicação ou das ferramentas sob uma política explícita; notices externos inevitáveis devem ser classificados e documentados, nunca silenciosamente ignorados.
3. Duas suítes completas e duas coberturas sem `AbortError`, EPROTO, debug ou flutuação.
4. Browser/axe sem warnings de tooltip.
5. Biblioteca e playground compilados, todos os cenários montados.
6. Benchmark, SVGO, bundles, CSS, exports, sourcemaps e budgets aprovados.
7. Consumidores Node/TS/Vite/SSR, CSS e temas, com/sem peers, sequenciais e concorrentes.
8. Matriz final dos 72 achados com resultado, teste, agente, commit, risco e rollback.

## Critério de término

Somente declare conclusão quando os **22 blocos abertos** forem aceitos, os **29 achados restantes** obtiverem aceite integral, os dez blocos preservados não regredirem, todos os gates passarem e os **65 subagentes concluídos** estiverem comprovados. Caso contrário, informe a contagem exata restante e não marque o plano como concluído.
