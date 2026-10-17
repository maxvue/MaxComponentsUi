# Plano de execução — 15 inputs específicos para o ecossistema Max

## 1. Identificação e autorização

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui` (`1.1.14` na investigação).
- Worktree: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-0a098c5a`.
- Branch: `wt-0a098c5a`, fornecida pelo MaxCode. Não criar worktree, trocar branch, integrar Git ou remover esta worktree.
- Especificação normativa: [spec.md](./spec.md). Ler na primeira admissão; nas retomadas consultar somente seções pertinentes e mudanças.
- Estado: **proposta para revisão; implementação não executada**. Este documento não autoriza publicação, migração ou alterações em outros repositórios.
- Pedido: analisar inputs de Engeapp, MaxAiManager e SocialMedia e planejar 15 novos inputs que não existam em MaxComponentsUi.

## 2. Resumo da revisão e delimitação

A seleção foi confrontada com os 80 arquivos `MaxInput*.vue` existentes e com os contratos dos consumidores. Os exemplos `MaxInputEntity` e `MaxInputGender` já estão implementados/exportados; criá-los novamente não atenderia ao pedido.

Foram selecionados 12 seletores semânticos, 1 identificador textual e 2 controles compostos. Há 9 oportunidades originadas no Engeapp, 4 no MaxAiManager e 2 no SocialMedia. A distribuição não foi artificialmente equilibrada: boa parte das seleções simples de SocialMedia e IA já tem componentes especializados.

### 2.1. O que muda e o que permanece

| Muda na execução futura | Permanece como hoje |
|---|---|
| Catálogo público ganha os 15 nomes abaixo | Todos os componentes atuais, aliases e classes legadas |
| Novos tipos, opções, exemplos e testes | Valores persistidos nos três sistemas |
| Exportações e manifesto passam a resolver os novos nomes | Endpoints, modelos de dados, autenticação, uploads e aprovações |
| Composições de paleta/agendamento ficam reutilizáveis | Responsabilidade do MaxPinia por GET, saves, autosave e cache nos consumidores |
| Validação local dos novos controles | Regras financeiras de banco e expansão de recorrência no servidor |

Não incluir substituições de campos nos aplicativos; os caminhos de origem são evidência, não alvos de escrita. Não criar stores para controles sem dados remotos nem acessar Axios dentro de inputs.

## 3. Evidências e limites

### 3.1. Investigação realizada

- Raiz da worktree confirmada por `pwd` e `git rev-parse --show-toplevel`; status inicial `## wt-0a098c5a`, sem alterações locais.
- Varredura somente em leitura de `resources/**/*.vue`: Engeapp 361 arquivos/803 tags de entrada; MaxAiManager 47/103; SocialMedia 23/70. Inventário textual, não medição de uso em produção.
- Inspecionados formulários, stores e contratos backend listados em **spec.md §3.1**; repetir essas leituras somente se houver mudança relevante.
- Conferidos catálogos e componentes existentes, base de seleção, APIs de distribuição, scripts npm, padrões unitários, setup e catálogo do playground.
- Metadados dos links locais foram lidos, sem acessar `.env`, dumps de banco, dados de clientes ou credenciais.
- Documentação oficial Vue 3 consultada para props/emits, atributos e imutabilidade; não há certificação executada para a RC instalada.

### 3.2. Dependências efetivas observadas

| Local | Evidência |
|---|---|
| Biblioteca | Vue `3.6.0-rc.10`, Pinia `4.0.3`, MaxUse `1.1.47`; MaxPinia peer opcional não instalado na resolução da worktree |
| Aplicativos | UI `1.1.14`, MaxPinia `0.2.0`, MaxUse `2.0.1`, via links para as raízes irmãs |
| Isolamento | `node_modules` da worktree resolve para a raiz principal; não assumir isolamento de cache/artefatos |

Os aplicativos instalados **não consomem esta worktree**. Não validá-los diretamente, alterar seus links, reinstalar dependências neles ou usar seus ambientes reais. A diferença de versões de MaxUse não prova bug, mas impede usar a checkout irmã como referência automática para a API `1.1.47` da biblioteca.

Não foram executados testes, tipos, lint, geradores, instalações, build, servidor ou gate de integridade nesta sessão. Não há resultado verde, benchmark ou acessibilidade comprovados por runtime.

## 4. Decisões técnicas propostas

