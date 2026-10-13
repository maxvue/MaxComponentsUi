# Plano de execução — Prop `slim` no MaxButton

## 1. Identificação e resultado da investigação

- Data: 13/10/2026.
- Projeto: `@maxvue/max-components-ui` (`package.json`: `1.1.2`).
- Worktree/branch: `wt-65b8ee1d`, já alocada pelo MaxCode.
- Raiz: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-65b8ee1d`.
- HEAD investigado: `61a0417935b3b780ebbcd6176f14158c6fd61f67`; status inicial limpo.
- Especificação previamente elaborada: [spec.md](./spec.md).
- Estado: planejamento para revisão; não autoriza execução, instalação ou integração Git.

**Resposta ao pedido:** `MaxButton` não possui a prop `slim`. A execução futura deve adicioná-la para reduzir o espaçamento vertical do botão com texto. `size="small"` não substitui essa opção: também modifica fonte e espaçamento horizontal.

## 2. Requisitos, escopo e preservação

### Requisitos

- R1: adicionar `slim?: boolean`, com padrão `false`, reconhecida por Vue e pela API TypeScript pública.
- R2: ativação reduz exclusivamente o padding vertical, mantendo aparência atual quando ausente ou falsa.
- R3: funcionar com texto em `label` ou slot e compor com tamanhos e variantes não link; não alterar ícones nem navegação/ações/eventos.
- R4: preservar a geometria de `link` e do fallback para `MaxIconButton`.
- R5: documentar sintaxe, padrão, efeitos e limites; disponibilizar comparação no playground.
- R6: comprovar estilos reais no navegador e preservar foco e legibilidade.

### Decisões propostas de baixo impacto

1. Classe semântica `max-button-slim`, sem seletor global `[slim]`.
2. Regra scoped `.max-button.max-button-slim:not(.max-button-link)` com **somente** `padding-block: 0.25rem`, depois das regras de tamanho. Metade do padding padrão; menor que `0.35rem` do pequeno e `0.65rem` do grande.
3. Sem altura fixa, mudança de fonte, padding horizontal, tamanho de ícone, `!important` ou ocultação de overflow.
4. `size` continua definindo fonte e padding horizontal. `small`/`sm` e `large`/`lg` mantêm seus aliases; tamanho numérico continua sendo o caminho legado do ícone.
5. `link` mantém o estilo atual, inclusive com `size`; essa exceção evita aumentar padding em uma variante originalmente sem padding próprio.
6. Sem `label` e sem slot padrão, preservar o fallback atual. Não redesenhar um botão quadrado de ícone para atender a uma opção vertical do botão textual.
7. Não prometer altura absoluta: conteúdo, fonte, ícones grandes e dimensões externas determinam o resultado final. A redução de padding é garantida pela proposta; dimensões forçadas pelo consumidor podem impedir redução da altura externa.

Essas escolhas são propostas revisáveis, não resultados de implementação já comprovados. Não foi necessária pergunta: o pedido define o efeito e os demais contratos podem ser preservados pelo código existente.

### Exclusões

Não modificar API de `MaxButtonConfirm`, aparência de `MaxIconButton`, estilos de `InputBase`, stores, helpers, temas globais, exports, resolver, dependências ou lockfiles. Não corrigir documentação histórica fora do trecho necessário. Não fazer instalação, migração, publicação, commit, merge, push, troca de branch ou criação/remoção de worktree.

## 3. Evidências verificadas por leitura

| Local | Fato confirmado |
|---|---|
| `src/types/index.ts:66–145` | `MaxButtonsType` não declara `slim`; herda base com `@vue-ignore`. A nova prop deve ficar na interface específica para gerar declaração runtime. |
| `src/components/MaxButton.vue:1–30` | Renderiza `<button>` com `label` **ou** slot padrão. Sem ambos, delega props para `MaxIconButton`. |
| `src/components/MaxButton.vue:43–51,80–88` | Defaults e classes não incluem `slim`; classes semânticas de tamanho já existem. |
| `src/components/MaxButton.vue:119,299–315` | Paddings reais e ordem dos seletores confirmados. O seletor link vem antes dos tamanhos: preservar também essa composição atual, sem tentar corrigir sua precedência. |
| `src/components/MaxButton.vue:63–78,90–108` | Tipo HTML e resolução legada de ícone; fluxo é rota, senão ação, senão evento `click`. Preservar. |
| `src/components/MaxIconButton.vue:63,79–82,168–217` | Tipo compartilhado; dimensão quadrada calculada por `size`, padding zero, foco e expansão de área de toque. Não requer edição. |
| `src/components/MaxButtonConfirm.vue:1–57` | Wrapper com contrato próprio, não alvo desta implementação. |
| `src/index.ts:22,303`; `package.json:80–83` | API e subpath de `MaxButton` e tipos já exportados. |
| `COMPONENTS.md:69–94` | Referência canônica do botão, sem `slim`; descrição antiga de PrimeVue e condição incompleta sobre slot. Corrigir essas duas frases no trecho tocado. |
| `playground/src/scenarios/buttons-main.vue` | Demonstração existente de MaxButton normal, disabled e danger. |
| `playground/vite.config.ts:97–101` | Import público da biblioteca resolve para `src/index.ts`, permitindo demonstração do fonte. |
| `tests/components/MaxButton.test.ts` | Testes atuais e stubs locais de ícones; `goToRoute` é mockado. |
| `tests/setup.ts:41–74` | `getComputedStyle` é mockado; happy-dom não serve de prova de altura real. |
| `vitest.browser.config.ts`; `tests/browser.setup.ts` | Chromium com Playwright; inclui `tests/browser/**/*.browser.ts`; Pinia inicializada, Axios com adapter de teste e fetch de ícones interceptado. |
| `tests/browser/FocusVisibleInventory.browser.ts` | Padrão existente de `createApp`, temas, foco e limpeza de fixture. |
| `tsconfig.json`; `tsconfig.test.json` | Tipagem de fonte e testes; novo arquivo browser será incluído na checagem de testes. Playground não é incluído por esses arquivos. |
| `package.json:556–582` | Comandos de validação e gate completo de pré-release existentes. |
| `scripts/check-lockfile.mjs` | Gate de integridade rejeita dependências locais e inconsistências do manifesto/lockfile. |
| `scripts/check-playground-bundle.mjs` | Executa build Vite do playground e inspeciona orçamento dos chunks em `playground/dist`; não é apenas leitura de artefatos. |
| `.gitignore:68–69` | `.worktrees/` e `.max-code-worktrees/` já ignoradas. |
| `node_modules/@maxvue/max-use/package.json`; `dist/index.d.ts` | MaxUse `1.1.47` e assinatura de `goToRoute` disponíveis; helper atual suficiente. |

Biblioteca usada é o próprio repositório MaxComponentsUi; manter componentes Max na demonstração. Não há estado novo, GET, cache ou salvamento que justifique criar store. MaxPinia permanece a escolha para eventuais novas stores, mas não adicionar uma nem instalar peer opcional apenas para CSS. Preservar helpers MaxUse existentes.

Consulta oficial: https://vuejs.org/api/sfc-script-setup e https://vuejs.org/guide/components/props, via Context7. Confirmam `withDefaults` e sintaxe booleana por presença/binding. A referência é da API Vue 3, não uma certificação específica da RC usada (`3.6.0-rc.10` no manifesto/lockfile).

**Não verificado nesta sessão:** compilação, testes, altura renderizada, disponibilidade de Chromium, identidades efetivas de Axios/Pinia em execução e integridade completa das dependências. Nenhum comando de teste, gate, build ou servidor foi executado.

Achados fora do escopo estão registrados em `docs/notifications/wt-65b8ee1d/notifications/max-components-ui-documentacao-divergente.md`. A ausência da capacidade solicitada está registrada em `docs/notifications/wt-65b8ee1d/notifications/max-components-ui-max-button-slim.md`.

## 4. Etapas executáveis

### T0 — Admissão e preflight por leitura

**Dependência:** autorização de Execute; nenhuma implementação nesta sessão Plan.

1. Ler este plano e a spec na primeira admissão. Confirmar raiz e branch; não mover para outra worktree.
2. Conferir alterações locais e trabalho já realizado. Não sobrescrever contribuições do usuário; ajustar execução às lacunas reais.
3. Ler scripts e eventuais prehooks atuais, configurações Vitest, setups, políticas de console e scripts dos gates escolhidos. Confirmar que artefatos e caches ficam na worktree e que servidores/portas não pertencem a outras sessões.
4. Conferir por leitura symlinks/resolução efetiva de Vue, Pinia, Axios e MaxUse, incluindo instâncias transitivas; o `dedupe` declarado não prova sozinho identidade única. Não usar referência local a MaxUse nem adicionar dependência para contornar falha.
5. Verificar que fixtures não acessam banco, filas, storage ou cache de aplicações compartilhadas. O adapter Axios do browser e mocks existentes precisam atingir as instâncias realmente usadas. Sem prova de isolamento, bloquear testes dependentes; não copiar `.env`, rodar resets/migrations ou usar worktree/transação como prova suficiente.
6. Confirmar Node/npm compatíveis com `engines`, dependências e Chromium já disponíveis. Ausência é bloqueio com próxima ação, não autorização de instalar.

**Conclusão:** worktree correta, revisão factual anotada e harness apto ou bloqueio explícito. Na execução, rodar `npm run check:lockfile` antes da implementação dependente. Gate falhado bloqueia progresso dependente; não usar bypass, `ignoreConfig`, comando alternativo para fugir de prehook ou remoção de prehook.

### T1 — API e implementação

**Arquivos existentes de escrita:** `src/types/index.ts`, `src/components/MaxButton.vue`.

1. Adicionar `slim?: boolean` diretamente em `MaxButtonsType`, com comentário sobre compactação vertical do MaxButton textual, sem efeito no fallback de ícone.
2. Adicionar `slim: false` ao `withDefaults` do MaxButton.
3. Incluir `'max-button-slim': props.slim` no cálculo de classes.
4. Implementar o seletor e valor definidos na seção 2 após os tamanhos; não alterar regras atuais.
5. Deixar tags de abertura do SFC tocado em linha única, conforme AGENTS.md. Preservar indentação de quatro espaços no script, aspas simples e ponto e vírgula.
6. Revisar por leitura diff e contratos antes de avançar; não executar testes entre microedições.

**Conclusão:** API, default e classe coerentes; nenhum efeito adicional em `MaxIconButton` apesar de ele consumir o tipo ampliado. Sem novos helpers/stores ou exports.

### T2 — Testes unitários e browser

**Arquivo existente:** `tests/components/MaxButton.test.ts`.
**Arquivo novo:** `tests/browser/MaxButtonSlim.browser.ts`.
**Dependência:** contrato de T1; leitura de padrões existentes para o harness.

Unitários, com asserções concretas:

- `slim` ausente/false não adiciona classe; true adiciona; `setProps` alterna a classe; o elemento nativo não recebe atributo `slim`.
- Uma fixture de template com `<MaxButton label="Salvar" slim />` prova conversão booleana por presença.
- Texto via slot recebe compactação; combinações `small`/`sm`/`large`/`lg` mantêm suas classes e resolução do ícone; caso numérico preserva tamanho legado.
- Desabilitado/loading realmente desabilitam o elemento; click/action/route e tipo HTML preservam o contrato com slim ativo. Manter testes antigos.
- Montar o fallback real, com Pinia e stub somente do ícone quando necessário, e verificar que continua sendo MaxIconButton, sem classe compacta textual. Não considerar `wrapper.exists()` prova suficiente.

Browser, com CSS real e fixtures descartáveis:

- Seguir padrão `createApp` + `h`, Pinia e import de temas; limpar app, host, tema e zoom após cada teste.
- Criar pares idênticos padrão/compacto com alinhamento que não estique altura, mesma fonte, mesmo texto, sem dimensões externas. Comparar `getBoundingClientRect` e `getComputedStyle` após renderização estável, com espera limitada por conteúdo necessário (especialmente ícone); não usar sleeps/status polling sem informação nova.
- Cobrir tamanho padrão, aliases pequeno/grande; sólido, outlined, text e dashed. Altura compacta menor, padding vertical computado correspondente a `0.25rem`, padding horizontal/fonte/largura e ícone preservados, com tolerância subpixel explícita.
- Com `link` e tamanhos, comparar pares e exigir igualdade da geometria anterior. Com fallback só ícone, comparar dimensão e área de toque existentes, sem alterações de CSS.
- Incluir texto por slot, ícone esquerdo/direito, loading e ícone maior. Verificar ausência de recorte sem forçar altura fixa.
- Claro/escuro e zoom 200%: foco por Tab continua visível, texto e ícone legíveis; testar ativação por teclado e disabled pertinente. Não presumir que um botão compacto satisfaz automaticamente dimensões mínimas de alvo em todo layout; inspecionar espaçamento entre controles no playground.

**Conclusão:** todos os testes do bloco escritos, sem remover asserções nem relaxar política de console. Sucesso ainda depende da rodada agrupada T4.

### T3 — Documentação e demonstração

**Arquivos existentes:** `COMPONENTS.md`, `playground/src/scenarios/buttons-main.vue`.
**Dependência:** contrato proposto em T1.

1. Inserir linha de prop `slim`, tipo boolean, default false e descrição da compactação vertical na seção MaxButton.
2. Corrigir somente a abertura dessa seção: botão nativo Vue; fallback quando não há `label` **nem slot padrão**. Não espalhar mudanças a outras seções históricas.
3. Explicar diferença para `size`, combinação com aliases, exclusões de link/fallback, ausência de altura fixa e prioridade de CSS/dimensões consumidoras. Não apresentar a função como já publicada em npm.
4. Exemplos com padrão, `slim`, `:slim="false"`, `size="small" slim` e slot; tags de abertura em linha única. Para boolean false, alertar que string sem binding não é boolean false.
5. No bloco MaxButton do cenário buttons-main, manter exemplos existentes e acrescentar comparações lado a lado com/sem slim, ícone, tamanhos e slot; usar componentes públicos Max, sem novo estado/store ou CSS global.

**Conclusão:** documentação e demonstração correspondem ao contrato, sem promessa de compactação em link/ícone ou altura de 20/22px. T2 e T3 podem ser delegadas futuramente após T1, somente com arquivos distintos; contexto mínimo deve referenciar estes documentos e a tarefa específica. Não delegar nem iniciar implementação nesta sessão.

### T4 — Validação agrupada, correção e revisão

**Dependência:** T1–T3 completos; T0 aprovado. Implementar todo o escopo e seus testes antes desta rodada.

Comandos confirmados no `package.json`, executados na raiz da worktree durante Execute:

```bash
npm run test
npm run type-check:test
npm run lint
npm run build
npm run test:browser
npm run check:playground:bundle
```

- A suíte completa unitária já inclui MaxButton: não repetir teste focal equivalente aprovado sem causa. `build` já executa `vue-tsc` do fonte; não executar `npm run type-check` adicional na mesma revisão aprovada.
- O gate de bundle já executa build Vite do playground e mede chunks em `playground/dist`; não repetir esse build por comando direto. Ele verifica compilação/bundle do cenário, mas não equivale à checagem semântica de tipos do playground. Reconfirmar efeitos e isolamento no preflight.
- Registrar cada saída e falha. Diagnosticar falhas em lote (harness/bootstrap/resolução antes de repetir testes equivalentes); não corrigir baseline alheio sem causalidade e autorização.
- Após correções, revalidar checks falhados ou invalidados pela revisão alterada. Reaproveitar resultados aprovados somente quando a revisão factual pertinente permaneça válida. Repetir falha sem progresso exige diagnóstico, não nova tentativa idêntica.
- Revisão independente nos marcos API compartilhada/cascata CSS e na entrega: conferir tipo compilado, default, seletor/precedência, fallback e correspondência entre exemplos e código. Não exigir revisão por microedição.
- Revisão final do diff bruto, inclusive arquivos novos, com checks de escopo, compatibilidade e aceite. Não tratar julgamento como substituto de exit codes ou navegador.
- Para pré-release posterior, usar `npm run verify`, que agrega cobertura, browser, benchmarks, consumidores e segurança; não rodar os componentes isolados sobre a mesma revisão quando esse agregado for o fluxo escolhido. Esta entrega não autoriza release, comandos de publicação ou instalações pelos scripts de consumidores.

Manual: após conferir disponibilidade do host/porta do playground (`maxcomponents.test:5180`, strictPort), usar `npm run dev:playground` apenas em ambiente autorizado e isolado. Não matar processo de outra sessão. Abrir cenário buttons-main, comparar alturas com texto/ícones, pequeno/grande, claro/escuro, foco e zoom 200%. Se indisponível, registrar `manualPending` e próxima ação concreta: disponibilizar playground isolado e executar essa matriz. Não afirmar conclusão total com gate exigido pendente.

## 5. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência esperada | Testes/gates | Revisão pelo risco | Manual |
|---|---|---|---|---|
| T0 — integridade e isolamento | Dependências efetivas, scripts/prehooks e serviços conferidos; lockfile válido | `check:lockfile`, com exit code real | Interromper por gate falhado; sem bypass | Disponibilidade de Chromium/playground |
| T1/T2 — R1 | Prop tipada, default false, boolean por presença, ausência de vazamento no DOM, alternância reativa | Unitários + `type-check:test`, build com tipos do fonte e inspeção da declaração emitida | Tipo compartilhado não gera efeito indesejado no IconButton | — |
| T1/T2 — R2/R3 | Pares compactos mais baixos, mesmo padding horizontal/fonte/largura/ícone | Browser real e unitários de tamanhos/slots | Ordem e especificidade de CSS; conteúdo grande não cortado | Comparação visual no playground |
| T1/T2 — R4 | Pares link/fallback iguais; handlers/type/disabled/loading preservados | Unitários e browser, incluindo aliases | Não mudar seleção de ramo nem fluxo de ação | Link e botão só ícone permanecem como antes |
| T3 — R5 | Tabela, sintaxe e limites corretos; demonstração usando MaxButton | Revisão documental, gate de bundle | Não prometer versão npm publicada nem altura fixa | Cenário buttons-main renderiza comparações |
| T2/T4 — R6 | Foco visível, legibilidade e acionamento por teclado | Browser claro/escuro/zoom + lint | Não esconder overflow/foco; avaliar densidade/alvos | Sem recorte, foco visível e espaçamento entre ações |
| T4 — conjunto | Sem regressões atribuíveis, todos os checks exigidos vigentes | Suite completa, tipos, lint, build, browser, bundle | Diff bruto e revisão independente de entrega | Pendências impedem aceite integral |

## 6. Riscos, operação e recuperação

- **Cascata:** shorthand `padding` dos tamanhos pode sobrescrever regra compacta se mal posicionada. Resolver com ordem e seletor scoped explícito, sem `!important`.
- **API compartilhada:** adicionar prop ao tipo faz MaxIconButton reconhecê-la; manter no-op visual e testar ausência de vazamento/efeito. Não anunciar suporte funcional ali.
- **Ícones/conteúdo:** fonte e ícone podem impor altura maior. Não recortar nem reduzir ícone para forçar dimensões; o objetivo é menor padding.
- **Dimensões consumidoras:** CSS externo pode sobrepor compactação. Documentar limite; não lutar com estilos consumidores usando `!important`.
- **Acessibilidade:** menor altura exige inspeção de alvo e espaçamento; preservar foco. Não alterar área expandida do botão de ícone nem criar sobreposição de alvos para encobrir riscos.
- **Validação:** happy-dom e mocks não comprovam CSS real; Chromium é gate desta mudança visual. Ausência do browser mantém bloqueio, sem resultado verde substitutivo.
- **Impacto operacional:** nenhuma migração ou alteração de dado; não há credenciais/fornecedor externo a aceitar. Mocks não provam uma integração externa, mas nenhuma nova integração é pedida.
- **Recuperação:** se for necessário desfazer implementação futura, remover somente a prop/classe/regra e seus exemplos/testes desta tarefa com autorização, preservando mudanças de terceiros. Não usar reset destrutivo. Nenhuma integração/publicação foi autorizada.

## 7. Progresso, retomada e handoff

Durante **Execute**, e somente quando houver autorização para arquivos operacionais, registrar marcos em `docs/plans/wt-65b8ee1d/execution-state.json`. **Não criar esse arquivo nesta sessão Plan**, cujos destinos de escrita se limitam a spec, plano e notificações.

- Novos registros usam `version: 2`, SHA256 real do conteúdo de `plan.md`, tarefas T0–T4, estados, arquivos e revisões factuais de conteúdo.
- Cada tarefa registra `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`; revisions são hashes reais de conteúdo pertinente, nunca nomes de etapa, rótulos ou strings inventadas. Descrever quais arquivos/conteúdos entram no hash para permitir reprodução.
- `passed` exige exitCode 0; `failed` exige inteiro diferente de 0; `pending` não aceita exitCode. Registrar comandos realmente executados e **todas** as falhas, inclusive suíte completa. Não inferir aprovação/código de saída de `tool:end.ok`.
- Checks vazios, resultado ausente/desatualizado ou falha vigente impedem validação integral. Version 1 permanece compatível, mas não prova integralidade automaticamente. Registro autodeclarado não prova execução nativa nem detecta checks omitidos.
- Em retomadas, consultar trechos pertinentes em vez de reler tudo; comparar alterações reais e resultados vigentes, executar lacunas e manter decisões/dependências. Não reabrir decisões sem nova evidência ou mudança de requisito.
- Após marcos, comunicar progresso e limites. Em cancelamento, conservar resultados parciais e pendências. Handoff deve listar arquivos, validações, hashes/revisões e próxima ação para cada bloqueio/manualPending.
- Preservar esta worktree com trabalho pendente; limpeza e integração no MaxCode pertencem ao painel/usuário.

## 8. Revisão do plano

Escopo conferido contra o pedido: criar a prop ausente, sem executar a implementação nesta sessão. Preservação explicitada para tamanhos, ícones, link, fallback, eventos e estado atual. Arquivos existentes e novo teste diferenciados; spec precede o plano. Propostas de CSS/default têm critérios verificáveis. Dependências e limites do harness declarados, sem alegar testes aprovados. Achados laterais separados em notificações. Nenhum segredo ou dado pessoal necessário à entrega foi incluído.
