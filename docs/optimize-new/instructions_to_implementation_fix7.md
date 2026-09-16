# Prompt corretivo — sétima verificação da implementação

## Resultado auditado e condição de conclusão

Audite e corrija `origin/dev` do commit `4cba2b5b`, contra o baseline fix6 `8aa04c65`. Dos 72 achados originais, estavam aceitos 43 e esta execução comprovou apenas `R03` e `R08`: há **45/72 aceitos (62,5%)** e **27/72 pendentes (37,5%)**, em 20 blocos. Não encerre antes de todos os 27 achados, gates e preservações aprovarem.

`execution-fix6` não é evidência suficiente: 55/88 linhas da matriz contêm `PLANEJADO`, SHA ausente/inválido ou data no campo de SHA, embora o status seja concluído; há worktree externa e referência de CI inválida. Substitua-o por evidência verificável do HEAD final.

**Objetivo obrigatório:** o coordenador não pode concluir, resumir, pedir outra leva, reduzir escopo, silenciar warning/erro, usar `skip`/`todo`, teste condicional ou artefato antigo com item pendente. Tempo, custo, contexto ou falha transitória não encerram o trabalho: reabra a etapa dona da causa raiz. Sucesso somente ocorre após todos os critérios passarem duas vezes em checkout limpo.

## Orquestração explícita: 120 subagentes

O coordenador somente agenda, integra commits, resolve colisões e aceita evidências. Antes de editar, crie `docs/optimize-new/execution-fix7/MATRIZ_ORQUESTRACAO.md` e instancie **exatamente 120 IDs reais**, em ondas paralelas de até quatro e ownership disjunto. Retry/follow-up não cria papel novo.

| Grupo | Qtd. | Papel |
|---|---:|---|
| `DIAG7-<BLOCO>` | 20 | Reproduz baseline, causa raiz e teste vermelho |
| `IMP7-<BLOCO>` | 20 | Implementa após diagnóstico aprovado |
| `TEST7-<BLOCO>` | 20 | Prova critério observável integrado |
| `REV7-<BLOCO>` | 20 | Refuta independente, sem editar canônico |
| `GATE7-*` | 20 | Gate transversal em checkout limpo |
| `PRES7-*` | 12 | Preserva blocos aceitos |
| `REL7-*` | 8 | Valida matriz, schema, evidência, commits, ownership, release, rollback e repro |

Os vinte blocos são `F07`, `F14`, `F15`, `F18`, `R01`, `R02`, `R04`, `R07`, `R09`, `R12`, `R14`, `R16`, `R17`, `R18`, `R19`, `R21`, `R22`, `R23`, `R24` e `R25`; crie DIAG/IMP/TEST/REV para cada. As preservações são `F03`, `F12`, `F17`, `R03`, `R05/F06`, `R06/F08`, `R08`, `R10/F13`, `R11/F16`, `R13/F20`, `R15/F22` e `R20/F26`.

Cada papel grava `docs/optimize-new/execution-fix7/<ID>.md` e a matriz espelha ID, parent ID, responsabilidade, SHA inicial/final completos, horários, worktree, manifest, comandos/saída, status, commit, risco e rollback. Uma validação automática falha com campo vazio, `PLANEJADO`, SHA/horário inválido, relatório ausente, caminho externo ou status não concluído. `REL7-MATRIZ` reconcilia 120 linhas/120 arquivos; `REL7-EVIDENCIA` compara comandos relatados e CI.

Sequência: DIAG em cinco ondas; IMP serializando package/lock/CI/helpers overlay/InputBase/AuthCard/TagSelect/build/scripts; TEST após cada merge; REV após TEST; gates/preservações/REL em checkout limpo; duas execuções integrais sem concorrência da mesma suíte; matriz final. Nenhum sucessor inicia antes do relatório validado do predecessor.

## Blocos corretivos

### Overlays, acessibilidade e formulários

