# Plano de execução — dez novos inputs de domínio

Data: 16/10/2026. Projeto: `@maxvue/max-components-ui`. Worktree/branch: `wt-9a811fd4`.

## 1. Objetivo, autorização e documentos

Criar futuramente dez seletores especializados, fundamentados nos inputs usados no engeapp, MaxAiManager e SocialMedia, sem duplicar os vinte nomes reservados pelo usuário. A entrega desta sessão é somente o planejamento. Implementação, instalações, serviços e operações Git não estão autorizados por este documento.

Especificação normativa: `docs/plans/wt-9a811fd4/spec.md`. Ler especialmente a tabela D01–D10, os contratos comuns e as exclusões antes de implementar. Os nomes, valores e decisões são propostas para revisão, não requisitos anteriormente confirmados pelo usuário além do objetivo e das restrições.

Raiz única para execução autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-9a811fd4`. Não criar worktree, mudar branch nem editar árvores principais/irmãs. Não realizar commit, merge, push, publicação ou limpeza da worktree; integração e limpeza pertencem ao MaxCode/usuário.

## 2. Resultado esperado e preservação

| Tarefa | Componente proposto | Efeito para quem usa |
|---|---|---|
| D01 | `MaxInputPhase` | Selecionar uma, duas ou três fases elétricas. |
| D02 | `MaxInputWireSize` | Selecionar a seção de um condutor em mm², com busca. |
| D03 | `MaxInputWireType` | Selecionar material e isolamento do cabo juntos. |
| D04 | `MaxInputAiExecutionType` | Escolher execução em nuvem ou local. |
| D05 | `MaxInputAiBillingMode` | Escolher a categoria de cobrança do modelo. |
| D06 | `MaxInputAiBillingUnit` | Escolher a unidade usada em uma regra de preço. |
| D07 | `MaxInputPaymentMethod` | Selecionar PIX ou cartão de crédito. |
| D08 | `MaxInputScheduleType` | Selecionar a estratégia do agendamento. |
| D09 | `MaxInputMonthOccurrence` | Selecionar da primeira à quinta ocorrência de um dia no mês. |
| D10 | `MaxInputContentType` | Escolher o tipo do conteúdo base editorial. |

Preservar todos os componentes, classes legadas `.p-*`, aliases e contratos existentes. Não adicionar PrimeVue. Não alterar persistência, cache, regras de negócio, dados, aplicativos consumidores ou bibliotecas irmãs. A adoção nas telas será outro escopo, após publicação/integração autorizadas; as referências a telas neste plano são evidência e futuros pontos de adoção, não arquivos a editar.

Os novos componentes devem seguir `AGENTS.md`: template → script setup TypeScript → SCSS scoped; tags de abertura em linha única; script com recuo base de quatro espaços; aspas simples, ponto e vírgula e ausência de vírgula final. Classes novas `.max-*`, tokens semânticos, visual compacto, Quicksand e foco acessível herdados da biblioteca.

## 3. Evidências e viabilidade

### Fontes lidas

- `spec.md`, seções 1–5: identificação, bases Git, inventário dos três projetos, tabela de fontes e contratos; as linhas das evidências estão na seção 3.1 da spec.
- Biblioteca: `src/components/MaxInputSelect.vue` (props, slots, combobox, teclado, watchers e limpeza), `InputBase.vue` e `base/inputBaseContext.ts` (id/ARIA/feedback); `MaxInputUF.vue` e `MaxInputTypeAddress.vue` (precedentes de seletores especializados); `MaxInputNumber.vue` (contraste com seleção numérica).
- Distribuição: `src/index.ts`, `src/helpers/MaxComponentsUiResolver.ts`, `src/scripts/generateResolver.ts`, `vite.config.ts`, `package.json`, `package-lock.json`, `.gitignore`.
- Testes: `tests/components/MaxInputUF.test.ts`, `tests/index.test.ts`, `tests/helpers/resolver.test.ts`, `tests/architecture/package-exports.test.ts`, `tests/architecture/playgroundCoverage.test.ts`, `tests/browser/inputBaseMatrix.browser.ts`, `tests/setup.ts`, `vitest.config.ts`, `vitest.browser.config.ts`.
- Demonstração e gate: `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `playground/src/main.ts`, `scripts/verify-consumers.mjs`, `scripts/verify-package-consumer.mjs`.
- MaxUse: busca direcionada em `/home/johnattas/GitHub/MaxUse/src`; MaxPinia: `/home/johnattas/GitHub/MaxPinia/src/types.ts`. Nenhuma dessas árvores foi modificada. Consulta oficial Vue 3 registrada na spec.