1. Aplicar integralmente **spec.md §§3.2–3.7**. Tipos e códigos ficam explícitos antes da implementação dependente.
2. Usar `MaxDomainSelect`/`MaxInputSelect`/`InputBase` em seletores; não duplicar dropdown, overlay ou navegação.
3. I01/I02/I03 têm `options` explícita configurável; lista vazia explícita continua vazia. Os demais catálogos são fechados, com valores desconhecidos exibidos sem conversão.
4. Usar os enums canônicos em I11/I12, sem converter legado da tela ou migrar dados. A adoção em MaxAiManager é trabalho separado, condicionado à compatibilidade.
5. I09 armazena UC como string, preservando zeros/separadores; sem máscara presumida ou consulta à concessionária.
6. I14/I15 emitem coleções imutáveis e mantêm edição incompleta local, sem store/cache/API. A montagem e sincronização externa nunca disparam save indiretamente por emissão.
7. I15 oferece intervalos 1–52 via opções explícitas; quinta ocorrência significa quinta, não última. Não expandir datas no cliente nem alterar timezone.
8. Reutilizar helpers efetivamente disponíveis em MaxUse `1.1.47`; lógica específica de regras de agenda pode ser privada da UI, sem criar utilitário genérico concorrente.
9. Adição exclusivamente compatível na biblioteca; nenhuma dependência nova, PrimeVue, `file:../MaxUse` ou mudança de versão.
10. Usar template → script setup TypeScript → estilo SCSS scoped; tags de abertura em uma linha, indentação de script em 4 espaços e tokens semânticos teal/foco. A aparência dos dados da paleta não é token de marca da interface.

Alternativas descartadas: recriar Entity/Gender; mais wrappers de URL/senha/tokens já existentes; mover componentes de aplicação com imports de stores locais para a biblioteca; criar fetch/cache nos inputs; “corrigir” códigos de IA ao carregar; tratar quinta ocorrência como última; instalar libs de seleção/formulário adicionais.

## 5. Preflight da execução futura — T00

Executar **antes de implementar ou validar**, inicialmente somente por leitura:

1. Ler AGENTS aplicáveis, plano, especificação e notificações. Conferir trabalho já feito, branch e diff atual. Preservar alterações de terceiros; se algum dos 15 nomes já existir na revisão atual, comparar contrato e registrar conclusão, sem recriar ou inventar substituto para manter contagem.
2. Conferir scripts e lifecycle hooks efetivos de `package.json`, lockfile, configurações de Vitest/Vite, setup global e resoluções reais de Vue, Pinia, Axios e MaxUse. A identidade de Pinia/Axios importa no harness, mesmo sem chamadas de negócio nos inputs. MaxPinia só será necessário em fixture de persistência se isso for expressamente incluído e viável com peer isolado; não instalar à força.
3. Garantir que todos os novos arquivos, caches, cobertura, relatórios, dist e consumidores temporários fiquem dentro desta worktree. Não rodar instalação sobre link de `node_modules` que aponta à raiz. Se o ambiente exigir dependências próprias, obter estratégia/autorização de preparação isolada; não remover ou substituir links compartilhados sem autorização.
4. Não copiar `.env`. Não executar Artisan, migrations, resets ou testes dos aplicativos. O escopo exige apenas componentes com estado sintético em memória; banco, cache remoto, fila e storage compartilhados não têm justificativa operacional.
5. Ler os checks de lockfile/filenames e quaisquer hooks de integridade aplicáveis. Falha de integridade bloqueia validações dependentes: não contornar com comando direto, `ignoreConfig`, remoção de prehook ou dependência local.
6. Verificar disponibilidade de navegador compatível, permissões de filesystem e rede para os consumidores temporários/auditoria futuros. Rede não autoriza testes de APIs de negócio.
7. Verificar presença do executor do gerador: o AGENTS cita `npx tsx src/scripts/generateResolver.ts`, mas `tsx` não consta como dependência direta no `package.json` investigado. Não permitir download automático não autorizado. Se indisponível, preparar o executor de modo autorizado ou atualizar o manifesto com a mesma lógica por edição revisada; não inventar script npm de geração.

**Conclusão de T00:** ambiente de escrita isolado demonstrado e contratos atuais confrontados. Sem isso, registrar `blocked` e próxima ação concreta; não iniciar verificações que escrevam na árvore principal.

## 6. Tarefas executáveis e matriz de aceite

Cada linha abaixo corresponde a um componente novo e seu teste unitário de mesmo nome. Arquivo futuro do componente: `src/components/<nome>.vue`; teste futuro: `tests/components/<nome>.test.ts`. Catálogos e tipos são preparados em T01. A coluna “Manual” é validação futura, nunca resultado desta sessão.

