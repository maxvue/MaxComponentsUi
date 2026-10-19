# Plano de execução — Issue #87

## Descrição e Causa Raiz

### Problema confirmado

O comando público `npm test` inclui auditorias dos artefatos distribuídos, mas não prepara esses artefatos. Em uma worktree sem `dist/`, falham oito testes e o `beforeAll` de uma suíte; os oito casos dessa suíte ficam sem execução. Trata-se de um problema de orquestração/pré-requisito do comando de testes, não de evidência de defeito nos componentes ou de incorreção das asserções de distribuição.

Reprodução nesta worktree pré-alocada, sem alteração de código ou execução de build:

- Pacote `@maxvue/max-components-ui@1.1.26`; Vitest `4.1.11`.
- Verificação determinística com `fs.existsSync('dist')`: `false`; dependências e binário do Vitest disponíveis.
- Comando integral: `npm test`, sem filtros; saída `1`, duração `30.50s`.
- Resultado: **351 arquivos passaram, 3 falharam; 4731 testes passaram, 8 falharam e 8 foram ignorados, total de 4747**.
- Log observado: `/tmp/opencode/issue-87-baseline.log:L1-175`. Arquivo temporário de diagnóstico, não integrante da entrega nem baseline permanente.
- As falhas nominais e seus pontos de origem coincidem com o relato. Não foi executado build para afirmar que a distribuição atual passa; essa confirmação pertence à implementação/validação futura.

### Causa Raiz Comprovada

1. **Entrada sem preparação:** `package.json:L878-882` define `test` como `vitest run`; não há preparação nessa cadeia. O comando de build existe separadamente em `package.json:L859`.
2. **Descoberta das auditorias:** `vitest.config.ts:L23-30` inclui `tests/**/*.{test,spec}.ts`, abrangendo os testes de distribuição. O setup é `tests/setup.ts`, voltado a mocks e ambiente (`tests/setup.ts:L1-12`), não à produção de `dist/`. Não há `globalSetup` no arquivo de configuração (`vitest.config.ts:L1-51`).
3. **Consumo que falha:**
   - `tests/architecture/package-exports.test.ts:L9-32` exige diretório, entry e atualidade em relação a `src/`. As quatro chamadas são `:L73-74`, `:L97-98`, `:L186-187` e `:L217-218`; todas param na asserção de `:L13`.
   - `tests/assets/creditCardAssetsOptimization.test.ts:L222-261` contém quatro casos dependentes de artefatos: existência em `:L224-226`, leitura de `index.es.js` em `:L229-231` e listagens em `:L240` e `:L261`. A ausência do diretório gera uma asserção e três erros `ENOENT`.
   - `tests/architecture/treeshaking-maxbutton.test.ts:L59-83` lança erro em `:L62` antes de executar seus oito testes; também rejeita entry ausente e fontes mais recentes que o build.
4. **Produtor dos dados ausente no fluxo:** `npm run build` executa `vue-tsc && vite build` (`package.json:L859`). O Vite gera entries e CSS em `vite.config.ts:L24-44`; os plugins geram declarações e copiam temas em `vite.config.ts:L9-19`. Esses são os artefatos lidos pelas auditorias, inclusive os caminhos publicados em `package.json:L5-31`.
5. **Por que o gate agregado é diferente:** `package.json:L872` já executa `npm run build` antes de `npm run test`. A CI chama esse agregado (`.github/workflows/quality.yml:L22-26`). A preparação existe no gate, mas não no comando isolado usado pela auditoria. Simplesmente adicionar build a `test` sem ajustar o agregado duplicaria o build.

