# Prompt de correção — segunda verificação da implementação

## Resultado da auditoria

A execução de `instructions_to_implementation_fix.md` **não foi concluída**. A revisão independente foi feita sobre o diff do worktree Antigravity `wt-3fb7d7a5`, baseado em `c87e3ee8`.

- Plano inicial: 72 achados.
- Integralmente atendidos até esta revisão: 40/72 (55,6%).
- Ainda sem aceite integral: 32/72 (44,4%).
- Prompt corretivo anterior: 7/32 blocos concluídos e 25/32 ainda abertos (78,1%).
- Blocos confirmados como concluídos nesta rodada: F03, F07, F12, F14, F15, F17 e F18. Não os reimplemente; apenas preserve seus testes.

## Gates observados

- `check:filenames`, `check:lockfile`, `type-check`, `type-check:test` e `build` passaram, mas o check de lock é falso positivo.
- `npm run lint:check` falhou com 60 erros e 8 warnings.
- `npm run test` falhou: 9 testes em 8 arquivos; 3.103 passaram.
- `npm ls --depth=0` falhou com `ELSPROBLEMS`, MaxUse local inválido e árvore extraneous.
- `git diff --check` falhou em cinco testes por linhas em branco no fim do arquivo.
- Bundle raiz: 772,44 kB, gzip 162,78 kB; não existem entries JavaScript por componente.
- Imports granulares testados falharam com `ERR_MODULE_NOT_FOUND`.
- Cobertura, tarball isolado, consumidores Node/TS/Vite/SSR e testes browser não têm evidência válida de aceite.

Uma falha em qualquer gate impede declarar conclusão. Trabalhe em worktree isolada, use subagentes com ownership disjunto, leia os planos originais e produza teste de regressão comportamental antes de cada correção. Não use casts abrangentes, monkeypatch global, teste textual ou valor hardcoded para simular aceite.

## Etapa 1 — Reprodutibilidade e gates (P0)

### R01 — F01 / E01-02, E01-03, E01-05 — não executado

`package.json:74`, `package-lock.json:13,93,1029`, `vite.config.ts:81` e `vitest.config.ts:17` ainda dependem de `file:../MaxUse` ou de `../MaxUse/src/index.ts`. `scripts/check-lockfile.mjs:29-67` deixa isso passar; `scripts/verify-package-consumer.mjs:40,47` injeta o pacote irmão e usa `--legacy-peer-deps`. Faltam `engines` e `packageManager`.

Substitua pelo contrato publicado compatível ou registre bloqueio externo explícito, sem atalhos locais/Git. Regenere o lock em checkout sem irmãos, remova aliases locais, valide manifesto e lock bidirecionalmente e rejeite qualquer `file:`, link ou caminho. O tarball deve instalar com e sem peers opcionais, sem flags que escondam conflitos.

Aceite: fixtures negativas de lock; dois checkouts isolados; `npm ci`; `npm ls --all`; type-check/build e consumidor do `.tgz` sem diretório irmão.

### R02 — F02 / E01-04, E12-02 — regressão de teclado e suíte

`tests/setup.ts:29-39` altera globalmente `HTMLButtonElement.dispatchEvent`, dispara `click` antes de `keydown`, duplica/toggle duas vezes handlers e imprime `DEBUG` em stdout. Remova o monkeypatch global. Confie na ativação nativa em browser ou simule localmente o click correspondente; remova handlers redundantes da produção. Corrija os testes antigos de z-index sem adaptar produção a uma expectativa inválida.

Aceite: zero debug/warning inesperado; `npm run test` repetido; cobertura com thresholds 85/76/84/89; lint e `npm run verify` verdes.

## Etapa 2 — Formulários e validação (P1/P2)

### R03 — F04 / E03-01 — guard `.p-*` ainda superficial

`legacyClassUsage.test.ts:31-84,126-148` permite seletor por nome em qualquer quantidade/contexto e considera suficiente existir alguma classe Max. Persistem regras paralelas em `MaxTopToolbar`, `MaxTable` e `MaxInputIconPicker`. Faça `.max-*` ser a anatomia canônica e isole `.p-*` como alias público documentado. Controle exceções por ocorrência/localização e faça um mutation test em arquivo já allowlisted falhar.

### R04 — F05 / E03-02 — atributos ARIA duplicados no wrapper

`InputBase.vue:238-275` não inclui `aria-describedby` nem demais `aria-*` no contrato do controle; alguns atributos terminam no wrapper e no input. Troque a allowlist incompleta por classificação semântica: atributos form/ARIA no owner focável, class/style/data no root. Cubra as 25 famílias, label click, submit/autofill, disabled e required; o wrapper não pode reter atributos do controle.

### R05 — F06 / E03-03 — regressão de `error=true`

