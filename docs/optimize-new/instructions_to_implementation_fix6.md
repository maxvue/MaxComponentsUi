# Prompt de correção — sexta verificação da implementação

## Resultado auditado do fix5

A execução de `docs/optimize-new/instructions_to_implementation_fix5.md` trouxe avanço técnico real, porém **não concluiu o plano inicial**. A revisão independente foi feita primeiro no commit `99e3d9a3` e repetida após a integração final no commit `738bd749`, por três subagentes com ownership disjunto, reprodução focal e execução do gate canônico.

- Plano inicial: **72 achados**.
- Aceitos antes do fix5: **43/72 (59,7%)**.
- Dos 22 blocos abertos no fix5, 14 fecharam na branch isolada; a integração com o `dev` reabriu R09, R18 e R24. O saldo final é **11 blocos fechados e 11 abertos**.
- Aceitos integralmente agora: **56/72 (77,8%)**.
- Ainda vinculados a blocos sem aceite integral: **16/72 (22,2%)**.
- Em granularidade técnica, F15 e R16 têm um achado corrigido e outro pendente; existem **13 lacunas técnicas individuais**, mas o contrato do plano exige manter os 16 achados vinculados como pendentes até aceite integral dos blocos.

Preserve os 11 blocos confirmados nesta rodada e mantidos após a integração: **F14, F18, R03, R08, R12, R14, R17, R19, R22, R23 e R25**. Preserve também os dez blocos aceitos anteriormente: **F03, F12, F17, R05/F06, R06/F08, R10/F13, R11/F16, R13/F20, R15/F22 e R20/F26**.

### Contabilidade obrigatória dos blocos ainda abertos

| Bloco | Achados originais vinculados | Lacuna técnica atual |
|---|---|---|
| F07 | E04-02 | falta prova Chromium real do outside-pointer, foco, trigger desconectado e listeners |
| F15 | E06-03, E08-04 | E06-03 passou; E08-04 continua com nomes ausentes/genéricos em icon-buttons |
| R01 | E01-02, E01-03, E01-05 | gate não é portável por depender de Chrome em caminho absoluto |
| R02 | E01-04 | duas suítes e duas coberturas precisam ser repetidas no HEAD final imutável |
| R04 | E03-02 | autofill real cobre só MaxInputText; não há matriz nativa integral das 25 famílias |
| R07 | E04-04 | `useFocusTrap` e `useOutsidePointer` ainda mantêm stacks/listeners globais concorrentes |
| R09 | E04-06, E04-07 | merge final mantém `z-index: 9999` em MaxInputSelect e MaxTagSelect; gate de camadas falha |
| R16 | E10-03, E10-04 | E10-03 passou; E10-04 ainda usa associação textual e fixtures sintéticas |
| R18 | E10-09 | inventário browser fixa 59 componentes, mas o merge final possui 60 SFCs com motion |
| R21 | E11-03 | regressão visual de cartão flutua sob carga por espera fixa de frames |
| R24 | E11-04 | MaxInputBirthday foi adicionado sem entrada no mapa explícito de exports |
| **Total estrito** | **16 achados vinculados** | **13 lacunas técnicas individuais** |

`E12-02` continua sendo gate transversal associado a R02, não um achado adicional.

## Evidências reproduzidas pela auditoria

O comando `npm run verify` passou na branch isolada `99e3d9a3`, mas **falhou em cinco etapas** no merge final `738bd749`:

- build limpo, type-checks, ESLint e Stylelint: passaram;
- unitários finais: **242 arquivos passaram e 2 falharam; 3.719 testes passaram e 2 falharam**;
- cobertura: **86,82% statements / 78,09% branches / 87,54% functions / 90,18% lines**;
- browser final: **18 arquivos passaram e 1 falhou; 72 testes passaram e 1 falhou**;
- axe-core, playground, SVGO, benchmark e budgets: passaram;
- consumidores públicos, CSS e seis temas: passaram;
- duas instalações `npm ci` em checkouts limpos: passaram nesta máquina.