### Fatos que afetam a execução

1. O select usa igualdade estrita para localizar opções (`:406-424`); números devem continuar números. O watcher interno emite atualizações (`:324-339`), e a limpeza já emite `update:modelValue`, `change` e `clear` (`:592-598`). O wrapper precisa impedir ecos e não registrar listeners duplicados.
2. O teste de arquitetura exige exports explícitos para cada SFC público e hoje verifica 127 componentes (`package-exports.test.ts:186-210`). Não basta confiar no wildcard do pacote. O base privado em subpasta não entra na descoberta do gerador/build.
3. O playground exige cobertura total do manifesto e fixa 36 cenários (`playgroundCoverage.test.ts:28-37,108-118`). Acrescentar exemplos ao cenário existente `inputs-select.vue`, sem criar cenário adicional ou relaxar essa cobertura.
4. A suíte de exports exige dist fresco. O gate `verify` já faz build antes dos testes; não começar pela suíte completa sobre dist antigo.
5. `node_modules` é symlink; o destino e a identidade efetiva de Vue, Pinia, Axios e MaxUse não foram validados. Os aplicativos usam bibliotecas em `storage/libs`, não necessariamente o mesmo conteúdo dos repositórios irmãos. Não usar esses aplicativos como ambiente de teste compartilhado.
6. `verify:consumers` cria consumidores temporários, instala pacotes e faz build. `verify` também consulta árvore npm e auditoria remota. Esses efeitos só cabem na execução futura com autorização operacional; não ocorreram durante o planejamento.

### Decisões, alternativas e limites

- Proposta: dez seletores de catálogo fechado, todos compondo `MaxInputSelect`, com um adaptador privado compartilhado. Não criar uma infraestrutura de formulários ou uma segunda máquina de estados de overlay.
- Proposta: catálogos locais em quatro arquivos, sem stores/GET novos. MaxPinia continua responsável por dados remotos e salvamento nas aplicações; MaxUse continua a origem de helpers quando necessários. Estado efêmero de demonstração permanece local; isso não substitui stores de página.
- Proposta: sem seleção automática/default de negócio; vazio na entrada aceita `''`/`null`/ausência e limpar emite `null`. Catálogos são fechados para impedir divergência acidental dos contratos identificados.
- D09 usa rótulo “5ª ocorrência”, não “Último”. O backend consultado conta ocorrências e retorna nenhuma data se a quinta não existir. O input não calcula calendário. Não introduzir um sentinela para “último”.
- D07 não inclui boleto, débito ou transferência sem nova evidência/requisito. D06 espelha o catálogo de UI observado; o backend aceita string, portanto não afirmar que esse é um enum global completo do servidor.
- Não propor novos controles para URL, senha, percentual, tempo ou tokens. Arquétipo/tom de voz permanecem livres; seleção de provedor/modelo/usuário depende de dados e permissões e não foi escolhida.
- Não há exigência de credenciais de fornecedor, anexos, correlação de jobs ou migração neste lote. Não criar essas dependências artificialmente.

## 4. Execução ordenada

### P00 — Preflight e conferência de trabalho existente

Resultado: base segura e contratos revalidados, antes de qualquer implementação.