| Tarefa | Requisito / evidência | Resultado e teste pertinente | Revisão pelo risco / manual |
|---|---|---|---|
| T02 / I01 `MaxInputOccupation` | Ocupação; E1 | 7 códigos padrão; opções customizadas e `[]`; `OUTROS` não vira valor livre automaticamente; emits string/null | Baixo: revisar labels e codes; selecionar/limpar com teclado |
| T03 / I02 `MaxInputFinancingTerm` | Prazo em meses; E1 | 8 prazos padrão; opções numéricas customizadas, incluindo 6 quando oferecido; não aceitar coerção `'24'`→24 nem prometer oferta | Moderado: fronteira financeira; testar seleção em modal |
| T04 / I03 `MaxInputFinancingGracePeriod` | Carência em dias; E1 | 30/60/90/120 padrão; override explícito/`[]`; unidades corretas e null | Moderado: nenhuma chamada bancária; conferir “dias” |
| T05 / I04 `MaxInputServicePricingUnit` | Unidade de cobrança; E2 | `kwp/modulo/km/unidade`; não converter quantidade nem preço | Baixo: catálogo e labels; conferir abreviações |
| T06 / I05 `MaxInputServiceAudience` | Público da faixa/adicional; E2 | 4 códigos; `nobody` é valor válido diferente de `null`; não reinterpretar permissões | Baixo: testar ninguém/ambos e limpeza |
| T07 / I06 `MaxInputInverterType` | Tecnologia; E3 | `String/Micro`, caixa preservada, desconhecido visível | Baixo: não confundir com fases; selecionar ambas |
| T08 / I07 `MaxInputMonitoringAuthType` | Modelo de autenticação; E4 | 4 códigos, disabled bloqueia, nenhuma autenticação disparada | Moderado: só selecionar; conferir descrições longas |
| T09 / I08 `MaxInputMonitoringCredentialFlow` | Obtenção de credencial; E4 | 3 códigos; `oauth_flow` não vira `oauth2_redirect` | Moderado: não misturar catálogos I07/I08; testar teclado |
| T10 / I09 `MaxInputConsumerUnit` | Identificador UC; E5 | preservar `0000123-4`, texto e caixa; vazio→null; excesso de 50 visível com erro, sem corte; atualizar pai sem eco | Moderado: integridade do identificador; colar texto longo e verificar erro/foco |
| T11 / I10 `MaxInputAiModelStatus` | Situação do modelo; A1 | approved/pending/failed; sem aprovação remota, sem alterar ativo/preços | Baixo no controle, impacto de negócio na adoção; conferir labels |
| T12 / I11 `MaxInputAiPriceItemType` | Enum canônico; A2 | todos os códigos da spec §3.4; valores legados não convertidos; rótulos pt-BR; teste de igualdade do conjunto | Alto: revisão independente do contrato; conferir busca/textos longos; não adotar no app |
| T13 / I12 `MaxInputAiCacheOperation` | Enum de cache; A2 | read/write/storage; null distinto; não modificar regra cached nem cobrar | Moderado: revisar enum e legado; selecionar storage |
| T14 / I13 `MaxInputRagSourceType` | Tipo de fonte RAG; A3 | document/url/text/mysql; disabled bloqueia seleção; zero upload/SQL/fetch de negócio | Moderado: teste de bloqueio durante estado sintético de upload |
| T15 / I14 `MaxInputColorPalette` | Cor + detalhes; S1 | adicionar/remover/editar imutavelmente, preservar duplicatas/ordem, erro de hex, rascunho inválido, disabled/required, duas instâncias | Moderado: deep-freeze e foco após remoção; picker/texto, claro/escuro e tela pequena |
| T16 / I15 `MaxInputScheduleRules` | Regras completas; S2 | quatro variantes; troca preserva só horário; dias 1–31, intervalos 1–52, quinta literal; datas reais/bissexto; rascunhos/eco/troca de registro | Alto: revisão de dados/tempo; navegação completa, datas vazias, modal e exemplos de quinta inexistente sem expansão local |

### 6.1. T01 — fundação de tipos e catálogos

Depende de T00. Seguir a organização de **spec.md §3.8**:

