# Plano de execução — fixar Tiptap para liberar o gate do ENGEAPP

## 1. Identificação e instruções de retomada

- **Data:** 06/10/2026.
- **Projeto:** `@maxvue/max-components-ui`, versão atual `1.1.2`.
- **Worktree/branch:** `wt-86aa8cfc`, derivada de `dev`.
- **Raiz:** `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-86aa8cfc`.
- **Especificação:** `docs/plans/wt-86aa8cfc/spec.md`.
- **Estado:** planejado; somente documentos criados nesta sessão.

O executor deve ler este plano e a especificação na primeira admissão. Nas retomadas, consultar apenas trechos pertinentes e o registro de execução. Conferir trabalho já realizado, diferenças locais e validade das evidências antes de preencher lacunas. Não criar worktree, trocar branch, alterar a raiz principal ou investigar worktrees de outras sessões. Preservar trabalho alheio. Integração e limpeza ficam a cargo do MaxCode/usuário.

Este documento não autoriza implementação no modo Plan. Em Execute, implementar o escopo autorizado; comandos de instalação dependem de isolamento e autorização aplicáveis. Commit, merge, push, npm update/release e deploy continuam fora do escopo.

## 2. Problema, resultado e comportamentos preservados

O usuário relatou falha de `composer deploy:fast` no ENGEAPP, durante `local-libs:verify`, com 11 rejeições de versões flutuantes Tiptap na biblioteca local. O gate exige `3.31.3` literal; ter essa versão no lockfile ou em `node_modules` não substitui o requisito do manifesto.

**Resultado esperado:** biblioteca com requisitos diretos exatos e coerentes, teste de prevenção de deriva e compatibilidade efetiva dos editores verificada. Após integração autorizada, o consumidor pode aprovar o gate sem enfraquecê-lo.

**Preservar:** componentes e toolbars existentes; HTML/Markdown e `update:modelValue`; sincronização externa; estado `disabled`; alinhamento legado HTML; links, imagens, tabelas, paste/drop, sanitização e eventos de arquivo; imports públicos e externalização Vite; MaxUse via npm; MaxPinia como peer opcional; ausência de PrimeVue. Não aproveitar a manutenção para refatorar esses comportamentos.

**Fora de escopo:** outras dependências, atualização geral de versões, migração de editor, mudanças no ENGEAPP, servidor, banco, storage, filas, credenciais, release e deploy. Não adicionar camada de persistência nem novas stores; as exigências de uso do ecossistema Max não justificam dependências ou código de aplicação sem necessidade.

## 3. Evidências e limites da investigação

| Evidência inspecionada | Constatação |
|---|---|
| `pwd`, `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short` | Raiz/branch confirmadas; nenhuma alteração inicial reportada |
| `package.json:589–615` | 11 requisitos Tiptap flutuantes; `tiptap-markdown` permanece `^0.9.0` |
| `package-lock.json` | Formato 3; 34 entradas Tiptap resolvidas em `3.31.3`; requisitos raiz ainda flutuantes |
| `/home/johnattas/GitHub/engeapp/scripts/verify-tiptap-dependencies.mjs:7–26,46–179` | Exige manifesto literal dos 11 conhecidos; verifica todas as versões Tiptap do lockfile consumidor, peers, presença de core/TextAlign, cópias aninhadas e export runtime de TextAlign |
| `/home/johnattas/GitHub/engeapp/deploy.php:341–347` | Gate executado localmente: sincronização → integridade → Tiptap |
| ENGEAPP `package.json` e `package-lock.json` | `verify:tiptap` confirmado; `prebuild` executa integridade e Tiptap; 34 entradas Tiptap em `3.31.3` |
| ENGEAPP `storage/libs/MaxComponentsUi` | Link para a raiz principal MaxComponentsUi; manifesto reproduz versões rejeitadas |
| Worktree `node_modules` | Link para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`; instalação compartilhada, não isolada |
| `scripts/check-lockfile.mjs` | Rejeita links locais no lockfile, `legacy-peer-deps` ativo e divergência bidirecional dos requisitos raiz |
| `tests/architecture/runtimeDependencies.test.ts` | Testa classificação; proíbe `@tiptap/pm` direto; não protege pinning Tiptap atualmente |
| `tests/components/MaxInputHtml.test.ts`, `MaxInputMarkdown.test.ts` e respectivas toolbars | Testes existentes substituem editor/extensões por dublês; não comprovam exports e editor instalado |
| `src/components/MaxInputHtml.vue:333–425`, `MaxInputMarkdown.vue:315–412` | StarterKit desativa link/underline duplicados; imports nomeados de Table; HTML usa TextAlign customizado; Markdown usa `storage.markdown.getMarkdown()` |
| `vite.config.ts:46–52` | Dependências externas preservadas; correção precisa chegar ao manifesto distribuído/consumido |
| `vitest.config.ts`, `vitest.browser.config.ts`, `tests/setup.ts`, `tests/browser.setup.ts` | Happy DOM e Chromium; dedupe Vue/Pinia; bootstrap com Axios substituído no navegador e política de console |
| `tests/browser/fileChooserAndGraphAlternatives.browser.ts` | Padrão de montagem `createApp`, Pinia, host DOM e cleanup para teste real |
| `scripts/verify-consumers.mjs` e `package.json:556–582` | Gate completo e consumidores isolados; consumidor cria temporários, instala pacote e compila; há opção documentada de reutilizar build |
| `.gitignore:68–69`, AGENTS.md | Pastas worktree ignoradas; usar worktree pré-alocada e preservar integração pendente |

### Referências externas consultadas

- Documentação oficial via Context7, biblioteca `/ueberdosis/tiptap-docs`, instalação Vue 3: `https://github.com/ueberdosis/tiptap-docs/blob/main/src/content/editor/getting-started/install/vue3.mdx`.
- Registro npm: consulta somente leitura a `https://registry.npmjs.org/@tiptap%2f<nome>/3.31.3` para os 11 pacotes; todos publicados nessa versão. Core exige pm exato; extensões requerem core, pm ou table nessa mesma versão; Vue 3 aceita Vue `^3.0.0` e exige core/pm `3.31.3`.
- `tiptap-markdown@0.9.0` declara peer core `^3.0.1` no lockfile, intervalo compatível com o alvo. Essa compatibilidade declarada não substitui teste real.

