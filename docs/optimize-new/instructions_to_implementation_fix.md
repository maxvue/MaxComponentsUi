# Prompt de correção das implementações incompletas

## Missão

Corrija exclusivamente os desvios confirmados nesta revisão da execução de `docs/optimize-new/instructions_to_implementation.md`. Os 72 checkboxes do prompt original não constituem evidência de conclusão: há gates vermelhos, um pacote não reproduzível, implementações parciais e uma regressão funcional.

Use subagentes especializados em Vue/TypeScript, testes/toolchain, acessibilidade/UX, UI/design system e performance/distribuição. Antes de editar cada bloco, leia o `description.md` e o `plan.md` original dos IDs citados, reproduza o desvio e preserve os comportamentos que já passaram. Cada bloco tem um único owner; serialize blocos que compartilhem SFC, helper, manifesto ou configuração.

Trabalhe em worktree isolada sob `.worktrees/`. Não altere a árvore principal, não publique e não faça commit, merge ou push sem autorização. Todo defeito deve ganhar teste que falhe pela razão correta antes da correção. Não marque um item como concluído sem anexar comando, resultado e evidência contra todos os critérios de aceite do plano.

## Estado auditado e gates bloqueadores

Base revisada: `c03817b8`, comparada com `cd2d2da2`.

- `npm run type-check`, `npm run lint:check`, `npm run test` e `npm run build` passaram na worktree com o pacote irmão disponível.
- `npm run type-check:test` falhou com 13 erros em `MaxButtonConfirm.test.ts`, `MaxIconButton.test.ts`, `useAsyncState.test.ts`, `iconIdb.test.ts`, `iconCachePersistence.test.ts` e `useListMenus.Store.test.ts`. Consequentemente, `npm run verify` está vermelho.
- `npm ls --depth=0` falhou com `ELSPROBLEMS`: `@maxvue/max-use@2.0.0 invalid: file:../MaxUse`.
- Em checkout isolado, `npm ci --ignore-scripts` terminou, mas deixou MaxUse inválido/ausente; `npm run build` falhou com dezenas de `TS2307` para `@maxvue/max-use`.
- O verificador de tarball passou apenas porque injeta novamente `file:../MaxUse`, usa `--legacy-peer-deps` e testa somente `.`, `/preset` e `/resolver`.
- `npm run test:coverage` apresentou resultado não determinístico entre execuções: uma falhou em `MaxCreditCard.test.ts` e outra passou com warnings inesperados. A configuração ainda permite warnings e reduziu thresholds frente ao baseline do plano.
- O build atual produz `dist/index.es.js` com aproximadamente 706 kB e `dist/style.css` com aproximadamente 334 kB; o entry raiz ainda injeta CSS e não existem entries JavaScript por componente.

## Etapa 1 — Restaurar reprodutibilidade e gates técnicos (P0)

### F01 — E01-02, E01-03 e E01-05: pacote depende da topologia local

**Evidência:** `package.json` e `package-lock.json` mantêm `@maxvue/max-use: file:../MaxUse`; aliases em `vite.config.ts` e `vitest.config.ts` apontam para `../MaxUse/src/index.ts`. `scripts/check-lockfile.mjs` não rejeita `file:../MaxUse` e não compara requisitos do manifesto e lock nos dois sentidos. Faltam `engines` e `packageManager`.

**Causa-raiz:** o lock e os gates foram construídos sobre um pacote irmão linkado, e o verificador foi deliberadamente adaptado à mesma topologia que deveria detectar.

**Correção obrigatória:** usar uma faixa publicada e compatível de MaxUse. Se a versão necessária ainda não estiver publicada, falhar explicitamente e registrar o bloqueio externo; não substituir por outro caminho local, Git ou cast. Remover aliases para fonte irmã, regenerar o lock em checkout sem repositórios irmãos, declarar runtime suportado e fazer o guard rejeitar qualquer `file:`, link, caminho absoluto ou chave externa. Comparar dependencies/devDependencies/peerDependencies com o lock nos dois sentidos. Validar o tarball com e sem peers opcionais, sem `--legacy-peer-deps`.