1. Ler `AGENTS.md`, a spec e este plano na primeira admissão. Conferir `git status`, branch e raiz; preservar mudanças alheias. Revalidar se D01–D10 continuam ausentes. Se existir implementação concorrente do mesmo domínio, interromper a duplicação e pedir orientação; não visitar outras worktrees.
2. Ler scripts, pre/post-hooks e lockfile vigentes. Confirmar por leitura a resolução efetiva das dependências, destino do symlink e disponibilidade dos executores; não instalar pacotes nem reconfigurar bibliotecas sem autorização. A biblioteca deve continuar consumindo MaxUse via npm, nunca `file:../MaxUse`.
3. Conferir bootstrap de testes: Vue/Pinia únicos, mocks locais de storage/fetch e Axios correto se algum harness de store for usado. Não exercitar servidor real. Banco, filas e storage de aplicativos não participam; se passarem a participar, parar até comprovar isolamento e autorização.
4. Conferir gerador e runner antes de regenerar o manifesto. O comando canônico do projeto é `npx tsx src/scripts/generateResolver.ts`; não permitir download implícito se o runner não estiver disponível. Falta de ferramenta vira pendência com próxima ação, não instalação silenciosa.
5. Identificar onde está o schema nativo de `execution-state.json` versão 2 e seus mecanismos de registro. Não adivinhar campos adicionais. Revalidar fontes da tabela D01–D10 sem abrir configurações sensíveis.

Conclusão: preflight documentado, nenhum impedimento de integridade ignorado. Gate de biblioteca falhado bloqueia validações dependentes; não contornar com comando direto, `ignoreConfig` ou remoção de hooks.

### P01 — Contratos, catálogos e composição interna

Novos: `src/types/domainInputs.ts`; quatro catálogos da seção 3.3 da spec; `src/components/base/MaxDomainSelect.vue`; `tests/components/MaxDomainSelect.test.ts`.

1. Definir os tipos exatos e interfaces comuns da spec. Manter API pública estrita; não importar DTOs, aliases `@stores` ou código dos consumidores.
2. Transcrever valores e ordem dos catálogos comprovados, com rótulos pt-BR. Não confundir seção com diâmetro, material com isolamento ou cobrança com pagamento.
3. Compor o select no base privado; desabilitar herança automática de attrs e encaminhá-los uma vez. Tratar variantes camel/kebab dos atributos reservados. Não tirar snapshot não reativo dos attrs; alterações do pai devem chegar ao filho.
4. Implementar slots, prioridade de feedback, valor externo desconhecido escapado e controle dos eventos conforme spec. Não alterar o select/base existentes para acomodar o wrapper. Se houver limitação impeditiva, registrar evidência e suspender a parte dependente até decisão.
5. Escrever testes do adaptador com montagem real do select para a trilha de eventos e testes isolados para o forwarding; garantir que catálogos não sejam mutados nem compartilhados como estado de formulário.

Conclusão por leitura: contratos e testes escritos para todo o comportamento comum. Não executar testes/tipos/build por microedição.

### P02 — Dez componentes e regressões por domínio

Novos: os dez `src/components/<Componente>.vue` e dez `tests/components/<Componente>.test.ts` com nomes da tabela.

1. Cada wrapper declara seus props/emits públicos e label padrão, usa o base privado e estreita os valores aceitos/emitted. Todos os wrappers preservam slots `value/option`.
2. D01–D03 mantêm números e códigos elétricos. Busca padrão só em D02. Rótulos de D02 em mm²; D03 preserva informação de isolamento.
3. D04–D07 não acionam execução de IA, cobrança ou transação financeira; só retornam um valor técnico. D05 e D07 têm tipos e catálogos diferentes.
4. D08–D10 não alteram objetos de regra/conteúdo do pai. D09 não oferece “último”; D10 não faz upload nem valida URL.
5. Escrever casos para todas as opções e todos os estados comuns, além dos casos específicos da matriz de aceite.

Conclusão por leitura: exatamente os dez novos inputs, sem nomes reservados, com testes completos escritos. Corrigir divergências do lote antes de começar validação executável.

### P03 — Integração pública e distribuição

Existentes: `src/index.ts`, `package.json`, `src/components-manifest.json`, `tests/index.test.ts`, `tests/helpers/resolver.test.ts`, `tests/architecture/package-exports.test.ts`, `scripts/verify-consumers.mjs`.