- Criar `src/types/specializedInputs.ts`, aproveitando `BaseDomainInputProps`/`DomainSelectOption`; evitar `any` novo. Cada interface/modelo da lista deve ter nome público inequívoco.
- Criar `financingInputs.ts`, `serviceInputs.ts` e `monitoringInputs.ts`. Estender `electricalInputs.ts` para inversores e `aiInputs.ts` para IA/RAG. Não alterar opções existentes.
- Para I01/I02/I03, declarar options tipada e resolver `undefined` versus `[]` antes de encaminhar ao adaptador. Não deixar `v-bind` sobrescrever catálogo sem intenção.
- Especificar estados de erro e igualdade de valores recebidos antes de implementar rascunhos dos compostos.
- Preparar casos de teste e fixtures sintéticas dos contratos antes ou junto com implementação; **não rodar testes entre microedições**. Asserções precisam capturar falhas reais, não apenas verificar se o wrapper foi montado.

Conclusão: nenhum código/enum/shape indefinido impede T02–T16; revisão por leitura do contrato IA e agenda realizada.

### 6.2. Ordem, dependências e implementação em lote

1. T00 → T01 são sequenciais.
2. Implementar T02–T14 (seletores/UC) e seus testes usando a base existente.
3. Implementar T15/T16 e seus testes completos antes dos gates. Criar `src/helpers/scheduleRules.ts` e `tests/helpers/scheduleRules.test.ts` apenas para lógica específica do domínio.
4. T17 integra API pública, exemplos e documentação após os componentes.
5. T18 valida o conjunto concluído; corrigir falhas em lote e repetir somente o necessário.
6. T19 realiza revisão final, manuais e handoff.

Uma sessão pode executar sequencialmente. Este plano **não solicita delegação automática**. Se houver autorização posterior para múltiplos executores: T01 define os contratos; componentes com arquivos distintos podem ser divididos depois; um único integrador edita `src/index.ts`, `src/types/index.ts`, catálogos compartilhados, manifesto, `package.json` e playground. Ninguém roda suíte/tipos/build enquanto outros escrevem o lote. Handoffs usam ID da tarefa e seções relevantes, sem releitura integral compulsória.

### 6.3. T17 — distribuição, documentação e exemplos

Arquivos existentes a alterar e entregas:

1. `src/index.ts`: exports nomeados dos 15 componentes e catálogos; `src/types/index.ts`: export de tipos novos. Não remover exports atuais ou registrar globalmente componentes que hoje são resolvidos automaticamente.
2. `src/components-manifest.json`: regenerar uma vez ao final ou aplicar fielmente a lógica lida do gerador quando o executor não estiver disponível. Confirmar aliases canônicos/PascalCase/kebab/snake conforme padrão e ausência de componentes privados.
3. `package.json`: adicionar os 15 subpaths explícitos seguindo `.vue.d.ts`/`.es.js`; manter wildcard, versões e dependências. `vite.config.ts` já descobre os arquivos; não refatorá-lo sem causa.
4. `tests/index.test.ts`: acrescentar prova de exports e resolver. `scripts/verify-consumers.mjs`: incluir todos os novos nomes/subpaths e tipos nos cenários pertinentes, inclusive SSR/TypeScript. Não tocar consumidores reais.
5. Novo cenário `playground/src/scenarios/inputs-specialized.vue`, registrado em `scenarios/index.ts`; incluir 15 entradas em `catalog.ts`. Carregamento lazy, dados fictícios, sem API e sem importar a raiz inteira desnecessariamente.
6. Criar `tests/browser/SpecializedInputs.browser.ts`/fixture, seguindo harness existente; testar fluxo real no navegador, ARIA, teclado, foco, lista em modal e compostos. Reutilizar axe/padrão local sem inventar dependência.
7. `docs/INPUTS-DOMAIN.md`: propósito, props, defaults, modelos, eventos, slots, catálogos, limites, erros, uso e anti-exemplos; incluir exemplos financeiros configuráveis e nota de **não adoção automática** dos enums IA. Documentar I14/I15 com modelos compatíveis com as stores, sem importar tipos dos aplicativos.

Conclusão: 15 componentes acessíveis por import raiz, resolver e subpath; documentação distingue APIs existentes das novas e não promete backend implementado.

## 7. Estratégia de validação — T18

### 7.1. Asserções comuns obrigatórias