**Regressão/gates:** fixtures negativas para `file:../MaxUse`, caminho absoluto e entrada extra; duas instalações isoladas; `npm ls --all`; type-check, build e import do tarball sem diretório irmão.

### F02 — E01-04 e E12-02: suíte tipada e aceite global falsamente verdes

Corrigir os 13 erros TypeScript nos testes com tipos e mocks fiéis, sem `any`, `@ts-ignore` ou casts abrangentes. Tornar warnings inesperados falhas de teste, estabilizar `MaxCreditCard.test.ts` sob cobertura e restaurar no mínimo os thresholds do plano: statements 85, branches 76, functions 84 e lines 89. O `verify` e o workflow de CI só podem passar quando `type-check:test`, cobertura e consumidor empacotado passarem.

**Regressão/gates:** `npm run type-check:test`, `npm run test` repetido, `npm run test:coverage`, `npm run verify` e workflow equivalente em checkout limpo. Não aceitar flutuação entre execuções nem warnings fora de allowlist pontual e justificada.

## Etapa 2 — Corrigir contratos compartilhados de formulário (P1/P2)

### F03 — E02-02: sentinela ambígua em `useMirroredModel`

`src/helpers/useMirroredModel.ts` usa `undefined` simultaneamente como valor canônico legítimo e ausência de valor. Separar presença e valor (`hasLastCanonical` ou sentinela única). Testar `T` contendo `undefined`, emissão local, round-trip equivalente e mudança externa posterior.

### F04 — E03-01: compatibilidade `.p-*` mascara acoplamento interno

O guard de `tests/architecture/legacyClassUsage.test.ts` allowlista arquivos inteiros e aceita qualquer `.max-*`. Migrar seletores internos ainda primários em `MaxInputIconPicker`, `MaxTable`, `MaxInputFileUpload`, `MaxTopToolbar` e `MaxTagSelect` para anatomia canônica `.max-*`; manter `.p-*` apenas como alias público documentado. Trocar a allowlist por ocorrência/seletor com justificativa. O guard deve falhar para uma nova dependência interna mesmo dentro de arquivo já compatível.

### F05 — E03-02: atributos nativos permanecem no wrapper

`InputBase` compõe IDs/ARIA, mas não separa `rootAttrs` de `controlAttrs`; componentes como `MaxInputText` deixam `name`, `autocomplete`, `maxlength` e `inputmode` cair no wrapper. `MaxInputToggle` não encaminha corretamente `disabled`, `name` e `required`. Implementar classificação única, `inheritAttrs: false` e encaminhamento ao owner focável em todas as famílias de input.

**Regressão:** matriz das famílias de formulário verificando atributo no controle, ausência no wrapper, label click, submit/autofill, required e disabled.

### F06 — E03-03: validação compartilhada migrou apenas metade do escopo

Migrar `MaxInputCpfCnpj`, `MaxInputCep`, `MaxInputCreditCard` e `MaxInputCreditCardDate` para a mesma política já usada por Text/Number/Chips/ColorPicker, preservando máscara e estado completo/incompleto. Testar os oito componentes para mount sem erro, blur/submit, correção, reset externo e formato incompleto.

## Etapa 3 — Unificar overlays, modal stack e camadas (P1/P2)

### F07 — E04-02: outside-pointer e cleanup duplicados

Há motores locais em `MaxInputAutoComplete`, API, `MaxInputDatePicker`, `MaxTagSelect`, `MaxPopoverMenu`, `MaxUserSection` e `MaxBaseOverlay`. Consolidar pointer externo, Escape, retorno de foco, scroll e teardown em uma primitiva única, sem impedir o clique legítimo no destino. Testar stack, clique-through, scroll ancestral e contagem zero de listeners após fechar/desmontar.