Os adaptadores de `MaxInputCpfCnpj`, `MaxInputCep`, `MaxInputCreditCard` e `MaxInputCreditCardDate` aceitam apenas erro string e o computed sobrescreve `v-bind`, perdendo o contrato booleano `error=true`. Preserve boolean/string e precedência legada, touched/dirty/submitted e reset externo. Reescreva `inputSharedValidationMatrix.test.ts` sem `as any` ou asserts condicionais; cubra mount, blur, submit, correção, reset do parent e valor incompleto.

## Etapa 3 — Modais, nomes e camadas (P1)

### R06 — F08 / E04-03 — fechamento legado pode executar duas vezes

Em `MaxModal.vue:198-239,307-316`, `beforeClose(done => done())` síncrono pode alcançar `onDone` novamente e duplicar emits/pop. Torne a resolução idempotente com estado `settled`, retorno imediato e geração coerente. Teste callback síncrono, callback chamado duas vezes, Promise concorrente e exatamente um `hide`, update e pop.

### R07 — F09 / E04-04 — stack especializado sem prova de foco

Os quatro especializados já entram no stack, mas `modalSpecializedStack.test.ts` não cobre Tab/Shift+Tab nem retorno A→B→A→gatilho; listeners Escape locais continuam paralelos. Centralize ownership de trap/Escape e valide em browser foco cíclico, retorno em cadeia, unmount e nested stack.

### R08 — F10 / E04-05 — dialog ainda pode ter nome vazio

`MaxModal.vue:383-401` e `MaxPopover.vue:153-171` validam apenas existência do ID externo, não texto/nome; slot ou elemento vazio suprime o fallback. Exija accessible name efetivo e fallback textual estável. Teste header vazio, ID vazio/hidden, referências externas e cálculo real do nome.

### R09 — F11 / E04-06, E04-07 — aceite visual e z-index quebrados

Os tokens e clamp tiveram avanço, mas `MaxBaseOverlay.test.ts:231,263` tenta converter `var(...)` com `Number` e falha. Os testes atuais não medem CSS computado, `elementFromPoint`, safe-area, seta/scroll ou zoom. Corrija o contrato/testes e valide composição real em browser nos viewports 280/320 px, landscape, zoom 200%, conteúdo longo e override de tokens.

## Etapa 4 — Async, virtualização e teclado (P1/P2)

### R10 — F13 / E05-07 — dois caminhos remotos no autocomplete

`MaxInputAutoCompleteApi.vue:334-343` ainda chama `fetchData()` no mount/route/data sem `minLength` ou `delay`, enquanto apenas o input usa scheduler (`:382-413`). Centralize toda busca remota no mesmo debounce/gate/abort. O teste não pode limpar a chamada inicial: abaixo do mínimo devem ocorrer zero requests desde o mount; cubra route/data abaixo e acima do limiar e resposta obsoleta.

### R11 — F16 / E06-05, E06-06 — produção avançou, testes não provam aceite

O contraste e o índice achatado foram corrigidos, mas `tokens.test.ts:188-208` usa pares hardcoded e só um estado; `MaxTagSelect.test.ts:632-680` não prova scroll, montagem do active descendant ou seleção. Resolva tokens/CSS reais nos estados light/dark/default/hover/focus e teste mais de 500 itens agrupados, scrollTop, item ativo montado e seleção.

### R12 — F19 / E07-04, E07-05 — ativação nativa e alternativas gráficas

Chart/Maps e chooser melhoraram, mas `MaxInputFile` mantém keydown manual no botão remover e os testes não exercitam Enter/Espaço reais nem emissão única com vários arquivos. Confie em click nativo, acrescente browser test de teclado/foco visível/disabled e valide que alternativas gráficas se tornam perceptíveis ao foco.

### R13 — F20 / E08-05 — teste de tabela permanece vermelho

A produção removeu handlers redundantes, mas `MaxTable.test.ts:233-235` ainda espera que `trigger('keydown')` isolado gere a ativação nativa. Atualize o unitário para click e adicione browser test com Enter/Espaço reais, exigindo exatamente uma ordenação/emissão por tecla.

## Etapa 5 — Feedback e loading (P1)

### R14 — F21 / E09-01 — não executado

Nenhum diff atingiu `MaxAuthCard` ou `MaxToast`. IDs globais `max-auth-card-error` continuam duplicáveis; Toast ainda combina container `aria-live`, item `status/alert` e regiões internas. Use ID por instância e um único owner live por mensagem. Teste duas instâncias, IDs únicos e exatamente um anúncio por evento.

### R15 — F22 / E09-02 — não executado

`useLoading.Store.error()` ainda apaga a chave lógica e `retry()` não a restaura, logo `end(chave-logica)` pode deixar loading preso. Preserve a identidade pública com geração/concorrência segura e descarte timers no dispose. Teste retry→end com a mesma chave, múltiplos targets e unmount.

