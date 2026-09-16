# Prompt de correção — sétima verificação da implementação

## Diagnóstico e objetivo de conclusão

A auditoria independente do commit `4cba2b5b` confirmou somente **3 dos 29 achados que estavam abertos no fix6**: `R03`, `R08` e `R12`. Portanto, do plano original de **72 achados**, há **46/72 (63,9%) aceitos** e ainda faltam **26/72 (36,1%)**, em **19 blocos**. Não declare sucesso parcial como conclusão.

Os relatórios de `execution-fix6` não são aceite: a matriz registra diversos papéis como `CONCLUÍDO | PLANEJADO`, com HEAD final/commit inválidos e caminho de worktree de outro repositório; também referencia `.github/workflows/ci.yml`, que não existe. O código integrado removeu ou afrouxou testes Chromium/adversariais em vez de demonstrar os contratos. A correção deve substituir essa evidência por evidência reprodutível do HEAD final.

**Objetivo operacional obrigatório:** concluir todos os 19 blocos abaixo, os 26 achados, os gates e a matriz. O coordenador não pode encerrar, entregar resumo, pedir nova leva, reduzir escopo, transformar falha em ressalva, silenciar warning/erro, usar `skip`/`todo` ou aceitar teste que retorna cedo enquanto existir qualquer item pendente. Tempo, contexto, custo, falha transitória ou excesso de arquivos não são condição de término: reabra a etapa, corrija a causa raiz e execute novamente. A única condição de sucesso é todos os critérios verificáveis desta instrução aprovados duas vezes em checkout limpo.

## Contrato explícito: 104 subagentes distintos

O coordenador apenas cria a matriz, agenda ondas, integra commits e decide pelo resultado baseado em evidência. Ele não implementa, testa nem refuta blocos. Crie e registre **exatamente 104 subagentes reais**, com IDs de sessão distintos, na matriz antes de editar. Há quatro vagas simultâneas: execute ondas de quatro agentes; retries e follow-ups usam o mesmo ID e não contam como novo papel. Cada agente usa worktree própria e ownership sem sobreposição.

| Grupo | Qtd. | Papel |
|---|---:|---|
| `IMP7-*` | 19 | Implementa uma causa raiz por bloco |
| `TEST7-*` | 19 | Produz/roda teste observável independente |
| `REV7-*` | 19 | Refuta implementação e teste, sem editar canônico |
| `ADV7-*` | 19 | Ataque adversarial adicional, diferente de REV |
| `GATE7-*` | 14 | Gate transversal em checkout limpo |
| `PRES7-*` | 14 | Preserva os aceites anteriores e integrações |

Os 19 códigos dos quatro primeiros grupos são: `F07`, `F14`, `F15`, `F18`, `R01`, `R02`, `R04`, `R07`, `R09`, `R14`, `R16`, `R17`, `R18`, `R19`, `R21`, `R22`, `R23`, `R24`, `R25`. Assim existem, por exemplo, `IMP7-F07`, `TEST7-F07`, `REV7-F07` e `ADV7-F07`.

Os gates são: `GATE7-INSTALACAO`, `GATE7-LINT`, `GATE7-TIPOS`, `GATE7-UNITARIOS`, `GATE7-COBERTURA`, `GATE7-BROWSER`, `GATE7-AXE`, `GATE7-OVERLAYS`, `GATE7-FORMULARIOS`, `GATE7-PLAYGROUND`, `GATE7-MOTION-IMAGEM`, `GATE7-SVG-BUNDLE`, `GATE7-CONSUMIDORES` e `GATE7-CI-REPRO`.

As preservações são `PRES7-F03`, `PRES7-F12`, `PRES7-F17`, `PRES7-R03`, `PRES7-R05`, `PRES7-R06`, `PRES7-R08`, `PRES7-R10`, `PRES7-R11`, `PRES7-R12`, `PRES7-R13`, `PRES7-R15`, `PRES7-R20` e `PRES7-INTEGRACAO`.

Crie `docs/optimize-new/execution-fix7/MATRIZ_ORQUESTRACAO.md` e um relatório por papel, em `docs/optimize-new/execution-fix7/<ID>.md`. A matriz deve ter, para os 104: ID real, parent ID, bloco, tarefa, worktree, HEAD inicial/final, início/fim, manifest, comandos com saída, teste/critério, status, commit, risco e rollback. Um campo ausente, `PLANEJADO`, caminho externo, commit inválido, relatório sem saída ou papel sem conclusão invalida o aceite.

## Blocos obrigatórios e causa raiz

### A. Interação, acessibilidade e formulários