### F08 — E04-03: `before-close` por evento não cancela fechamento

`MaxModal.vue` emite `before-close` e fecha incondicionalmente; o teste atual consagra esse defeito. Criar um único `requestClose(reason)` cancelável/assíncrono para botão, Escape, backdrop, API e model, com adaptador legado e proteção de geração. Testar cancelar, adiar, autorizar e reabrir durante espera.

### F09 — E04-04: modais especializados competem por foco e scroll lock

`MaxInputIconPicker`, `MaxInputMarkdown`, `MaxImage` e `MaxTopMenuSearchBar` ativam traps, Escape e locks independentes. Integrá-los ao stack canônico: apenas o topo contém Tab e recebe Escape; a camada inferior retoma ownership ao fechar o topo; locks ficam balanceados e o foco retorna em cadeia.

### F10 — E04-05: nomes acessíveis podem ficar órfãos

Slots de header em `MaxModal` e `MaxPopover` substituem o nó que possui o ID usado em `aria-labelledby`; `MaxBaseOverlay` permite `role="dialog"` sem nome. Usar wrapper de título estável ou contrato explícito de ID, validar referências externas e fornecer label/fallback diagnosticável. Testar slot, `noHeader`, ID externo inexistente e múltiplas instâncias.

### F11 — E04-06 e E04-07: runtime ignora tokens e clamp vertical

Remover literais de z-index em `MaxModal`, `MaxBaseOverlay` e `MaxDrawer` em favor da fonte única de tokens/offset contextual. Em `MaxPopover`, aplicar clamp vertical com margem/safe area, placement/seta coerentes e scroll interno. Testar CSS computado e hit-testing com tokens sobrescritos, além de viewport 280/320 px, landscape e zoom 200%.

## Etapa 4 — Corrigir concorrência assíncrona e seleção (P1/P2)

### F12 — E05-06 e E05-07: loading/retry do select é inalcançável

`MaxInputSelect.toggle()` só abre o Teleport depois de aguardar `before_show()`, portanto loading e erro inicial não aparecem e `retryLoad()` fica inacessível. Abrir/renderizar o estado antes da espera, compartilhar a promessa em ativações concorrentes e cancelar somente por ação explícita. Testar promise controlada, duas ativações/uma chamada, erro+retry visíveis, resolução e ausência de stale update.

### F13 — E05-07: `delay` do autocomplete API não participa do contrato remoto

Aplicar `minLength` e `delay` à busca remota com debounce, geração e abort, ou remover/deprecar a prop com migração explícita. Testar fake timers: abaixo do mínimo zero requests, rajada uma request após delay e resposta obsoleta ignorada.

### F14 — E06-01 e E06-02: semântica de listbox incompleta

Nos autocompletes, `aria-selected` não pode representar o item apenas destacado; destaque pertence a `aria-activedescendant`. No virtual scroller genérico, remover o modo listbox incompleto ou exigir contrato integral de foco, IDs, seleção e teclado. Testar ArrowDown sem Enter, seleção posterior e active descendant sempre montado.

### F15 — E06-03 e E08-04: botão interno do TagSelect ignora disabled e nome

No modo botão, propagar `disabled` e nome contextual ao `MaxIconButton`, ou transformar o conjunto em um único trigger nativo. Não aceitar fallback “Botão de ação”. Testar Tab/click desabilitado, nome acessível habilitado e zero warning.

### F16 — E06-05 e E06-06: contraste e índice virtual agrupado

O par dark de seleção (`#178DA5`/`#00202e`) mede aproximadamente 4,325:1; ajustar tokens para pelo menos 4,5:1. Em `MaxTagSelect`, converter `highlightedIndex` selecionável no índice de `flattenedItems`, incluindo headers, antes do scroll virtual. Testar todos os estados light/dark e mais de 500 itens em múltiplos grupos.