**Rastreamento reverso e fluxo causal:** erro de `existsSync`/`readFileSync`/`readdirSync` nos testes ← caminhos físicos de `dist/` ← saída do build Vite/declarações/temas ← fontes e configuração de distribuição. No sentido direto: `npm test` → `vitest run` → descoberta das três suítes → leitura de artefatos ainda não gerados → oito falhas e um hook de suíte interrompido. **UI ⇄ Store ⇄ API/Rotas ⇄ Controller/Service ⇄ DB: não se aplica**; o fluxo afetado é exclusivamente CLI/configuração/build/sistema de arquivos. Não há evidência causal envolvendo rede, controllers ou banco.

### Necessidade e limites

Planejamento necessário: o cenário foi reproduzido integralmente e a preparação automática do comando isolado não existe. Severidade moderada de engenharia: bloqueia o baseline local, com alternativa explícita de build e gate agregado já preparado; não foi demonstrada falha em produção. Não classificar como regressão nova, pois não há baseline comparativo declarado. Não introduzir `baselineDoc`, alterar budgets ou corrigir documentação funcional alheia ao caso.

## Arquivos afetados

| Arquivo | Alteração futura |
| --- | --- |
| `package.json` | Tornar `test` autocontido, acrescentar executor explícito para build já preparado e reutilizá-lo em `verify`. |
| `tests/architecture/test-command-contract.test.ts` (novo) | Cobrir preparação, sequência, propagação de falhas e preservação do gate agregado. |
| `README.md` | Acrescentar seção curta sobre testes, custo do build e comandos que exigem preparação manual. |

`docs/issues/87/plan.md` é o único arquivo do projeto escrito nesta etapa. Os três arquivos de testes relatados, `vitest.config.ts`, `tests/setup.ts`, `vite.config.ts`, lockfile e workflow são referências/contratos preservados, não alvos de alteração. Não é necessário adicionar dependências nem versionar `dist/`.

## Execuções propostas

1. Permanecer na worktree dedicada pré-alocada; verificar alterações preexistentes e preservar qualquer trabalho alheio. Não executar commit, merge, push, publicação ou limpeza desta worktree sem autorização específica.
2. Adotar contrato explícito com dois níveis:
   - `test`: `npm run build && npm run test:built`.
   - `test:built`: `vitest run`.
   - Em `verify`, manter `npm run build` na posição atual e substituir **somente** a chamada `npm run test` por `npm run test:built`.
   - Manter todos os demais passos do agregado, sua ordem e encadeamento com `&&`.
3. Preservar a passagem de argumentos do npm até o Vitest: por exemplo, `npm test -- tests/architecture/package-exports.test.ts` precisa construir o pacote e repassar o filtro ao executor final. Validar esse comportamento por subprocesso; não assumir que o simples texto da cadeia é suficiente.
4. Executar build em toda chamada de `npm test`, mesmo quando `dist/` existir. Isso evita aceitar distribuição desatualizada sem introduzir heurísticas de timestamps, cache de build, variáveis de bypass ou verificações parciais de existência.
5. Criar o teste de contrato lendo os scripts reais de `package.json`. Para testar a execução, montar fixture descartável **dentro desta worktree**, sob `.vitest-attachments/`, com `package.json` mínimo, sem dependências. Reutilizar a cadeia real de `test`; substituir apenas os comandos-folha de build e Vitest por processos Node sentinelas que registrem ordem, argumentos e códigos de saída. Invocar npm por subprocesso sem shell interpolado, com timeout e limpeza restrita à fixture criada. Não chamar `npm test` do repositório de dentro de sua própria suíte, nem fazer builds reais por caso.
6. Testar separadamente o contrato real de `test:built` e o conteúdo/ordem do agregado `verify`, impedindo que a fixture esconda remoção de auditorias ou alteração de flags. Os testes de integração existentes continuam sendo a prova dos artefatos reais.
7. Acrescentar instruções ao README:
   - `npm test` inclui build real e todas as suítes de `vitest.config.ts`.
   - `npm run test:built` é avançado e exige build fresco explícito; falhar sem artefatos nesse comando é intencional.
   - `npm run test:watch`, `npm run test:coverage` e execução direta por `npx vitest` mantêm o comportamento atual e exigem `npm run build` antes de auditorias de distribuição; mudanças em fontes exigem novo build. Não prometer atualização automática nesses caminhos.
   - `npm run verify` continua sendo o gate completo e não deve construir duas vezes por causa deste ajuste.