A documentação geral não é específica de um snapshot `3.31.3` e sugere pm direto para projeto novo. Neste repositório, não segui-la contra o contrato já confirmado: pm permanece transitivo. A exigência de versões exatas vem do gate do ENGEAPP, não foi inferida como regra universal Tiptap.

Não foram executados testes, gates, build, instalação ou deploy. Não foi auditado todo o ambiente produtivo, nem garantido que a árvore física inteira corresponde ao lockfile. A leitura das bibliotecas/ambiente foi direcionada ao defeito; não houve auditoria geral de segurança. Achado documental fora de escopo está registrado em `docs/notifications/wt-86aa8cfc/notifications/max-components-ui-inventario-text-align.md`.

## 4. Solução e decisões

### Confirmadas pelo pedido e pelos contratos

1. Usar somente a worktree existente para alterações.
2. Manter a versão-alvo literal `3.31.3` em todos os 11 itens da tabela da spec.
3. Manter requisitos e grafo coerentes, sem desativar gates nem usar `--force`/`--legacy-peer-deps` para ocultar conflitos.
4. Não alterar a versão do pacote nem publicar para resolver uma falha de manifesto local.

### Proposta de implementação mínima

- Modificar os 11 valores em `package.json` e os 11 correspondentes em `package-lock.json`, bloco raiz. Como o grafo já está em `3.31.3`, uma edição limitada dos requisitos raiz é suficiente se a revalidação não mostrar mudanças. Não editar `resolved`, `integrity` ou peers publicados, nem regenerar o lockfile inteiro sem necessidade causal.
- Acrescentar testes no arquivo arquitetural existente, sem novo gate/script de deploy.
- Acrescentar um arquivo de navegador real para os dois componentes. Não substituir Tiptap, suas extensões ou serializador nesse teste; usar fixture sem dados reais, URLs sem acesso externo e instalação resolvida da worktree.

### Alternativas descartadas

- Apenas instalar Tiptap: não corrige os intervalos rejeitados do manifesto.
- Corrigir só core/TextAlign: restariam nove rejeições diretas.
- Relaxar o gate ou pular `prebuild`: enfraquece um contrato explicitamente exigido pelo consumidor.
- Adicionar overrides como primeira medida: grafo atual já alinhado; seria complexidade e alteração de resolução não demonstradas como necessárias.
- Migrar para outra versão/serializador ou adicionar pm direto: amplia escopo e contraria testes/política existentes.
- Reapontar o link do ENGEAPP para testar: altera consumidor e pode introduzir artefato temporário no fluxo de deploy; não necessário para esta entrega.

## 5. Tarefas ordenadas

### T1 — Preflight de retomada e isolamento (bloqueia execução dependente)