## Etapa 5 — Endurecer upload, crop e interfaces gráficas (P1/P2)

### F17 — E07-02 e E07-03: reconciliação e callbacks tardios de upload

Em `MaxInputFileProject`, reconciliar atualizações de `props.files` por identidade sem apagar itens locais queued/uploading e capturar rejeições do auto-upload. Em `MaxInputFileUpload`, invalidar a geração no unmount, remover handlers antes de abortar e impedir toda emissão/mutação tardia. Testar atualização do parent durante upload, erro automático sem `unhandledRejection`, retry único e callbacks manuais depois do unmount.

### F18 — E07-06: crop ainda duplica base64 e aceita `toBlob(null)`

Tornar Blob o payload canônico/default e `includeDataUrl` opt-in. `toBlob(null)` ou exceção de codificação deve manter o editor aberto, mostrar erro recuperável e emitir zero crop/edit. Testar sucesso com uma codificação e ausência de data URL por padrão.

### F19 — E07-04 e E07-05: ações não nativas e alternativas invisíveis

Trocar a área acionável de `MaxInputFile` por button/label nativo associado a input visualmente oculto. Tornar alternativas de `MaxChart` e `MaxMaps` perceptíveis quando recebem foco, ou oferecer painel/toggle acessível; não deixar controles focáveis permanentemente `.sr-only`. Validar teclado real, foco visível, nome e disabled.

## Etapa 6 — Eliminar regressão de tabela e completar identidade visual (P1/P2)

### F20 — E08-05: Enter ordena tabela duas vezes

O botão sortable de `MaxTable` possui `@click` e `@keydown.enter`; Enter nativo também gera click. Remover handlers redundantes e confiar na ativação nativa. Teste de browser deve pressionar Enter e Espaço reais e observar exatamente uma mudança/emissão.

### F21 — E09-01: IDs globais e anúncios duplicados

Gerar IDs por instância em `MaxAuthCard`. Em `MaxToast`, escolher um único owner de live region por mensagem; não combinar container `aria-live`, item `role=status/alert` e regiões internas que repetem anúncio. Testar duas instâncias e contagem de anúncios por sucesso/erro.

### F22 — E09-02: retry perde a chave lógica de loading

`useLoading.Store.error()` apaga a chave, e `retry()` não a restaura; um callback que chama `end(chave-logica)` deixa loading preso. Preservar/restaurar a identidade pública durante erro e retry, com gerações concorrentes seguras. Testar retry seguido de `end` pela mesma chave e múltiplos targets.

### F23 — E10-03 e E10-04: texto e foco não foram inventariados

Migrar usos remanescentes de `var(--background-650)` como conteúdo habilitado para tokens semânticos com contraste calculado. Criar gate que inventarie todos os elementos/componentes focáveis e exija `:focus-visible` canônico; o teste atual cobre poucos arquivos. Validar claro/escuro, disabled, alto contraste e foco por teclado.

### F23A — E10-02: teste de contraste não acompanha os tokens reais

O teste atual calcula pares hardcoded e não falha quando o CSS muda; `MaxButton` ainda contém hover WhatsApp literal. Tokenizar o estado e fazer o teste resolver o CSS compilado/computado nos dois temas. Uma mutação deliberada do token para contraste inválido deve provar que o gate falha.

### F24 — E10-09: reduced motion cobre apenas parte dos SFCs

Há dezenas de SFCs com transition/animation/transform sem tratamento de `prefers-reduced-motion`. Criar inventário automatizado, migrar todos os casos aplicáveis e justificar exceções pontuais. Testar CSS compilado e comportamento, não somente presença textual.

### F25 — E10-10: playground declara cobertura artificial

`playground/src/catalog.ts` retorna 100% sem comprovar cenários renderizáveis, não existe `playground/src/scenarios/` e o App cobre apenas fração do catálogo. Criar um cenário real por componente/estado obrigatório, validar o vínculo catálogo→cenário→render e remover `<style>` duplicado. Tratar warnings e orçamento dos chunks do playground.

