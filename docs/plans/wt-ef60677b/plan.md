# Plano de execução — dez novos inputs

## Identificação e leitura inicial

- Data: 16/10/2026; projeto MaxComponentsUi; worktree `wt-ef60677b`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-ef60677b`.
- Ler `spec.md` neste mesmo diretório: contém evidências, dez nomes, valores padrão e regras completas. Este plano e a spec são propostas revisáveis; não autorizam publicação ou alterações em consumidores.
- Manter a branch atual. Não criar worktree, fazer commit, merge, push ou limpeza. Ler AGENTS.md e status antes de executar; preservar alterações preexistentes. Nas retomadas, ler trechos pertinentes e conferir trabalho concluído antes de repetir etapas. Não reabrir escolhas sem requisito novo ou evidência concreta.

## Resultado esperado e preservação

Entregar MaxInputPercent, MaxInputPower, MaxInputCurrent, MaxInputVoltage, MaxInputDistance, MaxInputDuration, MaxInputTokenLimit, MaxInputMonthDays, MaxInputWeekInterval e MaxInputSocialPlatform, com testes, acesso público e exemplos. Públicos afetados: desenvolvedores e futuros usuários dos formulários dos três consumidores.

Não tocar nos dez componentes reservados listados na spec. Não alterar consumidores, dados, endpoints, regras de preços, regras elétricas ou agendamentos. Não modificar o parser nem os limites do MaxInputNumber legado neste escopo. Não adicionar PrimeVue. Manter classes legadas existentes. Não criar store para inputs controlados; se houver demonstração com persistência, usar MaxPinia e helpers MaxUse.

## Investigação realizada

- Raiz e status Git lidos: worktree indicada e nenhum arquivo inicialmente modificado.
- Catálogo `src/components`, exports de `src/index.ts` e `package.json`, script `src/scripts/generateResolver.ts`, entrada dinâmica em `vite.config.ts`, contexto InputBase e implementações MaxInputNumber/Select/Discount inspecionados.
- Padrões de testes conferidos em `tests/components/MaxInputNumber.test.ts` e resolver em `tests/helpers/MaxComponentsUiResolver.test.ts`; estrutura de playground/catalog.ts existente.
- Consumidores analisados por busca de tags de inputs em resources; arquivos centrais lidos: WirePage, ModalAiModel, ThemeScheduleBuilder, ClientWorkspace e contrato ThemeScheduleRule. Evidências adicionais localizadas por linhas de campos estão na spec.
- Fonte MaxUse consultada somente em leitura; instalação efetiva ainda não verificada. Não inspecionados bancos, ambientes secretos ou credenciais. Nenhum teste, instalação, build ou serviço executado.
- Achado fora do escopo registrado em `docs/notifications/wt-ef60677b/notifications/max-components-ui-number-limits.md`.

## Decisões, alternativas e riscos

1. Especializações concretas em vez de dez aliases cosméticos: cada uma fixa unidade/domínio/limites ou opções. A proposta é baseada no código, não em pedidos de mudança nas telas.
2. Base numérica interna, pois o MaxInputNumber existente não implementa limites. Corrigir globalmente o componente legado ampliaria impacto; descartado neste lote.
3. MaxInputDiscount continua existindo; percentual novo não alterna moeda nem recalcula preço. MonthDays não compete com Month/Weekday/Year. Duration representa segundos, não Time.
4. Seletores recebem dados locais ou opções do consumidor; sem requisição interna e sem catálogo elétrico hardcoded. SocialPlatform preserva diferença entre '' e null; não confundir com plataformas customizadas por ID no calendário.
5. Novos valores inválidos não são emitidos; rascunho e mensagem permitem corrigir a digitação. Não truncar ou normalizar silenciosamente. Mudanças de unidade são somente apresentação: documentar para evitar erro de escala física.
6. Nomes, defaults e contratos novos são propostas deste planejamento. Contratos backend existentes são fatos a preservar, não autorização para migrar aplicações.
7. Riscos principais: atributos repassados ao nó errado, zero interpretado como vazio, emits em eco, limites sem efeito, vazio legítimo em select, arredondamento e conflito de arquivos compartilhados com a outra sessão. Testes correspondentes são obrigatórios.

## Etapas executáveis

### T0 — Preflight de ambiente e integridade, somente leitura

Conferir branch/status e alterações já existentes, AGENTS aplicáveis, versões resolvidas e symlinks de node_modules. Ler scripts/prehooks de package.json, configurações Vitest/Vite e setup de testes. Conferir identidades únicas de Vue/Pinia e Axios caso o harness os carregue; não presumir isolamento por worktree. Inspecionar `scripts/verify-consumers.mjs` e `scripts/verify-package-consumer.mjs` antes de autorizar a execução que empacota/instala em diretórios temporários; o primeiro aceita CONSUMER_TEMP_DIR. Confinar temporários de consumidor em área isolada e não apontar para aplicações reais.

Não copiar .env, conectar banco/cache/fila/storage compartilhados, executar migrations ou resets. Este escopo deve ser validável com estado local e opções estáticas. Gate de integridade de biblioteca falhado bloqueia validação dependente, sem bypass por comando direto, remoção de prehook ou ignoreConfig. Se falta ferramenta/credencial/rede, registrar próxima ação concreta e suspender somente a etapa dependente.

Saída: ambiente confirmado e lista factual de arquivos tocados por outras sessões. Interromper se algum dos dez nomes já existir com contrato incompatível; reconciliar pelo código novo antes de escrever duplicatas.

### T1 — Contratos e infraestrutura numérica

Criar `src/types/semanticInputs.ts` e `src/components/base/MaxBaseQuantity.vue`, com contratos da spec. Ler antes `src/helpers/useInputValidation.ts` e `src/components/InputBase.vue` integralmente para integrar mensagens e atributos. Não usar função interna do MaxInputNumber como API pública.

Usar MaxUse disponível quando aplicável, sem trocar para import local. Usar APIs nativas para gramática decimal, finitude e inteiro seguro, mantendo regras do domínio internas. Preservar rascunho separado do modelo controlado, evitar watcher que reemita prop, dar prioridade a erros externos e manter atualização externa consistente quando focado e desfocado. Proposta: alteração externa real substitui o rascunho; eco do valor recém-emitido não interrompe edição.

Criar testes de base cobrindo zero, null, formatação, digitação intermediária, colagem inválida, limites dinâmicos, frações, Infinity/NaN, atualizações externas e ausência de emissões em mount. Resultado: contrato comum pronto, sem mudar componentes existentes. Não executar suíte entre microedições.

### T2 — Implementar sete especializações numéricas

Criar os componentes Percent, Power, Current, Voltage, Distance, Duration e TokenLimit em `src/components/`, compondo a base interna. Voltage compõe MaxInputSelect somente se options forem fornecidas; aplicar mesma validação de modelo/limites nos dois modos. Criar `tests/components/MaxInput{Name}.test.ts` para cada um.

Testar cada default da tabela da spec e overrides; testar unidades como apresentação sem conversão, casas decimais, min/max reativos e disabled. Duration/TokenLimit rejeitam frações e inteiros inseguros; valores de timeout e contexto específicos continuam externos. Não copiar watchers ou cálculos das telas.

### T3 — Implementar três inputs de seleção/lista

Criar MonthDays com InputBase e input textual; WeekInterval e SocialPlatform com MaxInputSelect e repasse explícito de atributos/listeners. Criar testes individuais nos mesmos caminhos convencionais.

MonthDays: manter modelo anterior diante de entrada inválida; testar lista vazia, ordem, duplicatas, espaços, 0,32, frações, `12abc`, vírgula final e update externo. WeekInterval: aceitar somente opções inteiras positivas válidas e null, incluindo opções customizadas. SocialPlatform: testar Outra='', ausência=null, opções personalizadas e valor externo desconhecido sem descarte silencioso. Não embutir API, token ou dados pessoais em exemplos.

### T4 — Integrar distribuição e demonstrações

Atualizar `src/index.ts` com dez exports e tipos públicos necessários. Seguir o padrão de exports explícitos de componentes em package.json. Base interna não entra no resolver. Regenerar `src/components-manifest.json` pelo mecanismo existente somente no Execute: AGENTS documenta `npx tsx src/scripts/generateResolver.ts`, mas tsx não aparece nas devDependencies; verificar disponibilidade local e não aceitar instalação implícita. Se indisponível, registrar bloqueio e obter autorização para preparar a ferramenta ou definir procedimento determinístico equivalente, sem fingir que o script rodou.

Acrescentar cobertura aos testes de exports/resolver, aliases e subpaths; verificar ausência de colisões, inclusive variantes kebab/snake. Criar `playground/src/scenarios/SemanticInputsScenario.vue` e registrar em `playground/src/catalog.ts` conforme formato real; documentar props, modelos, erros, unidades e exemplos na seção pública existente localizada antes de editar.

Arquivos compartilhados (index, manifesto, package, catálogo) têm um único integrador. Se houver delegação futura autorizada, apenas componentes/testes em conjuntos de arquivos disjuntos podem ocorrer em paralelo após T1; integração e validação aguardam todos. Não há delegação nesta sessão Plan.

### T5 — Validar lote, revisar e entregar

Depois de todos os componentes, testes e integração, executar `npm run verify` no ambiente seguro aprovado em T0. O comando identificado agrega checagens de nomes/lockfile/SVG, tipos de produto/testes, lint, build, unitários, cobertura, browser, bundle playground, benchmarks, consumidores, árvore npm e auditoria. Não executar release. Reaproveitar os checks aprovados para a mesma revisão; se o gate parar, diagnosticar a falha antes de repetir e executar as lacunas somente por fluxo permitido.

Corrigir falhas em lote sem ampliar escopo para baseline não causado pela mudança. Falhas ambientais devem manter o gate pendente/falho. A indisponibilidade de navegador/rede não autoriza alegar validação integral. Revisão por risco ao concluir contratos e na entrega, não a cada microedição. Não são necessários fornecedor externo, credenciais reais ou banco para o aceite destes inputs.

## Matriz de aceite por tarefa

| Tarefa/requisito | Evidência esperada | Testes pertinentes | Revisão pelo risco e manual |
|---|---|---|---|
| T0 ambiente seguro | versões, scripts e diretórios efetivos conferidos | checks de integridade do fluxo aprovado | sem acesso a serviços compartilhados; bloqueio explícito se necessário |
| T1 anatomia/estado | InputBase único, inputAttrs e modelo controlado | base numérica: parse estrito, zero, null, limites e nenhum eco | foco, label, erro anunciado e edição sem salto |
| T2 Percent | 15 permanece 15 e % só na apresentação | limites padrão/override; sem cálculo de preço | não sobrepor Discount |
| T2 Power/Current/Distance | número e unidade documentados | unidade não altera modelo; sinais/decimais conforme props | conferir exemplos kW/kWp/A/m e sem regra elétrica embutida |
| T2 Voltage | modelo number/null nos dois modos | modo select/número, opção ausente, limites | teclado e valores customizados sem catálogo global |
| T2 Duration/TokenLimit | segundos/tokens inteiros | fração, inseguro, mínimos, máximos dinâmicos | não confundir duração com horário nem token count com tokenização |
| T3 MonthDays | array de 1–31 sem descarte parcial | casos inválidos e duplicatas da T3 | editar lista e corrigir erro sem perder valor válido |
| T3 WeekInterval | contagem positiva de semanas | 1–4 e opções customizadas | rótulos e seleção por teclado |
| T3 SocialPlatform | instagram/facebook/''/null distintos | limpar versus Outra; opções externas | não prometer suporte API adicional |
| T4 disponibilidade | dez exports, subpaths e aliases | index, resolver e consumidor empacotado | nenhum nome reservado/colisão; base não pública |
| T4/T5 aparência e regressões | cenário completo e contratos legados preservados | browser, cobertura, benchmark e suíte agregada | claro/escuro, mobile, 36px, Tab/Enter/Escape, foco e mensagens |

Verificações realizadas nesta sessão: somente leituras e revisão documental. Todas as verificações de implementação acima são futuras. Não existem resultados de testes aprovados a reutilizar desta sessão.

## Progresso, retomada e encerramento

Durante Execute, registrar marcos e handoff em `docs/plans/wt-ef60677b/execution-state.json`; não criar esse arquivo em Plan. Usar schema version 2 estrito do executor, sem campos extras; obter o schema antes de escrever, pois este plano não inventa seu envelope. Vincular ao SHA256 real de plan.md e às revisões reais do conteúdo das tarefas, registrando tarefas, estados e arquivos.

Status de tarefa: pending/running/completed/blocked/manualPending/validationFailed. Motivos e próxima ação em nextAction (até 512 caracteres), sem blocker, diagnostic, branchSync, durableSync ou followUp. Comandos até 4.096 caracteres. `verification` deve conter `revision` SHA256 e `checks: [{command, revision, result, exitCode?}]`. Resultados de validação/check: somente passed/failed/pending; passed exige exitCode 0, failed exige inteiro não zero, pending não admite exitCode. Registrar comandos realmente executados e todas as falhas, inclusive suíte completa; não inferir exit code de tool:end.ok. Checks vazios, resultado ausente/desatualizado ou falha vigente impedem aceite integral. Version 1 legado não prova aprovação automaticamente; registro autodeclarado não prova execução nativa nem detecta omissões.

Na retomada, conferir hashes e diff real, aproveitar trabalho validado sem mudança relevante e executar lacunas. Não repetir falha idêntica sem diagnóstico e progresso. Se tarefa assíncrona for necessária, aguardar conclusão/evento com limite e recuo, sem consultas repetitivas sem informação nova. Cancelamento preserva progresso parcial e próxima ação. Manual pendente ou bloqueio impede relato de conclusão total.

Reversão futura: retirar apenas novos componentes e entradas correlatas, sem tocar no trabalho concorrente ou dados; não há migração de dados nem rollback destrutivo planejado. Publicação, integração e adoção nos consumidores exigem pedido separado. Entrega deve informar arquivos alterados, gate efetivamente executado e pendências; não limpar esta worktree pelo agente.