1. Exportar dez componentes e tipos públicos pela raiz. Não exportar o base interno. Adicionar dez entradas explícitas `./components/<Nome>` com `types` em `./dist/components/<Nome>.vue.d.ts` e `import` em `./dist/components/<Nome>.es.js`; não alterar versão/dependências.
2. Regenerar manifesto pelo processo existente após todos os SFCs. Inspecionar o diff e preservar aliases/componentes de outras alterações locais. Resolver já lê esse manifesto; não reescrevê-lo.
3. Ampliar asserções de root exports/resolver e atualizar a contagem arquitetural de 127 para 137 somente se essa continuar sendo a base. Preservar comprovação por componente, declarações e arquivos em dist.
4. Estender os cenários do gate de consumidores para importar os dez pela raiz e pelos subpaths, compilar tipos e renderizar ao menos um de cada grupo em SSR. O gate deve provar uso dos artefatos empacotados, não somente imports de `src`.

Conclusão por leitura: catálogo público, subpaths, manifesto e casos do consumidor consistentes. Não executar publicação nem instalar o pacote em aplicativos reais.

### P04 — Demonstração, documentação, tipos e navegador

Existentes: `playground/src/catalog.ts`, `playground/src/scenarios/inputs-select.vue`. Novos: `docs/INPUTS-DOMAIN.md`, `tests/types/domainInputs.test.ts`, `tests/browser/MaxDomainInputs.browser.ts`.

1. Registrar dez itens no catálogo, todos ligados ao cenário existente `inputs-select`; manter os 36 cenários.
2. Mostrar os dez em blocos identificáveis, seleção/vazio, limpar, erro e disabled. Usar MaxGrid e componentes da biblioteca. Não mexer no bootstrap nem criar stores remotas para exemplos estáticos.
3. Documentar tabela completa de valores, props, defaults, eventos, slots, exemplos e distinções entre componentes. Avisar sobre quinta ocorrência, catálogo de pagamento restrito e dependência de validação do consumidor.
4. Testes de tipos devem aceitar contratos corretos e conter `@ts-expect-error` para valores e payloads incompatíveis. Asserções de tipos não podem existir apenas em runtime; devem participar de `type-check:test`.
5. No navegador, montar os dez com identidades distintas, conferir label/ARIA/foco, abrir por teclado, selecionar e limpar, verificar busca D02, overlay em viewport estreita, estados e claro/escuro. Não alterar a matriz canônica existente fixada em 25 famílias; criar cobertura adicional própria.

Conclusão por leitura: documentação, exemplos e testes do escopo inteiro implementados antes dos comandos de validação.

### P05 — Revisão e validação do lote

1. Revisar diffs e contratos, preferencialmente com revisão independente em P01 e na entrega se houver autorização para delegar. Conferir riscos de model/eventos, artefatos públicos e acessibilidade. Não presumir autorização de subagentes.
2. Após todo o lote pronto e autorização operacional para rede/instalações temporárias, executar `npm run verify` na worktree. Ele é o gate completo; não repetir separadamente seus tipos, lint, build, unitários, cobertura, navegador e benchmarks sobre o mesmo conteúdo sem falha ou dúvida concreta.
3. O gate recompila internamente em `verify:consumers`; não criar execução extra de build como atalho. Se efeitos operacionais não estiverem autorizados, registrar validação pendente e pedir somente a autorização faltante. Não afirmar aceite integral com um gate parcial.
4. Diante de falhas, diagnosticar em grupo código versus harness/bootstrap versus baseline. Corrigir o conjunto causal e revalidar etapas afetadas. Repetição da mesma falha sem progresso exige diagnóstico, não novas tentativas cegas. Nunca reduzir thresholds, retirar asserções ou ignorar integridade.
5. Validação manual futura com `npm run dev:playground`: conferir os dez, claro/escuro, larguras 240/320/768 px e desktop, teclado/foco/overlay. Não abrir servidores consumidores nem acessar dados reais. Encerrar apenas o processo de playground iniciado por esta execução quando terminar.
6. Revisar diff final e conferir critérios da matriz. Registrar comandos/códigos de saída verdadeiros e pendências; não concluir sucesso com verificações ausentes, falhando ou sem revisão vigente.

## 5. Matriz de aceite por tarefa

Os testes abaixo são futuros; nenhum foi executado nesta sessão.