- **F07:** Chromium para dois eventos antes de `nextTick`, clique-through, trigger desconectado e zero listeners reais; coalescência não substitui remoção síncrona.
- **F14:** feche tipo/contrato de role e nome, rejeite no limite e prove listbox real com axe, teclado e `aria-activedescendant` durante scroll.
- **F15:** inventarie consumidores, exija nome contextual e cubra TagSelect `isButton` real (Tab/Enter/Espaço/disabled/emissão única).
- **R04:** cubra 25 famílias, Birthday separado, para label, owner, submit/FormData, autofill, required e disabled em Chromium.
- **R07:** unifique registro foco/pointer/Escape/Tab; prove IconPicker, Markdown e Popover A→B→A→gatilho.
- **R09:** aplique offsets de visualViewport/safe-area e teste seta, margem, hit-test, scroll, 280/320px, landscape e 200%, sem z-index literal.
- **R14:** remova prevent/actions duplicadas/guard por tick; mantenha submit nativo, Enter/autofill, uma submissão e uma live region.

### Reprodutibilidade, console e distribuição

- **R01:** audit e duas instalações limpas no verify/CI, lock bidirecional e validações de import/declaração com consumidores/peers reais.
- **R02:** remova allowlist global AbortError/ERR_CANCELED, elimine a causa e faça erro tardio falhar em unitário/cobertura/browser.
- **R24:** mapa explícito de exports, dist fresco, CSS opt-in e budget transitivo MaxButton < 238.886 bytes.
- **R25:** duas execuções concorrentes, cleanup após falha forçada e compilação/importação real de CSS/temas.

### Imagem, UI, playground, SVG e benchmark

- **F18:** raster 48 MP, Blob/File, uma `toBlob`, zero `toDataURL`, recuperação e budgets obrigatórios de long-task/heap/responsividade.
- **R12:** uma ativação de picker e file chooser real; preserve coordenada zero e alternativa gráfica acessível.
- **R16:** consumidores montados e estilos computados reais em claro/escuro/forced-colors/zoom/Tab; elimine/classifique `--background-650`.
- **R17:** CSS computado de todas variantes/estados e mutação de token-fonte que quebre o gate.
- **R18:** inventário derivado do código, reduce/no-preference e lifecycle por classe.
- **R19:** elimine warnings, teste loaders reais e budgets bruto/gzip estritamente menores que baseline.
- **R21:** build fresco, grafo transitivo de bandeiras, SVGO no CI e screenshot/snapshot visual com budgets.
- **R22:** DOM real de número/linha em 10 mil itens, começo/meio/fim, 100%/200%, cursor/teclado/resize; não replique fórmula.
- **R23:** runner Vue funcional (sem `tsx` morto), benchmark sem sujar rastreados e medição temporal separada.

## Gates, 15 etapas e aceite

Os 20 gates são `GATE7-INSTALACAO-A`, `-INSTALACAO-B`, `-LINT-TIPOS`, `-UNIT-A`, `-UNIT-B`, `-COBERTURA-A`, `-COBERTURA-B`, `-BROWSER-AXE`, `-OVERLAYS`, `-FORMULARIOS`, `-IMAGEM`, `-MOTION`, `-CONTRASTE`, `-PLAYGROUND`, `-SVG`, `-BUNDLE`, `-BENCHMARK`, `-CONSUMIDORES`, `-CI`, `-GIT-LIMPO`.

1. Matriz/schema/baseline. 2. DIAG. 3. IMP overlays. 4. TEST. 5. REV. 6. IMP qualidade. 7. TEST/REV. 8. IMP UI. 9. TEST/REV. 10. Remova mocks/skips/testes afrouxados. 11. PRES. 12. Gates instalação-browser. 13. Gates restantes. 14. Duas execuções limpas de `npm run verify`. 15. REL, matriz final e aceite; falha retorna à etapa da causa raiz.

Conclua somente com os **27/72 achados**, 120 relatórios e matriz validados, 20 gates e 12 preservações aprovados; duas instalações e duas execuções limpas sem warning, AbortError, artefato prévio ou rastreado alterado; `git diff --check` e `git status --porcelain` vazios.