Esses resultados não substituem os critérios adversariais abaixo:

1. `tests/integration/r04ChromiumAutofill.test.ts` fixa um executável sob `/home/johnattas/.cache/selenium/...`; o CI não instala nem descobre esse Chrome. Forçar um executável inexistente reproduz a falha.
2. A matriz browser usa digitação para a maioria dos inputs; CDP/autofill real cobre somente `MaxInputText`, não as 25 famílias.
3. F07 possui prova unitária em Happy DOM, mas não a prova Chromium exigida.
4. `useFocusTrap.ts` e `useOutsidePointer.ts` continuam com duas pilhas e dois conjuntos de listeners para eventos equivalentes.
5. Icon-buttons ainda aceitam `undefined` ou nomes posicionais como `Item N` e `Ação N`; `MaxMenuVerticalItem` não foi coberto integralmente.
6. O inventário de foco aceita correspondência textual de seletor e monta várias famílias como `div` sintética em vez do componente real.
7. Em suíte browser combinada, `MaxCreditCard.browser.ts` falhou 1/16 porque dez `requestAnimationFrame` não garantem o término do `fetch` do SVG. Reruns isolados passaram, confirmando flutuação dependente de carga.
8. A matriz anterior contém 65 papéis canônicos, porém 67 linhas e cerca de 70 IDs citados, com retries por IDs novos, papéis reutilizados e relatórios sem identidade autocontida. Não há prova válida de “exatamente 65 agentes distintos”.
9. No merge final, o lint falha em `MaxIconButton.vue:158,160`; unitários/cobertura falham pelo `z-index: 9999` de Select/TagSelect e pelo export ausente de MaxInputBirthday; browser falha porque o inventário de motion espera 59 componentes e encontra 60; budgets repetem a falha de export.

## Contrato obrigatório — 72 subagentes reais, distintos e concluídos

Instancie **exatamente 72 subagentes canônicos**, em ondas compatíveis com o limite da plataforma. É proibido contar o coordenador, retries, turnos adicionais, aliases, auxiliares ou agentes falhos como novos papéis. Um retry deve ser enviado ao **mesmo ID real** por follow-up. Não crie o 73º agente.

Cada agente deve ter ID real único, parent ID, tarefa original, início, fim, commit/HEAD, manifesto de arquivos, comandos, saída resumida, status final e relatório próprio em `docs/optimize-new/execution-fix6/`. A matriz deve ter exatamente 72 linhas de papel e exatamente 72 IDs primários distintos.

### Grupo A — 11 implementadores

1. `IMP6-F07`
2. `IMP6-F15`
3. `IMP6-R01`
4. `IMP6-R02`
5. `IMP6-R04`
6. `IMP6-R07`
7. `IMP6-R16`
8. `IMP6-R21`
9. `IMP6-R09`
10. `IMP6-R18`
11. `IMP6-R24`

Cada implementador possui um bloco inteiro, reproduz a falha antes da edição, corrige a causa raiz, fortalece os testes e salva `IMP6-<BLOCO>.md`.

### Grupo B — 11 refutadores independentes

1. `REV6-F07`
2. `REV6-F15`
3. `REV6-R01`
4. `REV6-R02`
5. `REV6-R04`
6. `REV6-R07`
7. `REV6-R16`
8. `REV6-R21`
9. `REV6-R09`
10. `REV6-R18`
11. `REV6-R24`

O refutador não pode ser o implementador, não pode editar a worktree canônica e somente marca `ACEITO` quando um caso adversarial falha na referência e passa no HEAD integrado.

### Grupo C — 22 especialistas adversariais

