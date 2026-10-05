# Plano de execução — recuperar build sem alterar código ou versões

## 1. Identificação e admissão

- Data: 2026-10-05.
- Projeto: `@maxvue/max-components-ui`, manifesto `1.1.2`.
- Worktree e branch: `wt-e84f0bff`, criada pelo MaxCode a partir de `dev`.
- Diretório obrigatório de execução: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e84f0bff`.
- Especificação já elaborada: `docs/plans/wt-e84f0bff/spec.md`.
- Situação: planejamento concluído; **execução não iniciada nem autorizada por este documento**.

Na primeira admissão, ler este plano e instruções aplicáveis. Nas retomadas, consultar somente tarefas/decisões pertinentes, estado e evidências recentes. Não criar outra worktree, trocar branch ou mexer em outras worktrees. Não commitar, integrar, publicar ou limpar esta worktree: gerenciamento do MaxCode/usuário.

## 2. Problema, resultado e decisões

O usuário relatou `ERR_PACKAGE_PATH_NOT_EXPORTED` para `entities/decode` ao executar `npm run build` na pasta principal. O resultado desejado, confirmado na entrevista, é **build funcional e validado nesta worktree isolada**, sem mudanças de código, manifesto ou lockfile. Afeta o desenvolvedor que compila a biblioteca; não se propõe mudança de comportamento para consumidores.

### Decisões confirmadas

1. Recuperação operacional, não criação de teste/script preventivo permanente.
2. Worktree isolada é o aceite; recuperação da instalação principal não está incluída.
3. Preservar versões existentes e usar instalação congelada. Evidência de defeito no lockfile requer nova decisão, não alteração silenciosa.
4. Esta sessão escreve somente `spec.md`, `plan.md` e notificações autorizadas. Nenhuma implementação/instalação/teste/build deve ser executada em Plan.

### Proposta técnica fundamentada

Desvincular somente o link local de `node_modules`, preservar seu destino e instalar dependências próprias com `npm ci` em execução futura autorizada. A validade dessa recuperação deve ser demonstrada por resolução local, árvore coerente, build e testes — não presumida.

Alternativas descartadas: editar `exports` de pacote instalado, importar caminho interno alternativo, instalar `entities` diretamente, override global, downgrade de Vue/Node, apagar lockfile ou usar flags permissivas. Mascaram inconsistência, alteram contratos ou ampliam escopo sem prova. A opção de não mudar mantém a falha de resolução; não atende ao objetivo escolhido.

## 3. Evidências verificadas e limites

| Local inspecionado | Fato | Implicação |
|---|---|---|
| Raiz/branch/estado Git | Raiz e branch corretas; estado inicial limpo | Documentos são as únicas mudanças desta sessão. Revalidar ao retomar. |
| `node_modules` local | Link para a instalação da pasta principal | Não instalar/remover recursivamente enquanto compartilhado. |
| `node_modules/@vue/compiler-core/package.json` e `dist/compiler-core.cjs.js` | `3.5.42`, requisito `entities ^7.0.1`, importação `entities/decode` | O compilador exige um subpath público específico. |
| `node_modules/entities/package.json` | Instalado `4.5.0`, sem export `./decode` | Resolução desde o compilador reproduziu o mesmo código de erro. |
| `package-lock.json:3684,4889` e entradas aninhadas | Compilador raiz `3.5.42`; entities raiz `7.0.1`; versões aninhadas `4.5.0`/`8.1.0` | Instalação efetiva diverge; múltiplas versões não são defeito por si. |
| `package.json:556-582,657,690-698` | Build `vue-tsc && vite build`; scripts de checks/testes; Vue/overrides atuais | Preservar configuração e reutilizar gates existentes. |
| Vue instalado versus lockfile | `3.6.0-rc.9` instalado; `3.6.0-rc.10` previsto | Evidência adicional de instalação desatualizada/inconsistente. |
| `.nvmrc`, Node/npm observados | Node `24.18.0`; npm `12.0.1`; `packageManager` declara `10.8.2` | Não atribuir o erro ao Node nem trocar ferramentas por suposição. |
| `.github/workflows/quality.yml` | CI instala com `npm ci`, roda `verify` e checa Git | Instalação congelada já é prática do projeto. |
| `scripts/check-lockfile.mjs` e teste existente | Verificação estrutural/bidirecional, fixtures negativas | Não valida os bytes/exports de dependências fisicamente instaladas. |
| `vite.config.ts`, `tsconfig.json` | Geração local de `dist`, declarações e cópia dos temas | Build tem escrita; por isso foi reservado para Execute. |
| `.gitignore` | Ignora dependências, dist, caches, `.worktrees` e `.max-code-worktrees` | Não é necessária alteração de ignore. |
| `.vscode/tasks.json:7,18` | Mensagem/label anunciam commit/push, comando apenas faz build e notificação/som | Achado fora do escopo registrado em notificação. |
| `scripts/verify-package-consumer.mjs` | Empacota, instala consumidores temporários e pode executar build | Não rodar indiscriminadamente: exige escrita/rede e escopo adicional. |

Documentação npm consultada em <https://docs.npmjs.com/cli/v12/commands/npm-ci> e Context7 `/npm/cli`: instalação congelada e limpeza automática de dependências. Página disponível para v12 servia `12.2.0`; não assumir identidade de todas as opções com npm observado `12.0.1`.

Não foi executado nenhum gate ou build. Não foi comprovada instalabilidade de todos os pacotes do lockfile. Não se determinou como a instalação compartilhada ficou inconsistente. Não afirmar qual fase do build original falhou sem instrumentação adicional. Nenhuma garantia sobre sucesso do CI/release ou build da raiz.

## 4. Contratos e preservação

- Identidade: manifesto/lockfile da revisão admitida são a fonte da instalação. Registrar seus SHA256 e manter os mesmos após execução.
- Isolamento: `node_modules`, compilador resolvido e `entities/decode` devem ter caminhos reais contidos na worktree, sem fallback para a raiz.
- Compatibilidade: cada consumidor resolve dependência que satisfaz seu requisito; coexistência de majors de `entities` é permitida.
- Disponibilidade: rede, autenticação necessária e tarballs ainda não foram validados. Falha exige diagnóstico sem expor credenciais.
- Não há anexos, correlação de eventos, fornecedor/modelo, migração ou recuperação de dados de negócio nesta tarefa.
- Código, testes, fontes, estilos, APIs públicas, configurações, lockfile, `@maxvue/max-use` via npm e independência de PrimeVue devem permanecer inalterados.

## 5. Tarefas sequenciais

### T1 — admitir revisão e confirmar diagnóstico

**Entradas:** este plano, spec, `AGENTS.md`, eventual estado de execução.

1. Conferir raiz/branch/estado Git e trabalho prévio, inclusive arquivos ignorados gerados por outra execução nesta própria worktree.
2. Registrar Node/npm reais, SHA256 de `package.json` e `package-lock.json`, tipo/destino real de `node_modules`.
3. Revalidar o requisito do compilador, o pacote resolvido e o erro de `entities/decode` usando `createRequire` ancorado no arquivo real do compilador. Usar `require.resolve`, sem importar/executar código de pacote para o diagnóstico inicial.
4. Verificar configuração relevante sem despejar `.npmrc`, variáveis ou tokens; revisar efeitos e permissões da instalação antes de prosseguir.

**Saída:** revisão factual admitida, hashes, isolamento atual e diagnóstico confirmado. Se já houver instalação própria saudável, pular recuperação e executar apenas lacunas de validação. Não apagar diretório próprio por padrão.

### T2 — remover exclusivamente o vínculo local

**Dependência:** T1; revisão independente do risco de remoção antes desta ação.

1. Confirmar imediatamente antes da operação que `node_modules` é o mesmo link registrado, sem alteração concorrente.
2. Remover **somente a entrada simbólica local**, com operação que não siga o destino. Não usar remoção recursiva sobre o link, seu destino ou qualquer caminho amplo.
3. Confirmar que a entrada local desapareceu; preservar integralmente o diretório principal. Se ela for diretório, destino diferente ou houver mudança concorrente, parar e diagnosticar.

**Saída:** worktree pronta para instalação própria; nenhuma escrita no destino compartilhado. Registrar o link antigo para contexto, não recriá-lo como correção automática.

### T3 — instalar a árvore congelada

**Dependências:** T2, autorização de Execute, revisão de scripts/rede.

1. Preparar cache e temporários dentro da worktree, em diretórios próprios da execução; verificar que não são links para fora. Usar configuração transitória de processo, sem editar configuração global/projeto.
2. Garantir inclusão das dependências de desenvolvimento para build/testes. Inspecionar ambiente e configuração efetiva que possam omiti-las, sem expor segredos.
3. Executar `npm ci`, identificado em `.github/workflows/quality.yml`, com as ferramentas disponíveis. Registrar opções efetivamente necessárias e resultados; não instalar outro npm.
4. O lockfile sinaliza scripts em `@parcel/watcher@2.6.0` e `fsevents@2.3.3`; avaliar scripts aplicáveis à plataforma e política do npm real. Não liberar todos os scripts, mudar manifesto ou contornar política sem decisão específica. Não assumir que `--ignore-scripts` produz instalação funcional.
5. Se falhar, classificar rede/autenticação, pacote indisponível, integridade, manifesto/lockfile, peer, política de scripts ou engine. Preservar evidência saneada e indicar próxima ação. Não repetir a mesma falha sem hipótese nova; não apagar/regenerar lockfile ou usar flags permissivas.

**Saída:** diretório próprio instalado a partir do lockfile, ou bloqueio específico. Instalação parcial não é aceite.

### T4 — validar resolução e invariantes

**Dependência:** T3.

1. Conferir `lstat`/caminhos reais de `node_modules`; resolução do compilador e de `entities/decode` deve ocorrer dentro da worktree.
2. Confirmar versões instaladas contra as entradas pertinentes do lockfile, inclusive Vue. Resolver `entities/decode` a partir do compilador, não apenas do diretório raiz do projeto; conferir compatibilidade com seu requisito.
3. Recalcular hashes de manifesto/lockfile e comparar com T1.
4. Executar `npm run check:lockfile` e `npm run check:npm-tree`. Árvore inválida exige diagnóstico, não normalização automática com dedupe/update.

**Saída:** export crítico disponível e árvore íntegra, com fontes/configuração preservadas.

### T5 — comprovar build e fechar a recuperação

**Dependência:** T4; revisão independente de entrega baseada em resultados reais.

1. Executar diretamente `npm run build` na worktree. Não usar tarefa de release ou mensagem que sugira operações Git.
2. Conferir artefatos atualizados previstos no manifesto/configuração: `dist/index.es.js`, `index.d.ts`, `stores.es.js`, `preset.es.js`, `resolver.es.js`, `styles.es.js`, `style.css`, `themes/all.scss` e correspondência das entradas de componentes geradas. Build existente já checa cópia de `all.scss`.
3. Executar `npm run test` como suíte ampla de fechamento; verificar estado Git e hashes novamente. Não criar novos testes nesta recuperação. A confirmação do erro antes e sua ausência após funciona como regressão operacional, não como alegação de novo TDD automatizado.
4. Informar códigos de saída, revisão validada, arquivos produzidos e limitações. Falha subsequente de tipos/build/testes deve ser diagnosticada quanto à causalidade; correção de código ou alteração de dependências requer autorização adicional.

**Saída:** recuperação aceita apenas com critérios cumpridos, ou handoff bloqueado com próxima ação concreta. A raiz continua explicitamente fora do aceite.

## 6. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência obrigatória | Testes/verificações pertinentes | Revisão por risco | Verificação manual |
|---|---|---|---|---|
| T1: revisão correta | Raiz/branch/estado, hashes e resolução atual | Inspeção de metadados e `require.resolve` | Confirmar que não opera na raiz | Trabalho anterior preservado; diagnóstico separa fato de hipótese. |
| T2: preservar destino | Tipo/destino antes; ausência da entrada local após | Inspeção do link, sem teste de pacote | Revisão independente pré-remoção | Operação atingiu somente entrada local; destino não foi removido. |
| T3: instalação congelada | Saída de `npm ci`, diretório local e hashes | Sem novo teste; instalação real é a prova de viabilidade | Revisão de scripts/permissões e política npm | Sem alterações globais, lockfile regenerado ou segredo nos logs. |
| T4: compatibilidade local | Caminhos reais locais e versões compatíveis | `check:lockfile`, `check:npm-tree`, resolução desde compilador | Conferir ausência de fallback compartilhado | Não confundir majors aninhados legítimos com erro. |
| T5: build íntegro | Build código zero, artefatos atualizados | `npm run build`, `npm run test` | Revisão independente de entrega | Git/hashes preservados; sem alegação de correção da raiz/release. |

Todos são **futuros**. Em Plan foram realizadas somente leituras, consultas documentais, inspeção de versões e sondagem de resolução sem carga do módulo, além da escrita autorizada dos documentos.

Validar por lote/marco, não a cada microação. Não repetir `type-check` depois de build sobre a mesma revisão sem dúvida concreta: o build já chama `vue-tsc`. `npm run verify` é o gate de pré-release e contém build, testes, cobertura, navegador, benchmarks, consumidores e checks; não é requisito desta recuperação operacional. Se o escopo futuro exigir release, executar o gate completo com autorização, revisar efeitos/temporários e não duplicar etapas sobre a mesma revisão. Este plano não declara gate de release verde.

## 7. Riscos, interrupção e recuperação

- **Crítico — instalação compartilhada:** `npm ci` limpa dependências existentes; nunca executá-lo sobre link externo. Revisão independente antes de T2.
- **Concorrência:** MaxCode ou outro processo pode recriar o link/alterar o ambiente. Rechecar imediatamente antes da instalação; parar se o contexto mudar.
- **Disponibilidade:** autenticação/rede/tarballs não comprovados. Pedir intervenção específica se faltar acesso; não registrar credenciais.
- **Ferramentas:** npm observado difere de `packageManager`; usar o instalado sem mudar configuração. Se falha for comprovadamente ligada à versão/política, documentar evidência e solicitar decisão de ferramenta.
- **Build/testes:** podem revelar problemas preexistentes independentes. Registrar fora do escopo; não modificar componentes para forçar conclusão verde.
- **Rollback limitado:** não restaurar automaticamente o link inconsistente. Após falha, manter isolamento/estado parcial documentado e decidir nova ação. Remoção de instalação própria exige confirmação de que é somente artefato desta execução e ausência de trabalho novo. Nunca apagar destino antigo.
- **Sem implantação/dados:** não há migração, serviço alterado ou rollout. Mudança é local e não versionada; commit de documentos ou integração só pelo fluxo autorizado do MaxCode.

Notificação de achados fora do escopo: `docs/notifications/wt-e84f0bff/notifications/achados-fora-do-escopo.md`. Não reproduzir segredos/dados pessoais em logs ou documentos.

## 8. Progresso, handoff e retomada em Execute

Somente na futura sessão Execute, com autorização de escrita correspondente, criar/atualizar `docs/plans/wt-e84f0bff/execution-state.json`. **Não foi criado nesta sessão Plan.**

Registro mínimo: SHA256 real dos bytes de `plan.md`; raiz/branch; revisão factual admitida (HEAD, estado local e hashes relevantes); tarefas T1–T5, dependências, estado, arquivos lidos/alterados/gerados, validações com comando, código de saída, revisão correspondente, data, bloqueios e próxima ação. Registrar após marcos e antes do handoff. Estados devem distinguir pendente, em andamento, concluído e bloqueado; validação manual pendente não equivale a concluído.

Na retomada: comparar SHA256 do plano, trabalho já realizado e revisão atual; revalidar somente evidências afetadas por mudanças. Executar lacunas, não reinstalar/retestar cegamente. Não reabrir decisões confirmadas sem nova evidência ou requisito. O arquivo de estado não substitui inspeção do código/instalação real.

Executor único é suficiente. Se houver delegação explícita futura, fornecer tarefa, raiz, restrições e referências às seções pertinentes, sem releitura integral compulsória. Somente revisão independente pode ocorrer em paralelo de leitura; todas as escritas/instalação/build seguem dependências e não devem concorrer. Revisões nos marcos de risco e entrega, não após cada microedição.

## 9. Revisão final do plano

- Pedido e entrevista atendidos: recuperação isolada, sem prevenção permanente ou reparo da raiz.
- Especificação precedeu o plano devido às múltiplas etapas de execução.
- Solução mínima: instalação correta antes de qualquer hipótese de alteração de código/versões.
- Invariantes explícitos: origem das dependências, hashes, contratos públicos e preservação do destino do link.
- Viabilidade tratada como hipótese verificável, com bloqueios de rede/scripts/ferramentas e próximas ações.
- Etapas sequenciais e matriz vinculam cada requisito a evidência observável e revisão por risco.
- Comandos citados identificados no projeto; nenhum gate executado ou resultado inventado.
- Não autoriza escrita fora da worktree, instalação em Plan, publicação ou operações Git.
- Retomada/handoff definidos sem criar `execution-state.json` nesta sessão.

**Aceite final:** isolamento + resolução compatível + hashes preservados + checks de lockfile/árvore + build + suíte unitária concluídos. Sem qualquer um desses itens, relatar conclusão parcial/bloqueio, não recuperação total.