### F26 — E10-08: anatomia de tabela ainda duplicada

`MaxTable.vue` repete regras já oferecidas pelo mixin compartilhado. Remover a duplicação e criar guard estrutural que impeça divergência entre tabelas.

## Etapa 7 — Concluir distribuição e budgets (P1/P2)

### F27 — E11-03: otimização de SVG sem gate de orçamento

Adicionar configuração SVGO reproduzível, teste visual das bandeiras e script versionado que mede bytes bruto/gzip/Brotli. O orçamento deve falhar em regressão e a fixture consumidora não deve baixar bandeiras não alcançadas.

### F28 — E11-01: lista virtual sem benchmark/medição de alinhamento

Criar benchmark versionado para 100/1k/10k linhas, teste browser de alinhamento com tolerância de 1 px e zoom. Eliminar duplicação de `LINE_HEIGHT` entre TS e CSS por uma fonte única verificável.

### F28A — E11-02: teste de performance usa limiar temporal instável

Remover a asserção `<1500ms` da suíte comum de `MaxInputTextArea`; manter como gate determinístico a cardinalidade de medições/coalescência/cleanup. Se tempo for útil, registrá-lo em benchmark separado, informativo e com ambiente documentado.

### F29 — E11-04: modularização granular não foi implementada

`src/index.ts` ainda importa `virtual:uno.css`, `vite.config.ts` injeta CSS no `index.es.js`, `sideEffects` marca o entry raiz e não há entries JS por componente. Implementar subpaths canônicos como `/components/MaxButton`, tipos alinhados, resolver apontando ao subpath e CSS global opt-in conforme o plano. Não publicar wildcards que apontem para arquivos inexistentes. O chunk granular deve reduzir ao menos 50% frente ao baseline de 477.773 bytes do achado e não conter CSS/módulos alheios.

### F30 — E11-05: exports e consumidor são verificados superficialmente

Os wildcards atuais `./dist/components/*` e `./*` não são validados e podem resolver somente declarações sem JS. Fazer o teste percorrer todos os subpaths documentados e rejeitar desconhecidos. O consumidor de tarball deve compilar/importar `.`, `/stores`, `/styles`, `/preset`, `/resolver` e componentes granulares em Node, TypeScript, Vite e SSR, além de importar CSS/temas. Integrar esse teste ao `verify` e CI.

Corrigir também a documentação contraditória: `docs/THEME.md` ainda afirma aplicação automática de preset PrimeVue Aura, incompatível com a independência declarada. Os exemplos documentados devem ser executados contra o tarball.

## Etapa 8 — Aceite global obrigatório

Execute tudo em checkout limpo sem `../MaxUse` ou outros pacotes irmãos disponíveis:

1. `npm ci` e `npm ls --all`.
2. Checks de nomes, lock e contratos arquiteturais.
3. `npm run type-check` e `npm run type-check:test`.
4. ESLint e Stylelint sem mutação.
5. Testes focais de todos os F01–F30 e `npm run test` repetido.
6. `npm run test:coverage`, sem warnings inesperados e com thresholds não inferiores ao baseline.
7. `npm run build`; inspeção de exports, sourcemaps, side effects, CSS e budgets bruto/gzip/Brotli.
8. Instalação do tarball em consumidores Node/TS/Vite/SSR, com e sem peers opcionais e sem flags que ocultem conflitos.
9. Testes browser de teclado, foco, overlays, viewport/zoom, alternativas gráficas e tabelas.
10. `git diff --check`, revisão integral do diff e ausência de artefatos gerados incidentais.

Somente então atualize os status. O handoff final deve trazer matriz `Fxx → Exx → owner → arquivos → testes → resultado`, métricas antes/depois, bloqueios externos reais, riscos e rollback. Uma falha de gate impede declarar conclusão global.