1. `ADV6-F07-CHROMIUM`
2. `ADV6-F07-LISTENERS`
3. `ADV6-F15-NOMES`
4. `ADV6-F15-TECLADO`
5. `ADV6-R01-PIPELINE`
6. `ADV6-R01-CLEANROOM`
7. `ADV6-R02-ASYNC`
8. `ADV6-R02-COBERTURA`
9. `ADV6-R04-AUTOFILL`
10. `ADV6-R04-MATRIZ`
11. `ADV6-R07-ARQUITETURA`
12. `ADV6-R07-BROWSER`
13. `ADV6-R16-AST`
14. `ADV6-R16-BROWSER`
15. `ADV6-R21-CORRIDA`
16. `ADV6-R21-STRESS`
17. `ADV6-R09-CAMADAS`
18. `ADV6-R09-VIEWPORT`
19. `ADV6-R18-INVENTARIO`
20. `ADV6-R18-BROWSER`
21. `ADV6-R24-EXPORTS`
22. `ADV6-R24-CONSUMIDOR`

Há exatamente dois especialistas por bloco. Eles criam provas adversariais independentes e salvam `ADV6-<BLOCO>-<FOCO>.md`.

### Grupo D — 20 especialistas de gates

1. `GATE6-FILENAMES-DIFF`
2. `GATE6-LOCK-AUDIT`
3. `GATE6-BUILD-CLEAN`
4. `GATE6-LINT-STYLELINT`
5. `GATE6-TSC-LIBRARY`
6. `GATE6-TSC-TESTS`
7. `GATE6-UNIT-RUN-1`
8. `GATE6-UNIT-RUN-2`
9. `GATE6-COVERAGE-RUN-1`
10. `GATE6-COVERAGE-RUN-2`
11. `GATE6-BROWSER-FULL`
12. `GATE6-AXE-REAL`
13. `GATE6-OVERLAY-STRESS`
14. `GATE6-FORMS-CHROME`
15. `GATE6-FOCUS-CONTRAST`
16. `GATE6-SVG-VISUAL-STRESS`
17. `GATE6-PLAYGROUND-BUDGET`
18. `GATE6-BENCHMARK-BUNDLE`
19. `GATE6-CONSUMERS-CONCURRENT`
20. `GATE6-CI-CLEANROOM`

Cada gate roda somente após integração dos onze blocos e salva `GATE6-<AREA>.md`. Os agentes de duas execuções globais devem ser distintos; não reutilize um refutador como gate.

### Grupo E — 8 auditores de preservação

1. `PRES6-LEGACY-A` — F03, F12 e F17
2. `PRES6-LEGACY-B` — R05, R06 e R10
3. `PRES6-LEGACY-C` — R11, R13, R15 e R20
4. `PRES6-NEW-A` — F14, F18 e R03
5. `PRES6-NEW-B` — R08, R12 e R14
6. `PRES6-NEW-C` — R17 e R19
7. `PRES6-NEW-D` — R22 e R23
8. `PRES6-NEW-E` — R25

Cada agente verifica arquitetura, contrato e comportamento real de todos os blocos do seu portfólio e salva um relatório próprio. Assim, os **21 blocos preservados** possuem auditor responsável explícito.

**Contagem fechada:** 11 implementadores + 11 refutadores + 22 adversariais + 20 gates + 8 preservações = **72 subagentes**.

## Regras de ownership e integração

- Crie a matriz dos 72 agentes antes de qualquer edição.
- Um arquivo tem um owner por vez. Declare manifest antes de cada onda.
- Serialize `package.json`, lockfile, CI, configs Vitest/Vite, helpers de overlay, bootstrap browser e componentes de icon-button.
- Implementadores trabalham em worktrees próprias. O integrador aceita somente commits focais e resolve conflitos conscientemente.
- O coordenador apenas agenda, integra commits já revisados e atualiza a matriz; não implementa, não refuta e não executa papel de gate.
- Todo aceite deve apontar para um commit imutável já integrado. “HEAD + alterações locais” é evidência inválida.
- Nenhum relatório pode omitir ID, parent, timestamps, commit, comandos, resultado e veredito.
- Falha ou retry não cria novo papel. Use o mesmo agente/ID até conclusão.
- Se a plataforma impedir 72 agentes reais, declare execução incompleta; não fabrique IDs nem conte sessões.