- Seletores: catálogo completo e labels; valores string/número intactos; ausência, desconhecido e erro explícito; seleção/limpeza com contagem de eventos; montagem e atualização externa sem eco; `clearable/showClear`; slots condicionais; attrs em camel/kebab e tentativa de sobrescrita de opções reservadas.
- UC: vazio, pontuação, letras, zeros, paste, erro externo, tamanho e atualização do pai; nenhum log de valores reais.
- Compostos: objetos/arrays congelados no teste para detectar mutação; adicionar/remover sem destruir outros itens; disabled de todos os controles; erro/required; rascunhos inválidos; duas instâncias; mudança externa; foco após exclusão. Não implementar autosave paralelo.
- Agenda: inválidos reais (`2026-02-30`, `24:00`, intervalo 0/53), bissexto (`2028-02-29`), 31 válido estruturalmente, ausência de quinta sem prometer última; optional time/anchor não preenchidos por montagem; nenhum UTC acidental.
- Integração: pacote desta revisão; novo subpath/declarações; resolver; SSR; ausência de imports PrimeVue; consumidor sem peers opcionais. Dublês não comprovam persistência MaxPinia real nem regras de fornecedor, que estão fora do escopo.

### 7.2. Comandos futuros identificados, sem execução nesta sessão

Após completar código e testes e superar T00, o gate integral recomendado é:

```bash
CONSUMER_TEMP_DIR="$PWD/.consumer-verification" npm run verify
```

Preparar o diretório temporário dentro da worktree no Execute, se autorizado. `verify` agrega: filenames, lockfile, SVG, tipos da biblioteca/testes, ESLint/Stylelint, build, unitários, cobertura, browser, bundle, benchmarks, consumidores temporários, árvore npm e audit. Não acrescentar `release`, `npm version`, `publish` ou `push`.

**Efeitos a autorizar e isolar antes do gate:** build/cobertura/cache geram arquivos; consumidores fazem `npm pack` e instalações temporárias; audit consulta registro npm. Ler políticas e hooks atuais antes de executá-lo. Não usar links das aplicações para satisfazer o gate.

Não rodar `npm run type-check`, `npm run build`, `npm run test`, `npm run test:coverage`, `npm run test:browser`, `npm run lint` e `npm run verify:consumers` outra vez por rotina sobre revisão já coberta pelo agregado. Os scripts existem e podem ser usados individualmente **para diagnóstico causal de etapa falhada ou validação de conteúdo corrigido**, com registro da revisão e sem declarar que substituem o gate completo.

Se o agregado parar antes de alguma etapa: registrar etapas não executadas como pendentes; reaproveitar checks aprovados e ainda válidos, corrigir o lote e executar lacunas. Não transformar uma validação focal em aprovação integral. Quando exigir gate pré-release, `npm run verify` precisa concluir sem falhas; qualquer repetição deve ter motivo factual, não ser ritual de microedição.

Se não houver isolamento/rede/Chromium, registrar bloqueio ou `manualPending`, com próxima ação específica. Não pular hooks, baixar executores automaticamente ou reduzir thresholds. Diagnosticar harness/bootstrap em conjunto antes de repetir falhas equivalentes. Tarefas assíncronas aguardam conclusão/notificação; eventual checagem necessária usa espera limitada e recuo, nunca consultas repetidas sem informação nova. Cancelamento preserva resultados parciais e pendências.

### 7.3. T19 — matriz de revisão e verificações manuais finais

| Aceite transversal | Evidência futura exigida |
|---|---|
| Não duplicação e contagem | 15 novos SFCs listados; nenhum existente rebatizado ou contado novamente |
| API acessível | exports, tipos, manifesto/resolver e subpaths comprovados no pacote da revisão |
| Preservação | diff sem migração, remoção de `.p-*`, mudança de versões, PrimeVue ou escrita nos aplicativos |
| Acessibilidade real | teclado, labels/ARIA, foco, disabled/erro, modal, viewport pequeno e claro/escuro no navegador |
| Contratos críticos | revisão independente nos marcos IA e agenda; paleta/UC sem perda de dados |
| Resultado verificável | comandos e exit codes reais; nenhum requisito importante sem evidência atual |

Testes do playground em ambiente seguro: usar `npm run dev:playground` somente no Execute e após autorização operacional, abrindo o cenário dos novos inputs. Encerrar apenas o processo criado pela sessão. Sem disponibilidade de revisão visual, manter item `manualPending`; não chamar a entrega de integralmente validada.

## 8. Riscos, recuperação e achados

