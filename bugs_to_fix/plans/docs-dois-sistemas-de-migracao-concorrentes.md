# Dois sistemas de controle de migração concorrentes e contraditórios no repositório

- **Categoria:** divergência
- **Severidade:** crítica
- **Arquivo(s):** `prime_vue_migration/status.yaml:1-120`, `status-primevue.migration.yaml:1-258`, `migration_executor.md:109-150`, `CLAUDE.md:15-30`
- **Domínio:** docs-qualidade-testes

## Problema

Existem **dois conjuntos completos e independentes** de arquivos de controle para a mesma
migração de independência do PrimeVue, cada um com seu próprio executor, sua própria
fonte de verdade e sua própria ordenação — e eles **discordam entre si**.

### Sistema A (documentado no `CLAUDE.md:15-30`)

| Arquivo | Papel |
|---|---|
| `status-primevue.migration.yaml` | 36 itens, campo `status` (`waiting`/`in_progress`/`done`/`blocked`) |
| `migration_executor.md` | fila numerada de 1 a 36 + registro de progresso |
| `migration_plans/` | 35 planos por componente |

### Sistema B (não mencionado em lugar nenhum do `CLAUDE.md`)

| Arquivo | Papel |
|---|---|
| `prime_vue_migration/status.yaml` | **38 itens**, campos `execucao`/`verificacao` (`Aguardando`/`Realizando`/`Concluído`) |
| `prime_vue_migration/execution.md` | protocolo próprio do executor |
| `prime_vue_migration/execute_in_use.md`, `execute_no_use.md`, `execute_primitive.md` | três executores adicionais |
| `prime_vue_migration/status_in_use.yaml`, `status_no_use.yaml`, `status_primitive.yaml` | três status adicionais |
| `prime_vue_migration/plans/` | planos numerados (`01-MaxBaseInput.md`…) |

O `prime_vue_migration/README.md:16` declara explicitamente que `status.yaml` é a
**"Fonte de verdade do progresso"** — o mesmo título que o `CLAUDE.md:19` atribui a
`status-primevue.migration.yaml`. Dois arquivos reivindicam ser a fonte de verdade única.

### Contradições concretas verificadas

**1. Arquiteturas incompatíveis.** O Sistema B introduz uma camada de primitivas base
(`src/components/base/MaxBaseInput.vue`, `MaxBaseOverlay.vue`, `MaxBaseSpinner.vue`,
`MaxBaseVirtualScroller.vue`) como Fase 0. Esses quatro arquivos **existem em disco** e
têm testes (`tests/components/base/*.test.ts`). O Sistema A não menciona nenhum deles —
`grep` por `MaxBaseInput|components/base` em `CLAUDE.md`, `INDEPENDENCIA-PRIMEVUE.md`,
`README.md`, `COMPONENTS.md`, `status-primevue.migration.yaml` e `migration_executor.md`
retorna **zero ocorrências**.

**2. O Sistema B está desatualizado em relação ao próprio código.** Os itens 1 a 5 de
`prime_vue_migration/status.yaml` estão todos com `execucao: Aguardando` /
`verificacao: Aguardando` (linhas 54-55, 66-67, 76-77, 88-89, 100-101), mas:
- os arquivos `src/components/base/*.vue` já existem;
- o git log do diretório mostra `f61277c1 refactor(vTooltip): diretiva v-tooltip sem PrimeVue`
  e `e9242d35 chore(migration): item 5 (vTooltip) verificado e aprovado` — ou seja, o item 5
  foi implementado **e aprovado**, mas o YAML continua dizendo "Aguardando".

**3. O Sistema A também diverge do Sistema B quanto ao estado do `InputBase`.**
`status-primevue.migration.yaml:16` marca `InputBase` como `done`, e
`migration_executor.md:163` registra a conclusão. Já
`prime_vue_migration/status.yaml:40` lista `src/components/InputBase.vue` como
**"intocável"**, afirmando que *"Já são PrimeVue-free e são a base do padrão da casa"* —
partindo do princípio de que o trabalho foi feito por fora do seu processo.