## Plano em 15 etapas

### Etapa 1 — baseline integrado e matriz de 72 agentes

Parta do `dev` remoto mais recente em worktree limpa. Resolva previamente qualquer merge pendente e prove `git status` limpo. Faça uma onda inicial de cadastro, sem edições: instancie os papéis em lotes compatíveis com a concorrência, capture o ID real e o parent, receba o manifesto e deixe o agente ocioso/concluído. Preencha a matriz somente com esses IDs reais. Quando chegar a onda de trabalho, use follow-up no mesmo ID; não crie substituto. Registre o commit baseline, os 72 IDs, ownerships, dependências e ondas. Reproduza todos os onze bloqueios antes das correções.

### Etapa 2 — R01: pipeline portável

Remova caminhos absolutos e descoberta específica de máquina. O teste de autofill deve descobrir um Chromium instalado pelo Playwright/CI ou preparar explicitamente o runtime. Execute o pipeline em dois checkouts limpos, sem cache privado, repositórios irmãos ou `$HOME` específico. `npm run verify` deve falhar se qualquer ferramenta exigida estiver ausente; não pule silenciosamente.

### Etapa 3 — R02: estabilidade no HEAD final

Mantenha a correção de lifecycle e a política de console. Faça warnings/errors tardios falharem mesmo sob spy e valide focais de teardown nesta etapa. As duas suítes e duas coberturas globais serão executadas exclusivamente na Etapa 15, após a integração de todos os blocos, por quatro agentes distintos e no mesmo commit imutável. Elas devem ter código zero e ausência de `AbortError`, `EPROTO`, `DOMException`, unhandled rejection e Vue warnings.

### Etapa 4 — F07: outside-pointer real

Preserve a remoção síncrona do topo antes do callback. Adicione Chromium real para outside-pointer, clique-through, trigger desconectado, retorno de foco, listener count exato e zero após unmount. A prova deve montar componentes de produção e não apenas chamar o helper em Happy DOM.

### Etapa 5 — R07: um único motor de overlay

Substitua `trapStack` e `overlayStack` concorrentes por um gerenciador canônico de camadas. Escape, Tab, Shift+Tab, pointerdown/click, foco e restauração devem usar uma única pilha e um único conjunto global de listeners. Monte juntos IconPicker, Markdown/Lightbox, Popover e ao menos um consumidor real de outside-pointer; prove ordem LIFO, ausência de click-through e limpeza total.

### Etapa 6 — F15: nomes acessíveis específicos

Elimine `undefined` e fallbacks posicionais/genéricos para icon-buttons. `MaxIconButton`, toolbars, tabelas e `MaxMenuVerticalItem` devem exigir nome contextual específico por tipo ou falhar explicitamente em desenvolvimento. Não aceite `Item N`, `Ação N`, apenas título do ícone, nem warning que deixa o botão sem nome. Preserve Tab/Enter/Espaço/disabled/emissão única do `isButton`.

### Etapa 7 — R04: matriz nativa das 25 famílias

Crie inventário explícito das 25 famílias e prove para cada uma os contratos aplicáveis de owner, label, required, disabled, submit, `FormData` e autofill. `userEvent.fill`, atribuição de `.value` e `.focus()` manual não contam como autofill/associação nativa. Use CDP/Chromium real para os campos autofilláveis e documente explicitamente as famílias que legitimamente usam `autocomplete=off`.

### Etapa 8 — R16: foco real por alvo

Troque a correlação textual de CSS por parser/DOM que associe cada alvo focável ao seletor, ancestral, estado e regra computada corretos. Monte todos os componentes reais descobertos, não `div`s sintéticas equivalentes. Teste Tab, `:focus-visible`, light/dark, forced-colors e zoom. Mutation tests devem trocar ancestral, classe, estado e ordem de cascata e fazer o mesmo gate falhar.

### Etapa 9 — R09, R18, R21 e R24: regressões do merge final