**Por leitura:** confirmar raiz/branch, alterações locais, 11 requisitos, entradas raiz e transitivas do lockfile, versão-alvo/lista do gate consumidor e links efetivos. Ler scripts e eventuais prehooks atuais antes de executá-los. Conferir versões efetivas de Node/npm contra `engines` e `packageManager`, resolução de Vue/Pinia/Axios/MaxUse, bootstrap e Chromium disponível.

O `node_modules` compartilhado é risco real: comandos npm e ferramentas podem escrever cache ou modificar a instalação principal. Não executar instalação, limpeza ou validação que escreva nesse alvo. Solicitar/provisionar instalação isolada dentro da própria worktree segundo autorização de Execute e suporte do MaxCode; manipulação do link deve ser exclusivamente local, sem seguir/remover seu destino e sem cópia de `.env`. Se não houver mecanismo permitido, registrar bloqueio com próxima ação: obter isolamento autorizado da instalação desta worktree.

Os testes deste lote não precisam de banco/filas/storage. Verificar que o harness não acessa serviços reais, que o adapter Axios é da instância usada pelos componentes e que o bootstrap usa a mesma Pinia/Vue; dados de teste somente sintéticos. Não reconfigurar peers opcionais nem incorporar MaxPinia obrigatório por conveniência do harness.

**Conclusão:** ambiente seguro para escrita de caches/builds/testes, sem instalação compartilhada, e baseline documental revalidado. Divergência relevante exige diagnóstico, não suposição de que o estado de 06/10/2026 continua válido.

### T2 — Manifesto e lockfile

**Arquivos:** `package.json`, `package-lock.json`.

1. Fixar os 11 requisitos listados na spec em `3.31.3` literal.
2. Sincronizar as mesmas chaves em `packages[""].dependencies`.
3. Conferir por leitura que as entradas resolvidas Tiptap continuam no alvo e que o grafo não mudou sem justificativa; manter `tiptap-markdown`, demais versões, classificação, versão do pacote e metadados intactos.
4. Se o grafo estiver divergente na retomada, parar para diagnosticar dependência/peer responsável e obter autorização necessária para resolver, sem atualização geral ou bypass.

**Conclusão:** diff restrito e requisitos raiz idênticos ao manifesto. Ainda não executar tipos, teste ou build por microedição.

### T3 — Testes de contrato e runtime

**Existente:** `tests/architecture/runtimeDependencies.test.ts`.

- Lista explícita dos 11 pacotes esperados: exigir presença em `dependencies` e valor literal `3.31.3` para cada um, evitando teste que ignore um pacote removido.
- Percorrer também requisitos diretos `@tiptap/*` para que uma futura adição flutuante não escape.
- Ler lockfile e exigir os requisitos raiz iguais aos do manifesto; exigir entradas resolvidas dos 11 diretos e coerência de versão de todas as entradas `@tiptap/*`, inclusive aninhadas e pm transitivo.
- Conferir peers core/pm quando presentes contra o contrato publicado aplicável, aceitando formatos compatíveis demonstrados e sem editar metadados para fazer passar.
- Preservar testes de proibição de pm direto e MaxPinia opcional. Asserções com nome/caminho do pacote devem facilitar diagnóstico.

**Novo proposto:** `tests/browser/tiptapEditorsCompatibility.browser.ts`.

- Seguir montagem, bootstrap e limpeza dos testes de navegador existentes. Os componentes reais devem montar com editor/extensões reais; dublês de ícone ou infraestrutura não relevante não podem mascarar Tiptap. Não silenciar warnings gerais.
- HTML: carregar texto inicial com `ql-align-justify`, conferir preservação sem exigir igualdade byte a byte de HTML normalizado; editar e observar `update:modelValue` em HTML; atualizar prop externamente; conferir TextAlign, link seguro e tabela no editor.
- Markdown: carregar conteúdo com marcação/lista, editar e conferir saída Markdown pelo serializador real; atualizar prop externamente; conferir tabela/link em fixtures suportadas pelo contrato atual.
- Ambos: `disabled` muda editabilidade, conteúdo permanece; desmontagem limpa editor/DOM; não há erro de export, extensão duplicada nem erro não tratado no console.
- Usar refs/exposição existentes e asserções de resultado; aguardar inicialização por condição com timeout limitado, não espera indefinida. Não adicionar nova API pública para facilitar teste.

**Conclusão:** todo o lote e os testes prontos antes da validação completa. Se o teste real revelar bug anterior, estabelecer causalidade; não corrigir produção silenciosamente fora deste plano.

### T4 — Revisão e validação consolidada