| Tarefa/requisito | Evidência de origem | Teste/artefato pertinente | Revisão pelo risco e verificação manual |
|---|---|---|---|
| P00: isolamento e integridade | raiz/branch, scripts, symlink e lock citados | leitura dos caminhos resolvidos e gates de integridade do verify | Bloquear dependências inválidas; nenhum serviço compartilhado. |
| P01: contrato comum | Select `:324-339,406-424,592-598`; InputBase/contexto | `MaxDomainSelect.test.ts`: attrs dinâmicos, slots, prioridade de erro, desconhecidos, eventos reais sem eco, limpeza única, duas instâncias | Revisar duplicação de listeners e coerção; manual foco/ARIA/feedback. |
| D01: fases | spec D01 | `MaxInputPhase.test.ts`: `1/2/3`, sem string numérica ou seleção automática | Confirmar monofásico/bifásico/trifásico e model numérico no playground. |
| D02: seção | spec D02 | `MaxInputWireSize.test.ts`: 24 valores, `0.5/0.75/1.5`, mm², busca e imutabilidade | Revisar precisão e diferença para diâmetro; buscar e selecionar 2,5 mm². |
| D03: material/isolamento | spec D03 | `MaxInputWireType.test.ts`: quatro códigos, 70/90 e cobre/alumínio | Conferir que trocar só isolamento muda código sem perder material. |
| D04: execução | spec D04 | `MaxInputAiExecutionType.test.ts`: `cloud/local`, sem alteração de outros dados | Confirmar que só seleção muda; não há requisição de execução. |
| D05: modo de cobrança | spec D05 | `MaxInputAiBillingMode.test.ts`: quatro códigos, inclusive `free/local` distintos | Conferir labels e separação de meio de pagamento. |
| D06: unidade | spec D06 | `MaxInputAiBillingUnit.test.ts`: sete códigos; `m_tokens` diferente de `tokens` | Revisar “por milhão” versus por token, sem conversão/calculadora. |
| D07: pagamento | spec D07/enum PHP | `MaxInputPaymentMethod.test.ts`: dois códigos, vazio/clear e sem chamadas HTTP | Conferir PIX/cartão e ausência de cobrança/integração real. |
| D08: estratégia | spec D08/controller | `MaxInputScheduleType.test.ts`: quatro códigos e nenhuma mutação do objeto de regra | Trocar seleção sem geração/eliminação de dados de agenda pelo componente. |
| D09: ocorrência | spec D09/serviço | `MaxInputMonthOccurrence.test.ts`: números 1–5; texto da quinta não contém “Último” | Revisar incompatibilidade semântica registrada; input não decide se há quinta data. |
| D10: conteúdo | spec D10/store | `MaxInputContentType.test.ts`: cinco códigos; nenhum arquivo/URL processado | Conferir retorno do tipo sem upload nem mudança de conteúdo existente. |
| D01–D10: padrão comum | spec 3.2 | Cada teste: opções completas, labels, vazio, prop externa, disabled, required, erro/caution/done, attrs e slots | Não depender só de mocks; browser exercita combobox real dos dez. |
| P03: API pública | index/manifesto/exports/gerador/build | testes index/resolver/arquitetura e consumidores empacotados estendidos | Nenhum base privado público, alias perdido ou subpath sem declarações. |
| P04: tipos e documentação | convenções e contrato da spec | `domainInputs.test.ts`, `MaxDomainInputs.browser.ts`, cobertura do playground | Exemplos correspondem à API, sem “último”, opções ou integrações fictícias. |
| P05: entrega validada | scripts do package e matriz anterior | `npm run verify` aprovado na revisão vigente e checklist manual registrado | Checks faltantes/bloqueados não equivalem a sucesso; registrar manualPending quando necessário. |

## 6. Riscos, operação e recuperação