- **R09:** remova `z-index: 9999` de MaxInputSelect e MaxTagSelect e use o token semântico correto, preservando viewport visual, safe-area, seta, margem, scroll e hit-test.
- **R18:** torne o inventário de motion derivado dos SFCs atuais; inclua MaxInputBirthday e prove `reduce`/`no-preference`, lifecycle e CSSOM sem cardinalidade hardcoded.
- **R21:** substitua espera fixa de dez frames por condição observável com timeout limitado: logo/fundo efetivamente carregados ou estado de erro concluído. Não aumente sleeps. Preserve fallback gracioso de fetch, corrida JCB→Visa, revogação/limpeza, grafo transitivo, SVGO, orçamento e snapshot visual.
- **R24:** inclua MaxInputBirthday no mapa explícito de exports e faça o gate derivar/validar manifest, entrypoints, tipos, CSS opt-in e consumidor real, sem voltar a wildcard.

### Etapa 10 — provas adversariais especializadas

Execute os 22 `ADV6-*` depois dos commits dos implementadores e antes da refutação final. Cada relatório deve demonstrar o caso que escapava ao fix5, o resultado na referência e no commit candidato. Achado adversarial volta ao mesmo implementador por follow-up.

### Etapa 11 — integração e inspeção estrutural

Integre os onze commits em worktree limpa, resolvendo conflitos sem escolher `ours`/`theirs` indiscriminadamente. Execute `git diff --check`, verifique arquivos órfãos, artefatos `.tgz`, temporários e alterações geradas. Revise correção, legibilidade, arquitetura, segurança e performance antes dos gates globais.

### Etapa 12 — gates rápidos e focais

Execute filenames, lockfile, audit, build limpo, lint, Stylelint, os dois type-checks, tests focais de cada bloco, axe real, foco/contraste, overlays, forms, SVG e benchmark. Nenhum warning inesperado pode ser ocultado ou convertido em allowlist sem causa externa documentada.

### Etapa 13 — stress e cleanroom

Execute a suíte browser completa e pelo menos dez repetições mistas de `MaxCreditCard` com outros arquivos, sem flake. Rode consumidores sequenciais e concorrentes com tarballs/diretórios exclusivos e cleanup em falha. Rode o pipeline em dois checkouts cleanroom sem cache privado da máquina do autor.

### Etapa 14 — refutação e preservação

Os onze `REV6-*` revisam commits já integrados e imutáveis. Em paralelo, os oito `PRES6-*` revalidam os 21 blocos preservados conforme os portfólios nominais do Grupo E. Um `REJEITADO` reabre o bloco e retorna ao mesmo `IMP6-*`; não aumente a contagem de agentes.

### Etapa 15 — aceite final pelos 20 gates

Execute os 20 `GATE6-*` no mesmo commit final. Exija:

1. exatamente 72 linhas, 72 IDs primários reais, distintos e concluídos, além de 72 relatórios autocontidos;
2. worktree limpa e `git diff --check` aprovado;
3. duas suítes e duas coberturas globais limpas no commit final;
4. browser, axe, overlays, autofill, foco e SVG sem flake ou warning inesperado;
5. build da biblioteca e playground, budgets, benchmark, exports e sourcemaps aprovados;
6. consumidores sequenciais e concorrentes, CSS, seis temas e SSR aprovados;
7. cleanroom reproduzível sem caminhos absolutos ou dependência de ambiente privado;
8. matriz final dos 72 achados com status, prova, agente, commit, risco e rollback.

## Critério de término

Somente declare conclusão quando **F07, F15, R01, R02, R04, R07, R09, R16, R18, R21 e R24** forem integralmente aceitos, os **16 achados vinculados** saírem do estado pendente, todas as preservações permanecerem válidas, os 20 gates passarem no mesmo commit e os **72 subagentes canônicos** estiverem comprovados. Caso contrário, informe a contagem estrita restante e não marque o plano como concluído.