Revisar diff e contratos antes de executar. A revisão deve conferir ausência de mudanças em produção, dependências não relacionadas, gate consumidor e dados sensíveis. Revisão independente pelo responsável/revisor no marco de entrega é recomendada; não iniciar agentes paralelos sem autorização pertinente.

Comando confirmado no projeto, a executar somente em Execute após T1:

```bash
npm run verify
```

Esse agregado inclui integridade de nomes/lockfile/SVG, tipos da biblioteca/testes, lint, build, testes unitários, cobertura, navegador, bundle playground, benchmarks, consumidores, árvore npm e audit. Não repetir suas etapas isoladamente sobre a mesma revisão por rotina. O próprio agregado contém repetição de testes para cobertura; não alterar o pipeline nesta tarefa.

Antes do agregado, configurar o diretório temporário dos consumidores dentro de área segura da worktree pelo suporte `CONSUMER_TEMP_DIR`. Se reutilizar o build com `SKIP_BUILD=1`, fazê-lo somente para `verify:consumers` dentro do agregado que já produziu build fresco da mesma revisão; isso não autoriza omitir gates. Não alterar scripts para otimizar este lote.

Gate de integridade falhado bloqueia validações dependentes; não contorná-lo com comando direto, `ignoreConfig` ou remoção de prehook. Guardar saída e exit code reais. Uma falha requer diagnóstico agrupado de ambiente/harness ou causalidade do lote. Corrigir falhas autorizadas em lote; reexecutar o que perdeu validade. Para entrega com falha no agregado, repetir o agregado após correção pertinente, sem ocultar a execução anterior. Não atribuir baseline sem evidência e não ampliar escopo automaticamente.

**Conclusão:** resultados vigentes do gate para o conteúdo final ou bloqueio explícito com ação concreta. Não chamar validação parcial de completa.

### T5 — Handoff e confirmação no consumidor (dependência externa)

1. Entregar alterações sem commit/merge/push. Informar que o ENGEAPP ainda aponta para a raiz principal enquanto MaxCode não integrar esta branch.
2. A integração deve ser feita pelo MaxCode/usuário quando solicitada; não escrever diretamente na raiz nem alterar link do consumidor.
3. Após integração autorizada, conferir por leitura no ENGEAPP que o caminho efetivo da biblioteca contém o manifesto corrigido, lockfile consumidor está alinhado e core/TextAlign/cópias aninhadas respeitam `3.31.3`. Conferir hooks e scripts de integridade atuais.
4. Com autorização operacional no consumidor, executar os comandos já existentes, sem sincronizador mutável ou deploy nesta tarefa:

```bash
npm run verify:local-libs
npm run verify:tiptap
```

Executá-los na raiz do ENGEAPP, nessa ordem; falha de integridade interrompe o gate dependente. Revalidar por leitura os scripts antes, pois a implementação de `verify:local-libs` não foi auditada integralmente nesta sessão. Se for necessária sincronização que escreva arquivos, instalação ou mudança de lockfile do ENGEAPP, obter autorização separada em worktree do consumidor, sem improvisar alterações na raiz.

O segundo comando deve verificar o export de TextAlign de verdade e terminar com código 0. Não usar fixture/dublê como prova do gate real do consumidor. O novo deploy fica a cargo do usuário e não é condição para executar esta manutenção. Registrar `manualPending` até o gate real, mesmo que a biblioteca esteja validada.

**Conclusão:** duas entregas distinguíveis: biblioteca validada; consumidor confirmado após integração. Sem prova da segunda, não declarar liberação efetiva de deploy.

## 6. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência necessária | Testes/checks | Revisão pelo risco | Verificação manual |
|---|---|---|---|---|
| T1: ambiente seguro | Links/resoluções e scripts revalidados; instalação isolada | Preflight por leitura; sem teste intermediário nesta fase | Não escrever em node_modules compartilhado; identidade Vue/Pinia/Axios | Responsável autoriza provisionamento se necessário |
| T2: 11 versões exatas | Diff manifesto + bloco raiz do lockfile | Teste arquitetural novo e `check:lockfile` dentro de `verify` | Ausência de alteração em integridades, versão da lib e dependências externas ao lote | Nenhuma necessária além da revisão |
| T3: grafo sem deriva | 11 diretos presentes; todos os Tiptap resolvidos no alvo | Asserções sobre manifesto/lockfile; árvore npm no agregado | Não reintroduzir pm direto nem relaxar peers | Conferir fixture contra contratos preservados |
| T3: runtime preservado | HTML/Markdown editáveis e serialização real sem erros | Teste novo Chromium; testes antigos de componentes/toolbars | Dublês não cobrem editor; não silenciar console | Inspeção de HTML legado/tabela/link se falha exigir diagnóstico |
| T4: entrega validada | Comando, hash da revisão, logs e exit code 0 | `npm run verify` completo | Revisão final de escopo e regressões; audit não pode ser ignorado | Pendência explícita se browser/rede não disponíveis |
| T5: consumidor aceita revisão | Manifesto integrado, integridade e gate Tiptap reais aprovados | Comandos do ENGEAPP acima, depois da integração | Nenhum bypass, link temporário ou deploy de teste | Responsável executa/confirma; `manualPending` enquanto ausente |