- **F07:** `useOutsidePointer` já marca `closing`, mas falta Chromium real para dois eventos antes de `nextTick`, clique-through, trigger desconectado e zero listeners. Restaure teste de pilha real; não aceite coalescência como remoção síncrona.
- **F14:** `MaxBaseVirtualScroller` trocou rejeição de role/nome inválidos por `console.warn` e removeu browser listbox/axe/teclado/`aria-activedescendant` com scroll. Modele contrato válido, rejeite o inválido e prove o comportamento real.
- **F15:** fallback genérico de `MaxIconButton` não é nome contextual obrigatório. Exija contexto explícito para ícone desconhecido e restaure browser do TagSelect `isButton` (Tab, Enter, Espaço, disabled e emissão única no elemento real).
- **R04:** a matriz atual cobre poucas famílias. Cubra as 25 famílias originais, mantendo Birthday separado, para label, owner, submit/FormData, autofill Chromium, required e disabled. Não substitua formulário/fixture real por atributo isolado.
- **R07:** `useFocusTrap` e `useOutsidePointer` ainda possuem stacks/listeners globais concorrentes. Centralize registro e ciclo Tab/Escape/pointer; prove IconPicker, Markdown, Popover e pilha A→B→A→gatilho em Chromium.
- **R09:** `visualViewport.offsetLeft/offsetTop` é lido mas não aplicado em `useActiveOverlayPosition`; restaure cenário real de zoom/safe-area/seta/margem/hit-test em 280/320px, landscape e 200% e preserve tokens de camada, sem `z-index` literal.
- **R14:** elimine `@submit.prevent`, actions duplicadas e guard por tick em MaxAuthCard. Deixe um fluxo nativo de submit, com Enter/autofill Chromium e uma única live region por mensagem.

### B. Qualidade, CI e distribuição

- **R01:** `verify` precisa incluir auditoria e CI existente precisa executar duas instalações limpas, lock bidirecional e todos os gates. Corrija referências a workflow inexistente e valide import→declaração e declaração→import.
- **R02:** não permita `AbortError`/`ERR_CANCELED` em allowlist de console. Elimine sua origem, mantenha janela pós-teardown e faça warning/erro tardio falhar em unitário e browser.
- **R24:** remova wildcard de `exports`, gere mapa explícito por componente, torne CSS global opt-in e faça o teste apagar/gerar `dist` fresco antes de medir MaxButton abaixo do orçamento.
- **R25:** mantenha isolamento por processo/finally e acrescente consumidores concorrentes reais e importação/compilação efetiva de CSS/temas, não mera leitura física de arquivos.

### C. UI, performance, motion e playground

- **F18:** raster 48 MP real deve medir Blob/File, uma chamada `toBlob`, zero `toDataURL` default, recuperação e budgets reais: Long Task, heap e freeze não podem ser opcionais nem usar predicado sempre verdadeiro.
- **R16:** inventarie consumidores montados, não DOM fabricado; associe alvo, estado e estilo computado de foco/contraste em claro, escuro, forced-colors, zoom e Tab. Não aceite regex genérica como `:disabled`.
- **R17:** valide CSS computado de todas variantes, severidades e estados; mutação real de token precisa falhar no mesmo gate.
- **R18:** emule `reduce` e `no-preference` em Chromium para todo inventário; não pule componentes/classes ausentes e meça duração, transformação, iteração e lifecycle.
- **R19:** conserte type-check/build do playground (Pinia e MaxCreditCard), todos os MaxMaps e estabeleça budgets estritamente menores que baseline (inclusive gzip), sem warnings.
- **R21:** mantenha SVGO no verify e prove grafo transitivo de bandeiras mais regressão visual real (screenshot/snapshot), com orçamentos bruto/gzip/Brotli.
- **R22:** substitua fórmula espelho por medição DOM real de número/linha em começo/meio/fim de 10 mil itens, em 100%/200%, preservando cursor, teclado e resize.
- **R23:** runner canônico deve carregar Vue; retire caminho `tsx` que importa SFC sem loader e compare artefato temporal produzido em checkout limpo, separado da suíte determinística.

## Execução em 15 etapas obrigatórias

1. Criar matriz, manifests, baseline imutável e as 104 worktrees/IDs.
2. Em ondas de quatro, executar os 19 `IMP7-*` de A; integrar somente commits verdes.
3. Em ondas de quatro, executar os 19 `TEST7-*` contra a integração de A.
4. Em ondas de quatro, executar os 19 `REV7-*`; reabrir qualquer refutação confirmada.
5. Em ondas de quatro, executar os 19 `ADV7-*` com testes e dados diferentes; reabrir qualquer falha.
6. Implementar/retestar B, nas mesmas ondas IMP→TEST→REV→ADV.
7. Implementar/retestar C, nas mesmas ondas IMP→TEST→REV→ADV.
8. Resolver conflitos, remover testes afrouxados, mocks, skips, asserts condicionais e artefatos velhos.
9. Rodar `PRES7-*` em ondas e corrigir regressões dos 13 aceites e da integração.
10. Rodar `GATE7-INSTALACAO` até `GATE7-BROWSER` em checkout limpo, em ondas de quatro.
11. Rodar os demais gates, incluindo CI/reprodutibilidade com duas execuções limpas completas.
12. Reexecutar todos os TEST/REV/ADV que tocaram arquivos após a última integração.
13. Revisar matriz: 104/104 concluídos, sem campos planejados e com HEAD/commits verificáveis.
14. Executar duas vezes `npm run verify` em checkouts limpos e guardar as duas saídas completas; não reutilizar `dist`, cache ou relatório anterior.
15. Só então consolidar relatórios, matriz final e resumo de aceite; se qualquer comando falhar, voltar à etapa que detém a causa raiz.

## Aceite final inegociável

Somente conclua quando os **26/72 achados restantes** estiverem aceitos, os 104 papéis e relatórios forem comprovados, os 14 gates e 14 preservações passarem e as duas execuções limpas de `npm run verify` estiverem verdes sem warnings, `AbortError`, stdout/stderr inesperado, `skip`, `todo`, fallback condicional ou artefato prévio. Caso uma condição falhe, a sessão continua obrigatoriamente a partir da etapa correspondente.
