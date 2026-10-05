# Plano de execução — corrigir o build por recuperação das dependências

## 1. Identificação e instrução de admissão

- Data: 2026-10-05.
- Projeto: `@maxvue/max-components-ui@1.1.2`.
- Worktree: `wt-c5616260`.
- Diretório obrigatório: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-c5616260`.
- Branch obrigatória: `wt-c5616260`, originada de `dev` segundo o usuário.
- HEAD observado: `67a658dd35dc2af3dd92f0ebb060d43122f5faba`.
- Spec: `docs/plans/wt-c5616260/spec.md`.
- Estado: **planejamento concluído; execução pendente de aprovação**.

Na primeira admissão, ler este plano e a spec. Nas retomadas, consultar o estado de execução e apenas as seções pertinentes. A aprovação deste documento não deve ser presumida: não executar recuperação antes de autorização explícita do usuário.

Esta sessão realizou somente investigação em leitura e escrita dos documentos autorizados. Não realizou instalação, build, testes, formatação ou operações Git de publicação.

## 2. Problema, objetivo e decisões

### Problema demonstrado

O usuário acionou o build pela interface e forneceu o log da tarefa do editor:

```text
npm run build
vue-tsc && vite build
ERR_PACKAGE_PATH_NOT_EXPORTED: subpath './decode' de entities
Node.js v24.18.0
```

O log indica execução no repositório principal, não nesta worktree. Aqui, `node_modules` aponta por link simbólico ao diretório principal. O compilador instalado exige `entities@^7.0.1`, mas resolve `entities@4.5.0`, cujo mapa `exports` não contém `./decode`. A resolução foi reproduzida sem executar o compilador. O lockfile desta worktree registra `entities@7.0.1` na raiz.

### Objetivo e limite do sucesso

Restaurar uma instalação isolada e comprovar que `npm run build` funciona nesta worktree com o lockfile atual, preservando os arquivos rastreados de implementação e os contratos públicos.

**Um build bem-sucedido aqui não comprova que o botão voltará a funcionar na raiz.** O MaxCode deverá tratar posteriormente o diretório de execução/interface ou a instalação principal, mediante autorização separada. Não alterar a raiz para satisfazer o log original.

### Decisões confirmadas pelo usuário

1. Isolar dependências nesta worktree, preservando a instalação compartilhada.
2. Fazer somente recuperação; não adicionar scripts ou testes preventivos.
3. Não criar worktree, trocar branch, commitar, mergear ou fazer push.
4. Nesta sessão, escrever somente spec, plano e notificações nos destinos autorizados.

### Propostas técnicas e alternativas

- **Adotada:** testar primeiro o lockfile existente com `npm ci` isolado. Menor mudança e melhor distinção entre instalação divergente e problema do lockfile.
- **Não adotadas:** `npm install entities@latest`, override global ou edição de `node_modules`. Podem mascarar o problema, trocar contratos de consumidores antigos e não produzir recuperação reproduzível.
- **Não adotadas:** downgrade do Vue/Node, regeneração do lockfile, `--force`, `--legacy-peer-deps`, limpeza global de cache ou atualização geral de dependências. Não há evidência que justifique essas ações.
- **Não adotada pelo usuário:** novo verificador preventivo.
- **Não mudar:** preserva a falha e não atende ao objetivo, embora seja seguro se a execução não for aprovada.

## 3. Evidências, contratos e limitações

| Local existente | Evidência / utilidade |
| --- | --- |
| `AGENTS.md` | Trabalho isolado; plano prévio; português; sem PrimeVue; preservar contratos/classes legadas. |
| `.gitignore:68–69` | Ignora `.worktrees/` e `.max-code-worktrees/`; não precisa alterar. |
| `package.json:556–582` | Scripts de tipos, build, testes e gates. Build não contém commit/push. |
| `package.json:589–660,690–698` | Requisitos e overrides atuais; preservá-los. |
| `.nvmrc` | Node `24.18.0`, igual ao ambiente observado. |
| `package.json:545–549` | Engines `node >=20`, `npm >=10`; `packageManager: npm@10.8.2`. npm observado = `12.0.1`; divergência de ferramenta registrada, não atribuída como causa. |
| `.github/workflows/quality.yml:16–26` | CI usa `.nvmrc`, `npm ci` e gate `verify`. |
| `node_modules` | Link para instalação principal; risco de escrita indireta fora da worktree. |
| `node_modules/vue-tsc/package.json` | `3.3.11`, depende de `@vue/language-core@3.3.11`. |
| `node_modules/@vue/language-core/package.json` e `lib/languagePlugin.js` | Consome `@vue/compiler-dom`. |
| `node_modules/@vue/compiler-core/package.json` e `dist/compiler-core.cjs.js:11` | Compilador `3.5.42`, exige `entities ^7.0.1`, importa `entities/decode`. |
| `node_modules/entities/package.json:2,22–35` | Instalação `4.5.0` sem exportação `./decode`. |
| `package-lock.json:3684–3738,4889` | Lock v3; compiladores e `entities@7.0.1` registrados. |
| `vite.config.ts` | Entradas públicas e por componente, declarações via plugin, CSS, sourcemaps, minificação e cópia de temas em `closeBundle`. Build tem escrita. |
| `tsconfig.json` | Compilação estrita, saídas em `dist/`, modo composite; também pode produzir `tsbuildinfo`. |
| `scripts/check-lockfile.mjs` | Verifica caminhos e requisitos diretos; não garante sozinho compatibilidade transitiva da instalação real. |
| `tests/architecture/lockfileValidation.test.ts` | Fixtures de lockfile existentes; usam diretórios temporários. |
| `tests/architecture/package-exports.test.ts` | Exige build fresco, exports/artefatos e temas; rodar depois do build. |
| `vitest.config.ts` | Configuração da suíte e padrões de arquivos; não modificar. |
| `.vscode/tasks.json:5–20` | Tarefa de build tem mensagem que menciona commit/push sem executá-los; achado fora do escopo notificado separadamente. |
| `scripts/verify-consumers.mjs`, `scripts/verify-package-consumer.mjs` | Criam consumidores temporários, empacotam e instalam pacotes; não usar indiscriminadamente nesta recuperação. |

Verificações realizadas: leitura dos arquivos acima, raiz/branch/HEAD/status, Node/npm, tipo/destino do link, sondagem de resolução com `createRequire`/`require.resolve` e leitura das versões de `entities` no lockfile. Nenhuma carga do compilador ou validação executável da biblioteca foi feita.

Limitações: não foi comparado o manifesto/lockfile da raiz; não foram investigadas outras worktrees, credenciais ou configurações sensíveis. Não foram provadas disponibilidade no registry, consistência integral do lock, causa histórica da divergência ou ausência de outras falhas após a instalação.

O log não prova bug de componente. A coexistência de compiladores `3.5.42` e `3.6.0-rc.10` registrada no lockfile não prova incompatibilidade: ferramentas têm requisitos distintos. A coexistência de `entities` 4/7/8 também deve ser preservada quando compatível por consumidor.

Referências oficiais e limitação de versão: seção 5 da spec. Node 24 confirma a semântica do erro; a referência npm corrente confirma o comportamento geral de `ci`, não substitui revalidação da ferramenta local.

## 4. Requisitos e preservação

- R1: toda escrita futura de recuperação deve permanecer nesta worktree; nunca seguir o link para alterar seu destino.
- R2: instalar usando o manifesto/lock atuais, sem alteração de conteúdo ou versão.
- R3: `entities/decode` deve resolver a partir do contexto real dos compiladores relevantes, não apenas do diretório corrente.
- R4: tipos, build e contratos de artefatos devem passar com dependências próprias.
- R5: testes existentes devem confirmar ausência de regressão; não reduzir asserts, estriteza ou cobertura para conseguir código 0.
- R6: declarar separadamente recuperação desta worktree e pendência do build na raiz/interface.
- R7: preservar trabalho preexistente e registrar evidências por marco, sem segredos.

Não há modificação de interfaces públicas, APIs, dados de usuários, serviços, componentes, temas, acessibilidade ou regras de negócio. Não introduzir PrimeVue nem referências locais a MaxUse.

## 5. Execução faseada e critérios de parada

### T1 — Admissão, autorização e linha de base

**Dependência:** aprovação explícita para executar este plano.

1. Conferir raiz com `git rev-parse --show-toplevel`, branch com `git branch --show-current`, revisão com `git rev-parse HEAD` e alterações com `git status --short`.
2. Conferir se já houve recuperação: `node_modules` pode ter deixado de ser link. Não presumir que ainda é o mesmo estado da investigação.
3. Registrar hashes SHA256 reais de `package.json`, `package-lock.json` e deste plano; registrar tipo e destino de `node_modules` via `lstat`/`readlink`.
4. Confirmar Node/npm e permissões de instalação/rede. A proposta usa as ferramentas presentes, sem instalar/trocar npm. Registrar `12.0.1` versus `packageManager` `10.8.2`; se houver exigência de ferramenta exata ou conflito dependente dela, interromper para decisão, não mudar silenciosamente.
5. Revisar scripts de instalação relevantes e permissões: `npm ci` pode executar lifecycle scripts transitivos. Não imprimir configurações completas, variáveis ou credenciais. Se houver script que escreve externamente ou requisito não autorizado, bloquear com próxima ação concreta.

**Saída:** linha de base, isolamento planejado e autorização para os efeitos operacionais. Arquivos de implementação permanecem intactos.

### T2 — Separar a instalação local sem tocar no destino

**Dependência:** T1 aprovada. **Marco de maior risco:** revisar tipo/destino antes de remover a entrada.

1. Verificar que `node_modules` é exatamente o link observado e está diretamente dentro da raiz ativa.
2. Remover **somente a entrada de link** com operação não recursiva (`fs.unlinkSync` ou equivalente), sem barra final e sem seguir o destino. Não usar `rm -rf`, exclusão recursiva, nem executar `npm ci` sobre o link.
3. Confirmar ausência da entrada local e que o diretório de destino continua disponível. Não inventariar ou modificar outras sessões.
4. Se já for diretório real, não apagar: conferir estado de execução e avaliar se T2 já foi cumprida. Se o destino do link divergir, interromper para esclarecimento.

**Saída:** instalação local desacoplada; destino principal preservado. Este passo ainda não corrige a instalação principal.

### T3 — Instalar do lockfile sem atualizações

**Dependência:** T2, rede/registry acessíveis e lifecycle scripts avaliados.

1. Preparar, somente durante Execute, cache e temporários locais próprios (`.cache/npm/` e `.execution-tmp/`) para limitar escritas operacionais à worktree. Usar cache npm e `TMPDIR` direcionados a esses caminhos; não alterar configuração persistente/global. Confirmar que ferramentas/scripts respeitam esse limite.
2. Executar `npm ci` **no diretório obrigatório**, com dependências de desenvolvimento disponíveis. O comando existe no CI do projeto; não substituir por `npm install`, nem empregar flags que escondem conflitos.
3. Não usar `--ignore-scripts` como solução automática: pode deixar dependências de build incompletas. Qualquer política restritiva de scripts deve ser diagnosticada e tratada explicitamente.
4. Registrar duração, versões de ferramentas e código de saída, sanitizando logs. Confirmar que os hashes de manifesto/lock não mudaram.
5. Se falhar por registry, permissão ou rede, informar a próxima ação específica. Se falhar por lock/peer/integridade, registrar o primeiro erro e os pacotes envolvidos e solicitar aprovação para um plano complementar. Não apagar lock, atualizar dependências ou repetir a mesma falha sem diagnóstico novo.

**Saída:** `node_modules` real e próprio, instalado com código 0 e lock preservado. Bloqueio deve ser explicitamente registrado como tal.

### T4 — Confirmar compatibilidade da instalação

**Dependência:** T3 concluída.

1. Confirmar por caminho real que `node_modules`, binário de `vue-tsc` e módulos utilizados não escapam da worktree. Pacotes do build podem conter executáveis/links internos; o critério é destino real local, não proibir todos os links internos.
2. Repetir a sondagem que detectou a falha: resolver `@vue/compiler-core`, criar `createRequire` ancorado no módulo resolvido e resolver `entities` e `entities/decode`. Registrar versões/caminhos relativos e comparação com o requisito do consumidor.
3. Inspecionar também a cadeia de `vue-tsc` → language-core → compiler-dom e o compilador usado por `compiler-sfc`, se distintos. Não usar apenas `require.resolve` a partir da raiz como prova da cadeia completa.
4. Executar sequencialmente:

```bash
npm run check:lockfile
npm run check:npm-tree
```

5. Divergência ou `ERR_PACKAGE_PATH_NOT_EXPORTED` persistente: diagnosticar a resolução efetiva, não editar imports distribuídos nem criar alias para contornar `exports`.
6. A checagem de tipos será realizada pelo `vue-tsc` incluído no build de T5. Não rodar `type-check` adicional na mesma revisão sem necessidade diagnóstica.

**Saída:** contratos transitivos resolvidos e árvore válida. Marcar bloqueio se alguma verificação falhar.

### T5 — Build, validação dos artefatos e fechamento

**Dependência:** T4 concluída.

Executar comandos separados, com diretório de execução explícito e sem notificações de editor, áudio ou operações Git:

```bash
npm run build
npm run test
git diff --check
git status --short
```

1. Exigir código 0 do build; distinguir sucesso de `vue-tsc` e conclusão de Vite/cópia de temas.
2. Conferir `dist/index.es.js`, `dist/index.d.ts`, entrypoints declarados, `dist/style.css`, arquivos por componente e `dist/themes/all.scss`. Usar os testes de exports existentes para os contratos, não só verificar presença de `dist/` antiga.
3. Os testes de arquitetura estão incluídos na suíte ampla, que ocorre após build fresco, pois `package-exports.test.ts` exige artefatos atualizados. Se houver falha específica, a seleção diagnóstica confirmada é `npm run test -- tests/architecture/lockfileValidation.test.ts tests/architecture/package-exports.test.ts`; não executá-la adicionalmente por rotina.
4. Rodar a suíte ampla apenas no fechamento; não executar os mesmos testes repetidamente a cada microação. Temporários dos testes devem permanecer no ambiente local autorizado. Erros de tipos ou componentes devem ser separados do incidente e submetidos a nova aprovação antes de qualquer correção de código.
5. Revisar hashes de manifesto/lock e diff de rastreados: não pode haver alteração de código, configuração ou testes. Documentos de planejamento e registro futuro são esperados.
6. Handoff deve registrar recuperação desta worktree, resultado das validações e necessidade de ação separada do MaxCode caso o botão ainda use a raiz. A checagem do diretório na interface pode ser manual, sem executar tarefa na raiz nesta recuperação.

**Gate amplo opcional:** `npm run verify` existe, mas inclui cobertura, navegador, benchmarks, consumidores e auditoria/rede. Não é exigido automaticamente para recuperação sem alteração de código; somente executar mediante autorização dos efeitos/ambiente e depois de revisar scripts e temporários. Se escolhido previamente para o fechamento, usar o agregado em lugar das validações isoladas que ele já inclui, sem duplicá-las. Não declarar esse gate aprovado sem executá-lo; este plano não é um plano de release.

**Saída:** recuperação local comprovada ou bloqueio específico com próxima ação. Nenhum commit/publicação/limpeza da worktree.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência necessária | Testes/verificações futuras | Revisão pelo risco | Verificação manual |
| --- | --- | --- | --- | --- |
| T1 / R7 | Raiz, branch, HEAD, estado anterior e hashes | Leitura Git/arquivos; aprovação registrada | Conferir diferenças preexistentes e ferramentas | Autorização, rede e lifecycle scripts |
| T2 / R1 | Link local removido, destino preservado | `lstat`, `readlink`, caminho real | Revisão independente antes da remoção, se disponível; senão autoauditoria explícita | Nenhuma escrita na instalação principal |
| T3 / R2 | `npm ci` código 0, hashes idênticos | Instalação congelada; diretório real local | Examinar falhas e efeitos de instalação | Sem upgrade, flags permissivas ou cache global |
| T4 / R3 | Resolução contextual de `entities/decode`, versões compatíveis | Sondagem, `check:lockfile`, `check:npm-tree` | Conferir consumidores transitivos distintos | Todos os caminhos reais locais |
| T5 / R4–R5 | Tipos, build fresco e artefatos corretos | Build com `vue-tsc`, suíte ampla incluindo testes de arquitetura, diff | Revisão independente da entrega quando disponível | Temas, CSS, declarações e entrypoints |
| T5 / R6–R7 | Registro final com alcance e pendências | Estado por tarefa/revisão e resultados reais | Não confundir correção local com botão/raiz | Conferir diretório da interface; ação futura pelo MaxCode |

TDD focado: nenhuma alteração de produção/teste foi solicitada, portanto não criar teste só para cumprir um ritual. A evidência negativa é a sondagem de resolução já observada; repetir a verificação após recuperação e usar os testes existentes. Se novo diagnóstico exigir correção de código, interromper para aprovação e plano complementar com teste que falhe antes da implementação.

## 7. Riscos, recuperação e operação

- **Escrita indireta na raiz:** risco principal. Nunca instalar enquanto `node_modules` ainda for o link compartilhado. Cache, temporários e scripts também exigem atenção.
- **Lockfile não instalável:** o registro de `entities@7.0.1` não comprova toda a árvore. `npm ci` é o teste futuro; falha implica bloqueio, não regeneração implícita.
- **Ferramentas:** Node observado coincide com `.nvmrc`; npm diverge do `packageManager`. Registrar e investigar somente se relevante; nenhuma troca automática de ferramenta.
- **Lifecycle scripts/rede:** podem executar código ou exigir autenticação. Avaliar permissões e sanitizar evidências; não copiar credenciais para documentos.
- **Concorrência:** não mexer na instalação compartilhada. Se outro processo recriar o link ou mudar arquivos desta worktree, interromper e revalidar antes de continuar.
- **Regressões ocultas:** sucesso da resolução não garante tipos/Vite/testes. Cada gate tem aceite próprio; não declarar conclusão total se houver bloqueio.
- **Artefatos antigos:** testes de exports exigem build fresco; não aceitar `dist/` preexistente como evidência.
- **Recuperação interrompida:** após desvincular, a worktree pode ficar sem dependências ou com instalação parcial; a raiz permanece intacta. Registrar estado e retomar T3 após corrigir o bloqueio. Não relincar automaticamente e mascarar o isolamento.
- **Reversão:** só mediante autorização, revalidando o estado local. Remoção de diretório real não é equivalente à remoção de link; não usar limpeza recursiva generalista. Restaurar o link original reintroduz a instalação defeituosa e não constitui correção.
- **Implantação/dados:** não há migração, mudança de banco, rollout ou publicação. Artefatos locais não devem ser publicados nesta tarefa.

Achado fora do escopo: `docs/notifications/wt-c5616260/notifications/tarefa-build-mensagem-enganosa.md`. Não corrigi-lo como parte desta recuperação.

## 8. Retomada, progresso e responsabilidades

Durante **Execute**, criar/atualizar `docs/plans/wt-c5616260/execution-state.json` após marcos T1, T2–T3, T4 e T5 e em qualquer handoff. Este arquivo **não foi criado nesta sessão Plan**.

O registro deverá conter:

- SHA256 real de `plan.md` usado na execução; não inventar hash ou usar o HEAD no lugar dele.
- Identificadores T1–T5, estado (`pendente`, `em andamento`, `concluída`, `bloqueada`), dependências e revisão factual da tarefa.
- HEAD/branch, arquivos/entradas alterados e hashes relevantes por revisão.
- Validações por revisão: comando, diretório, ferramenta, data, código de saída e evidência sanitizada; separar não executado, falha e sucesso.
- Bloqueios, próxima ação concreta, necessidade de validação manual e responsáveis pelo handoff.

Ao retomar: conferir o hash do plano, trabalho já feito, isolamento atual e alterações locais; executar somente lacunas. Não repetir instalação/build se houver evidência ainda válida da mesma revisão. Mudanças de dependências, ferramenta ou código invalidam as validações afetadas. Repetição da mesma falha sem progresso exige diagnóstico da causa.

Execução recomendada: um executor, tarefas sequenciais. Não há benefício em paralelizar instalação/build/testes que compartilham dependências/artefatos. Se houver delegação futura autorizada, fornecer contexto mínimo com identificação da tarefa e referências às seções pertinentes; revisor fica em leitura e não compartilha escrita com o executor. Revisar os marcos de risco e a entrega, não cada microedição.

Decisões confirmadas só serão reabertas diante de evidência nova ou mudança de requisito. Qualquer necessidade de atualizar lockfile, adicionar prevenção, alterar botão ou recuperar a raiz exige nova aprovação.

## 9. Revisão final do planejamento

- Pedido atendido: diagnóstico fundamentado e plano executável, sem correção aplicada.
- Escopo: recuperação isolada, conforme escolhas da entrevista; sem código ou upgrades.
- Restrições: worktree/branch preservadas; sem instalação nesta sessão e sem commit/merge/push.
- Simplicidade: primeiro testar instalação congelada; não introduzir dependência direta ou override para uma dependência transitiva.
- Compatibilidade: preservar múltiplas versões legítimas, exports públicos e configuração existente.
- Dependências: aprovação → isolamento → instalação → resolução → build com tipos → testes/entrega.
- Riscos: escrita por link, lifecycle scripts, lockfile, ferramentas, artefatos e botão na raiz explicitados.
- Hipóteses: causa histórica, instalabilidade e sucesso completo continuam não comprovados.
- Aceite: requisitos vinculados à matriz, testes existentes e revisão de conteúdo; validações futuras não apresentadas como realizadas.
- Retomada: progresso com hash real e tarefas por revisão; bloqueios não equivalem a conclusão.