8. Não mover build para `setupFiles` (executado por arquivo), não introduzir hooks em testes de componentes e não excluir, ignorar, mockar ou enfraquecer nenhuma das asserções dependentes de `dist/`. Não separar/retirar testes do comando padrão nesta correção.
9. Concluir o bloco de implementação e seus testes antes de rodar validações. Registrar falhas por causa, corrigir o lote inteiro e revalidar somente após as correções relevantes.

## Testes de regressão e validação em lote

### Casos automatizados novos

No novo `tests/architecture/test-command-contract.test.ts`:

1. Sem artefatos na fixture, `npm test` executa produtor antes do consumidor e termina com sucesso; a sentinela consumidora exige o artefato escrito pela produtora.
2. Com artefato anterior presente, `npm test` executa novamente o produtor antes do consumidor; o registro prova reconstrução, não simples existência.
3. Build sentinela com saída não zero interrompe a cadeia, mantém falha do comando e não executa a sentinela Vitest.
4. Consumidor sentinela com saída não zero faz o comando público falhar, sem mascarar erro nem convertê-lo em sucesso.
5. Filtro e opções enviados depois de `--` chegam à sentinela Vitest, não ao comando de build; nenhuma opção de exclusão/skip é acrescentada.
6. `test:built` mantém `vitest run`, sem build implícito; `test` prepara build uma única vez por chamada e não depende de `pretest` oculto.
7. `verify` mantém exatamente os gates anteriores, na mesma ordem, com um único build antes do executor `test:built`; cobertura, navegador, consumidores, benchmarks, integridade e segurança permanecem presentes.
8. README explica as pré-condições e a distinção entre os dois níveis sem sugerir que `test:built` é autocontido.

Usar as APIs de subprocesso e arquivos do Node já disponíveis; reutilizar o padrão de testes de arquitetura com leitura de contratos. Evitar snapshots frágeis do JSON completo. Cobrir explicitamente as oito falhas originais e os oito casos antes interrompidos por hook mediante execução real das suítes existentes, sem alterar suas expectativas.

### Ordem de validação do lote

1. Após terminar todas as mudanças, executar **um** `npm test` integral em checkout/worktree descartável sem `dist/`, com dependências preparadas e mesma revisão. Neste cenário não executar build antes: a preparação é responsabilidade do comando sob teste. Não apagar artefatos preexistentes de outra sessão para fabricar o cenário.
2. Conferir relatório completo: as oito falhas originais desapareceram; os oito casos de tree-shaking foram de fato executados e passaram. Não aceitar só mudança de contagem, `skip`, filtro, sucesso de fixture ou ausência de `ENOENT` como prova suficiente.
3. Para fechamento local sem gate completo, executar checagem de tipos de testes e lint uma vez sobre o lote (`npm run type-check:test` e `npm run lint:check`). `npm test` já executou `vue-tsc` e build pela cadeia proposta; não repetir esses comandos isoladamente sem motivo.
4. Se for necessário o gate completo de integração/pré-release, **substituir a etapa 3** por `npm run verify` como rodada agregada própria, após o cenário específico de checkout limpo. Não repetir seus componentes isoladamente sobre o mesmo conteúdo; a rodada de `npm test` anterior tem finalidade distinta de comprovar o contrato público sem build prévio. O agregado deve evidenciar apenas uma chamada de build.
5. Se qualquer etapa falhar, guardar logs e diagnosticar a causalidade; corrigir todas as falhas relacionadas em lote e repetir somente as validações necessárias. Falhas de baseline não relacionadas exigem registro e decisão própria, não ampliação automática de escopo.