**4. Baselines de teste incompatíveis.** `prime_vue_migration/status.yaml:36` registra
baseline de *"609 passed, 18 failed, 7 test files failed (70 total)"*, enquanto o
`migration_executor.md:167` registra *"suíte completa (861/861)"* verde. Os dois números
descrevem o mesmo repositório em momentos diferentes, sem nenhuma referência cruzada.

**5. Critérios de conclusão diferentes.** O Sistema B define
`criterio_final: grep -rn "primevue\|@primeuix\|@primevue" src/` (linha 34), cobrindo
também `@primeuix/themes`. O Sistema A não define critério global equivalente e o
`src/styles/style.ts` continua dependendo de `@primeuix/themes`.

## Impacto

- **Risco de trabalho duplicado ou destrutivo.** Um agente que leia o `CLAUDE.md` segue o
  Sistema A; um agente que abra `prime_vue_migration/README.md` (que instrui:
  *"Leia `prime_vue_migration/execution.md` e execute"*) segue o Sistema B. Os dois podem
  reescrever o mesmo componente com arquiteturas diferentes — com `InputBase` ou com
  `MaxBaseInput` — e sobrescrever o trabalho um do outro.
- **Nenhuma fonte de verdade confiável.** Não há como responder "qual o progresso real da
  migração?" sem auditar o código, que é justamente o que os arquivos de status
  existiriam para evitar.
- **Componentes órfãos.** Os quatro `src/components/base/*.vue` existem, têm testes, e
  não estão documentados nem exportados no processo oficial. Ninguém sabe se devem ser
  usados, mantidos ou removidos.
- **Instruções do `CLAUDE.md` ficam incorretas.** Elas mandam seguir o
  `migration_executor.md` sem avisar que existe um segundo processo em disco, levando
  qualquer agente a decisões mal informadas.

## Plano de correção

1. **Decidir qual sistema é o vigente.** Esta é uma decisão do mantenedor, não do agente.
   Critério sugerido: o Sistema A tem registro de progresso datado e recente
   (`migration_executor.md:163-167`, entradas até 2026-08-10) e é o único referenciado
   pelo `CLAUDE.md`; o Sistema B tem arquitetura mais elaborada (primitivas base) e um
   `criterio_final` melhor definido, mas seu status está comprovadamente defasado.
2. **Reconciliar o estado real antes de arquivar qualquer coisa.** Rodar
   `grep -rn "primevue\|@primeuix" src/ --include='*.vue' --include='*.ts'` e montar a
   lista real de componentes ainda dependentes. Esse resultado — não os YAMLs — é a
   verdade atual.
3. **Resolver o destino de `src/components/base/`.** Se o Sistema A vencer, decidir
   explicitamente: (a) incorporar as primitivas como parte da estratégia oficial,
   documentando-as no `CLAUDE.md` e no `INDEPENDENCIA-PRIMEVUE.md`; ou (b) removê-las
   junto com seus testes. Não deixá-las órfãs.
4. **Arquivar o sistema perdedor de forma inequívoca:** mover para
   `docs/historico/` (ou remover do versionamento), e adicionar no topo do arquivo
   arquivado um aviso `> OBSOLETO — ver <caminho do sistema vigente>`. Não basta deixar
   os dois convivendo.
5. **Atualizar o `CLAUDE.md:15-30`** para refletir a decisão, incluindo a menção explícita
   de que o outro diretório é histórico — de modo que nenhum agente futuro o interprete
   como acionável.
6. **Unificar o critério de conclusão**, adotando o `criterio_final` do Sistema B
   (que cobre `@primeuix` e `@primevue`, não só `primevue`) no sistema vigente.

## Verificação

- Existe **exatamente um** arquivo no repositório que se declara "fonte de verdade do
  progresso" da migração.
- `grep -rn "fonte de verdade" --include='*.md' --include='*.yaml' .` retorna uma única
  referência ativa.
- O status do sistema vigente bate com o resultado de
  `grep -rn "primevue\|@primeuix\|@primevue" src/ --include='*.vue' --include='*.ts'`,
  item a item.
- `src/components/base/` está documentado no sistema vigente **ou** foi removido junto
  com `tests/components/base/`.
- O `CLAUDE.md` menciona todos os diretórios de controle que existem em disco,
  classificando cada um como vigente ou histórico.