## 7. Riscos, interrupções e recuperação

- **Instalação compartilhada:** principal bloqueio operacional identificado. Isolar antes de validação/instalação; não remover destino do symlink nem alterar raiz principal.
- **Integração não realizada:** executar o gate ENGEAPP cedo demais testa outro conteúdo. Handoff deve identificar branch/revisão aguardando MaxCode.
- **Deriva transitiva:** testes do lockfile evitam versão divergente futura; futuras atualizações Tiptap exigirão coordenar alvo com o consumidor, não apenas remover `^`.
- **Dublês insuficientes:** unitários atuais não comprovam export real; teste navegador fecha essa lacuna sem migrar componentes.
- **Baseline/harness:** diagnóstico de console, resolução e bootstrap agrupado antes de repetir testes equivalentes; preservar falha e próxima ação concreta se causa não estiver no lote.
- **Dependências externas:** consumidor temporário, audit e registro npm dependem de rede; Chromium precisa estar disponível. Ausência é bloqueio verificável, não aprovação presumida.
- **Recuperação:** sem migração de dados; corrigir/reverter apenas o diff desta tarefa por fluxo autorizado. Não descartar trabalho de terceiros nem restaurar versões flutuantes no consumidor como solução operacional. Nenhum segredo ou `.env` é necessário.
- **Concorrência:** execução sequencial simples é preferível para este lote pequeno. Eventual delegação autorizada deve separar arquivos de escrita (contrato vs navegador), fornecer referências e contexto mínimo, e aguardar todos os implementadores antes dos gates.
- **Cancelamento:** preservar resultados parciais, falhas e pendências; não declarar conclusão total nem remover trabalho pendente. Tarefas assíncronas devem aguardar evento/conclusão com limites, sem polling repetitivo sem informação nova.

## 8. Registro de execução e retomada

Somente durante Execute, registrar marcos e handoff em `docs/plans/wt-86aa8cfc/execution-state.json`; este arquivo não foi criado nem é autorizado para escrita nesta sessão Plan.

Usar `version: 2`, SHA256 real de `plan.md` e tarefas com estado, arquivos afetados e revisão factual. `verification` deve conter `revision` (SHA256 real dos conteúdos relevantes, com método de composição registrado) e `checks` com `command`, `revision`, `result` e `exitCode` quando cabível. `passed` exige exitCode 0; `failed` exige inteiro não zero; `pending` não aceita exitCode. Registrar apenas comandos realmente executados, todos os resultados e falhas, inclusive do agregado. Não inferir código de saída ou aprovação de `tool:end.ok`.

Checks vazios, falha vigente ou resultado sem correspondência com o conteúdo atual impedem validação integral. Registro autodeclarado não prova execução nativa nem detecta comandos omitidos. Version 1 continua compatível, mas não comprova validação integral automaticamente. `manualPending` identifica consumidor/browser ou outro aceite manual pendente, com responsável e próxima ação.

Na retomada, conferir hashes reais, diferenças e tarefas já realizadas; reaproveitar checks aprovados da mesma revisão quando pertinentes. Não repetir automaticamente todo o trabalho nem reabrir decisões sem evidência nova. Persistência da mesma falha sem progresso exige diagnóstico antes de nova execução equivalente.

## 9. Revisão final do plano

- Causa identificada por contrato do consumidor e manifesto real, sem confundir resolução instalada com requisito desejado.
- Solução limitada a pinning, coerência e testes; preserva APIs/produção e gates.
- Spec precedeu a escrita do plano; tarefas sequenciais possuem conclusão observável e dependência de isolamento.
- Todos os comandos de validação citados existem nos manifestos inspecionados; nenhuma aprovação de teste foi inventada.
- Matriz cobre requisitos, revisão e confirmação real do consumidor.
- Integração externa e instalação compartilhada estão explicitamente separadas do aceite local.
- Somente spec, plano e notificação foram autorizados nesta sessão; nenhum código ou registro de Execute foi escrito.