## Etapa 6 — Identidade, foco, motion e playground (P1/P2)

### R16 — F23 / E10-03, E10-04 — não executado

Persistem 65 usos de `--background-650`, inclusive em conteúdo habilitado, e o teste de texto usa hex hardcoded. O gate de foco cobre apenas poucos SFCs. Faça inventário de papel/fundo/estado, migre para tokens semânticos e inventarie todos os elementos focáveis. Valide CSS computado em claro/escuro/high-contrast, zoom e navegação por Tab.

### R17 — F23A / E10-02 — não executado

`MaxDarkModeContrast.test.ts` usa matriz hardcoded e `MaxButton` mantém hover WhatsApp literal `#054a42`. Tokenize o hover e faça o teste resolver CSS compilado/computado. Um mutation test que degrade o token deve falhar.

### R18 — F24 / E10-09 — não executado

Há 74 SFCs com motion e 58 sem `prefers-reduced-motion`; o teste cobre lista fixa. Crie inventário automático, migre todos os casos aplicáveis, documente exceções e teste CSS e comportamento compilados.

### R19 — F25 / E10-10 — não executado

Não existe `playground/src/scenarios`; `getCoverageStats` continua retornando 100% literalmente e o teste só verifica IDs. Crie cenários realmente renderizáveis/lazy, vínculo catálogo→arquivo→mount, smoke de todos os cenários e budgets de warning/chunk. Cobertura deve ser calculada, não declarada.

### R20 — F26 / E10-08 — parcial

`MaxTable.vue` adicionou aliases, mas ainda repete logo após os mixins as regras de header row/cell, body row e cell base. Remova a duplicação e crie guard estrutural contra divergência da anatomia compartilhada.

## Etapa 7 — Distribuição e performance (P1/P2)

### R21 — F27 / E11-03 — não executado

Faltam `svgo.config`, pipeline reproduzível, regressão visual e orçamento bruto/gzip/Brotli. Adicione gate CI e consumidor que prove que importar uma bandeira não baixa as demais.

### R22 — F28 / E11-01 — não executado

`LINE_HEIGHT` continua duplicado entre TS e CSS; faltam benchmark 100/1k/10k e teste browser de alinhamento <=1 px/zoom. Defina fonte única e medições determinísticas.

### R23 — F28A / E11-02 — não executado

`MaxInputTextArea.performance.test.ts:70-81` ainda exige wall clock `<1500ms`. Remova esse limite da suíte comum; mantenha cardinalidade/coalescência/cleanup e benchmark temporal separado e informativo.

### R24 — F29 / E11-04 — não implementado

`src/index.ts` ainda injeta UnoCSS, `vite.config.ts` injeta CSS no entry raiz e `package.json` marca o JS raiz como side effect. O build gera 772,44 kB e apenas `.d.ts` por componente; os imports granulares falham. Gere entries JS/tipos reais, mapa explícito de exports, resolver canônico e CSS global opt-in. O fixture granular deve reduzir pelo menos 50% frente ao baseline de 477.773 bytes e não carregar módulos/CSS alheios.

### R25 — F30 / E11-05 — não executado

Wildcards apontam para arquivos inexistentes; o teste de exports ignora granularidade; o consumidor cobre só três entries, injeta MaxUse local e usa `--legacy-peer-deps`. Substitua por mapa público estrito e valide `.`, `/stores`, `/styles`, `/preset`, `/resolver`, componentes, CSS e temas em Node/TS/Vite/SSR. Integre ao `verify`/CI. Corrija `docs/THEME.md`, que ainda promete Aura automático, e execute os exemplos contra o tarball.

## Etapa 8 — aceite obrigatório

1. Corrija todos os 60 erros e 8 warnings de lint sem executar lint mutante sobre trabalho não revisado.
2. Remova as cinco violações de `git diff --check` e qualquer debug/artefato gerado.
3. Em checkout sem pacotes irmãos: `npm ci`, `npm ls --all`, checks de lock/nome, type-check de produção e testes.
4. Execute testes focais e `npm run test` ao menos duas vezes; zero falhas, warnings ou comportamento flutuante.
5. Execute cobertura com thresholds mínimos 85/76/84/89 e warning traps reais.
6. Execute lint, build, budgets e inspeção de exports/side effects/sourcemaps/CSS.
7. Instale apenas o tarball em consumidores Node/TS/Vite/SSR com e sem peers opcionais, sem `--legacy-peer-deps`.
8. Execute browser tests para teclado/foco, modais/stack, viewports/zoom, gráficos/mapas, virtualização e tabela.
9. Anexe matriz `Rxx → Exx → owner → arquivos → testes → resultado`, métricas antes/depois, riscos e rollback.

Somente declare conclusão quando os 25 blocos estiverem fechados e todos os gates passarem. Não marque item parcial como concluído por existir código ou teste nominal.