Nesta etapa de planejamento, somente a reprodução do baseline foi executada. Não houve teste de correção, checagem de tipos, lint, build ou gate de release; nenhum sucesso futuro está sendo declarado.

## Banco de dados

Nenhuma migration. Não há banco, reset, seed, persistência de aplicação ou alteração de schema neste fluxo.

## Riscos de quebra e Não-Regressão

| Risco/contrato | Proteção |
| --- | --- |
| Maior latência de `npm test` e dependência de compilação correta | Documentar preparação; falhar imediatamente se build falhar. O custo é explícito, sem cache oportunista. |
| Build duplicado em `verify` | Teste da cadeia e log do agregado comprovam um build; usar `test:built` apenas depois da preparação existente. |
| Filtros/opções não chegarem ao Vitest | Subprocesso com argumentos reais do npm e sentinela que registra `argv`. |
| Gate incompleto ou testes silenciosamente ignorados | Preservar descoberta e os três testes existentes; comparar gates e resultados nominais, incluindo os oito casos de tree-shaking. |
| Artefatos desatualizados aceitos | Build obrigatório em `npm test`; manter as guardas de atualidade em `package-exports` e tree-shaking; não substituir por `existsSync` permissivo. |
| Confundir executor avançado com comando autocontido | Nome `test:built`, documentação de pré-condição e testes de contrato; cobertura/watch/direto mantêm preparação manual declarada. |
| Builds simultâneos na mesma pasta `dist/` | Validar em worktree exclusiva, sem executar `npm test` e `verify` em paralelo. Não desenvolver solução de concorrência interprocesso neste escopo. |
| Teste de contrato recursivo, lento ou destrutivo | Fixture local isolada com sentinelas, sem instalação e sem build real; timeout e limpeza apenas da fixture criada pelo teste. |
| Quebra de exports, CSS opt-in, SCSS ou isolamento de chunks | Asserções originais permanecem integrais e executam sobre a distribuição real recém-gerada. Nenhuma alteração na API pública da biblioteca. |

Não alterar componentes, stores, tokens, classes legadas `.p-*`, dependência npm de `@maxvue/max-use`, limite de bytes, contagem de componentes ou independência do PrimeVue. Se build fresco revelar falha adicional, registrar evidência e avaliar separadamente, em vez de relaxar contratos para deixar o comando verde.

## Validação

**Prova conclusiva da correção:** em worktree limpa da revisão implementada, com dependências instaladas e sem `dist/`, executar apenas:

```bash
npm test
```

Critérios cumulativos: saída `0`; build ocorre antes do Vitest; artefatos reais são gerados; execução integral sem exclusões novas; os oito testes originalmente falhos e os oito casos da suíte de tree-shaking passam; novos testes de contrato passam. A contagem total pode crescer com os novos testes e não deve ser congelada em `4747`.

Para integração/pré-release, além da prova de checkout limpo, o comando é:

```bash
npm run verify
```

Seu sucesso só pode ser declarado com todas as etapas concluídas, sem falhas ou pendências omitidas. Preservar o estado Git esperado do gate e não executar release/publicação.

## Skills Aplicáveis

- `superpowers`: planejamento verificável, escopo explícito e ciclo de revisão; seguir a validação em lote mandatória do projeto, sem testes após cada microedição.
- `vitest-skill`: testes de contrato, isolamento e uso correto do executor Vitest.
- `javascript-testing-patterns`: testes determinísticos e simulação das dependências de subprocesso sem recursão.
- `technical-documentation-best-practices`: documentação em pt-BR fiel aos comandos efetivos e suas pré-condições.
- `code-review`: revisar o diff antes da integração, especialmente preservação das asserções e dos gates.

Não são necessárias skills de banco, API Laravel, reatividade Vue ou novas interfaces. Não presumir skills não disponíveis; a correção está nos contratos de execução de testes, não em componentes de produto.