| Risco | Tratamento e ponto de interrupção |
|---|---|
| Códigos IA divergentes entre UI/enum | I11 é canônico, sem aliases mágicos; adoção no app excluída. Se a base do enum mudar, revisar catálogo antes da implementação |
| Quinta ocorrência rotulada como última na tela | Novo input usa quinta literal; preservar servidor; não adaptar calendário sem pedido |
| Catálogos financeiros não são ofertas | Options explícitas e nenhuma promessa de aprovação; não chamar bancos nem alterar cálculo |
| Arrays alterando diretamente store/acionando saves inválidos | Emissão imutável, rascunho separado e testes de ausência de eco |
| Links para libs/artefatos compartilhados | T00 bloqueia qualquer validação que escreva fora da worktree; consumidores temporários isolados |
| Bases de seleção/cores apresentam limitação durante teste | Estabelecer causalidade; ajuste mínimo com regressão somente se indispensável ao contrato autorizado; problema amplo é notificação e pedido de escopo, não refatoração livre |
| Baseline falhando | Preservar falhas/exit codes, diagnosticar; não consertar outros módulos nem afirmar verde |

Rollback técnico não envolve banco: se houver necessidade, desfazer **somente alterações desta execução**, após preservar trabalho de terceiros, sem reset/checkout destrutivos. Nenhuma publicação está autorizada. Recuperar rascunhos perdidos por erro exige corrigir o componente e testes, não restaurar banco ou manipular cache remoto.

Notificações desta investigação: lacunas dos 15 componentes, divergências de enum IA, label de quinta ocorrência e divergências de descrição do catálogo UI. São registros de achados; não incluem autorização para corrigi-los em outros projetos.

## 9. Progresso, revisão factual e retomada

No **Execute**, não nesta sessão Plan, registrar marcos e handoff em `docs/plans/wt-0a098c5a/execution-state.json`:

- Usar esquema **version 2 estrito** do executor. Antes da primeira gravação, confirmar o esquema completo no harness; não inventar propriedades ou formatos ausentes. Vincular o registro ao **SHA256 real de `plan.md`**, às revisões factuais das tarefas e aos arquivos efetivamente alterados.
- Tarefas T00–T19: estados permitidos `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Registrar próxima ação concreta em `nextAction` com no máximo 512 caracteres.
- Não adicionar campos `blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp` ou qualquer outro não aceito pelo schema estrito. Não escrever um novo schema inventado dentro do registro.
- Comandos de até 4.096 caracteres. Registrar comandos **realmente executados** e todas as falhas, inclusive do agregado, sem credenciais/segredos.
- Formato de verificação: `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`. Revisions são hashes reais de conteúdo, nunca rótulos “atual”, IDs de tarefas ou nomes de branch.
- Resultado de validação/check aceita apenas `passed`, `failed`, `pending`: passed exige `exitCode: 0`; failed exige inteiro diferente de zero; pending não aceita exitCode. `blocked` é estado de tarefa, **não** resultado de check.
- Não inferir aprovação ou exit code de `tool:end.ok`. Checks vazios, resultado vigente ausente ou falha vigente impedem validação integral. Version 1 preexistente continua compatível, mas não comprova aceite integral automaticamente. O registro é autodeclarado: não comprova execução nativa nem descobre checks omitidos.
- Reaproveitar resultado aprovado somente sem mudança relevante nos conteúdos/dependências cobertos. Revisão de docs não invalida por si só build de código inalterado; mudança de contrato, fonte ou harness exige atualizar evidência correspondente.

Na retomada: conferir arquivos e status atuais, ler estado existente sem sobrepor evidência, comparar hashes, executar lacunas e seguir dependências. Não reabrir decisões sem requisito novo ou evidência concreta. Revisão independente acontece nos marcos de risco (IA, agenda) e fechamento, não após cada linha.

## 10. Definição de pronto e handoff

Só declarar implementação integral quando T00–T19 tiverem resultados compatíveis com seus critérios, código e documentação estiverem revisados, verificações correntes forem aprovadas e manuais exigidos concluídos. Não confundir “15 arquivos criados” com 15 contratos entregues.

Handoff deve informar: tarefas concluídas/pendentes; arquivos alterados; revisão factual; checks/comandos e resultados; bloqueios/manuais com próxima ação; ausência de commits/publicação. Preservar a worktree para o painel/usuário integrar quando solicitar.

**Revisão desta sessão Plan:** objetivo concreto identificado; spec escrita antes do plano; 15 nomes sem correspondentes existentes; escopo da biblioteca separado da adoção; evidências e incompatibilidades documentadas; padrões Max preservados; dependências e isolamento explicitados; tarefas e matriz de aceite cobrem todos os componentes. Somente documentos autorizados foram escritos; nenhum registro de execução foi criado.