- Modelo/eventos: loops, emissão duplicada ou substituição de desconhecidos podem acionar autosave do consumidor. Evitar watchers emissores extras, conferir eventos reais e preservar valor externo sem correção silenciosa.
- Compatibilidade: catálogos são extraídos de aplicações e podem evoluir. Não apresentar enums UI como garantias universais. Revalidar as referências antes de executar; contratos novos só são adotados nas telas em tarefa separada.
- Catálogo e distribuição: dez adições tocam arquivos compartilhados com outras sessões. Um único integrador deve editar exports, manifesto, package e playground após os componentes; não substituir arquivos inteiros nem remover conteúdo concorrente.
- Dependências: nenhuma nova dependência planejada. Não resolver problemas de instalação atualizando versões, links ou lockfile sem autorização e evidência causal.
- Performance: listas de no máximo 24 opções; não adicionar virtualização própria, carregamento remoto ou dependências pesadas. Preservar benchmarks do gate.
- Segurança: valores desconhecidos são texto escapado; nenhum segredo/dado real em fixtures, exemplos, logs ou notificações. Nenhum endpoint novo ou acesso de fornecedor é necessário.
- Recuperação: sem migração/dados novos. Antes de integrar, o trabalho permanece isolado na worktree; depois de uma integração autorizada, reversão deve ser aditiva e limitada aos próprios arquivos/hunks, preservando uso eventualmente já adotado. Não usar reset/checkout destrutivos ou desfazer trabalho alheio.
- Achados separados: notificações nesta worktree registram lacunas da biblioteca, rótulo de ocorrência no SocialMedia e ligação de props/eventos de preço no MaxAiManager. Corrigir os aplicativos não é dependência da criação dos dez inputs nem autorização implícita deste plano.

## 7. Progresso, retomada e handoff

Na execução futura, registrar progresso após P00–P05 e no handoff em `docs/plans/wt-9a811fd4/execution-state.json`. Este arquivo não foi criado no Plan. Usar schema nativo estrito versão 2, sem inventar campos. Vincular ao SHA256 real de `plan.md` e às revisões factuais dos conteúdos das tarefas. Revalidar os hashes quando o conteúdo mudar.

- Registrar tarefas, estado e arquivos; status de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- Motivos/próxima ação em `nextAction`, até 512 caracteres. Não usar `blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp` nem campos extras.
- Comandos até 4.096 caracteres. Usar `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }` conforme schema nativo.
- Resultado de validação/check somente `passed`, `failed` ou `pending`: `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não admite `exitCode`. `blocked` nunca é resultado de check.
- Registrar comandos realmente executados e todas as falhas, inclusive da suíte completa. Não inferir aprovação/exit code de `tool:end.ok`. Hashes não são rótulos. Checks vazios ou resultado vigente ausente/falhando impedem validação integral. Version 1 compatível não prova validação integral automaticamente.
- Registro autodeclarado não comprova execução nativa nem identifica verificações omitidas; manter evidências reais. Cancelamento preserva resultado parcial e próxima ação. Tarefas assíncronas aguardam término/notificação, com espera limitada e recuo, sem polling repetido sem informação nova.

Ao retomar, consultar os trechos pertinentes, conferir trabalho já feito e alterações locais, revalidar contratos/revisões e executar lacunas sem repetir checks válidos da mesma revisão. Seguir dependências e decisões; só reabrir decisão por evidência nova ou mudança do pedido. Não reiniciar uma entrevista nem reler integralmente documentos a cada microetapa.

Execução sequencial é o padrão. Se houver autorização futura para múltiplos executores, P01 vem antes dos wrappers; grupos D01–D03, D04–D07 e D08–D10 podem escrever arquivos distintos após contratos estabilizados. P03/P04 compartilhados têm integrador único. Delegar somente contexto mínimo, IDs e referências; não rodar suíte completa/tipos/build enquanto outros escrevem o lote.

## 8. Revisão do planejamento e estado atual

Revisado contra o pedido: três projetos analisados; dez nomes novos e distintos; vinte reservas excluídas; valores fundamentados; escopo separado de adoção; contratos acessíveis e testes mapeados; efeitos dos gates e pendências explícitos; worktree preservada. Não há decisão essencial aberta que exija entrevista.

Realizado: investigação estática e escrita da spec, deste plano e notificações nos destinos autorizados. P00–P05 continuam não executados. Não foram rodados testes, tipos, lint, build, instalação, servidor, migração ou operações Git de escrita. Nenhuma garantia de funcionamento foi inferida somente da leitura.
