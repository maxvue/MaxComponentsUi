# Plano de execução — overscan reativo do MaxListBox

## 1. Identificação e instruções de entrada

- Data: 2026-10-05.
- Projeto: `@maxvue/max-components-ui`, versão declarada 1.1.2.
- Worktree obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-3eb968fe`.
- Nome/branch informada: `wt-3eb968fe`; base informada: dev.
- HEAD investigado: `67a658dd35dc2af3dd92f0ebb060d43122f5faba`.
- Especificação já elaborada: `docs/plans/wt-3eb968fe/spec.md`.
- Situação: planejamento concluído, implementação não iniciada; testes não executados.

Na primeira admissão, ler este plano e a spec. Na retomada, consultar identificação, estado e somente as tarefas pertinentes. Antes de escrever código, obter autorização de execução e revalidar instruções atuais, código e alterações locais. Não criar outra worktree, trocar branch, instalar dependências, commitar, mergear ou publicar sem autorização própria. Nesta sessão Plan somente spec.md, plan.md e notificações nos destinos autorizados podem ser escritos.

## 2. Problema, objetivo e requisitos

O consumidor perguntou se virtual-scroll permite definir a quantidade antecipada. A entrevista delimitou o pedido ao buffer de **renderização**, não à quantidade de dados buscados. Atualmente o MaxListBox usa implicitamente 5 itens extras por lado sem prop pública.

Usuários afetados: mantenedores da biblioteca e aplicações com listas locais ou paginadas usando MaxListBox. Indiretamente, componentes de seleção que compartilham useVirtualList recebem a correção de cobertura parcial e normalização.

| ID | Requisito confirmado |
|---|---|
| R1 | Adicionar `overscan?: number`, default 5, itens extras por lado |
| R2 | Alterações da prop após montagem recalculam a janela sem remontagem nem scroll adicional |
| R3 | Zero válido; negativos → 0; frações → piso limitado a 0; valores não numéricos/não finitos/ausentes → 5 |
| R4 | Incluir todas as linhas parcial ou totalmente visíveis; correção do fim da janela aprovada |
| R5 | Limitar às opções existentes; manter lista vazia/curta/fim/scroll excedido seguros; modo não virtual ignora buffer |
| R6 | Preservar seleção, eventos, foco acessível, scroll e totalHeight; default e threshold atuais |
| R7 | Não vincular mudança isolada do buffer a fetch; preservar loadOptions, pageSize e proteções de paginação |
| R8 | Manter consumidores numéricos existentes compatíveis, sem migrar suas APIs |
| R9 | Documentar unidade, padrão, reatividade, normalização, diferença para paginação e trade-off de desempenho |

Fora de escopo: antecipação de API, alturas variáveis, medição inicial/resize, nova infraestrutura virtual, mudanças de estilos/tokens/aliases, PrimeVue, novas dependências, release ou migração de dados. Não transformar esta demanda em limpeza geral do repositório.

## 3. Evidências e limites da investigação

| Evidência existente | Conclusão por leitura |
|---|---|
| MaxListBox.vue:157–196 | virtualScroll, threshold 500, itemHeight 44, pageSize 50; sem overscan pública |
| MaxListBox.vue:403–416 | viewport inicial 400px; passa itemHeight/enabled ao composable |
| MaxListBox.vue:418–481 | busca por distância de duas viewports; auto-preenchimento separado, teto 20 páginas adicionais |
| MaxListBox.vue:565–595 | foco por teclado atualiza a janela virtual explicitamente |
| useVirtualList.ts:10–19,26–28 | overscan numérico capturado na criação, padrão 5 |
| useVirtualList.ts:53–73 | índices/offset; fim exclusivo calculado sem deslocamento parcial |
| tests/composables/useVirtualList.test.ts | buffer, limites, enabled, scrollToIndex existentes |
| tests/components/MaxListBox.test.ts | virtualização, API, concorrência, filtro, seleção e teclado existentes |
| src/index.ts:221–223; package.json:328–331 | aliases e export direto existentes; não requerem novos exports |
| src/components/MaxInputAutoComplete.vue:166–170; MaxInputPhone.vue:338–342; MaxInputIconPicker.vue:272–276 | consumidores com número estático; compatibilidade necessária |
| Busca useVirtualList em src | também MaxInputAutoCompleteApi, MaxInputSelect e MaxTagSelect |
| package.json:556–582; vitest.config.ts | comandos reais, suíte unitária happy-dom sem layout real |
| COMPONENTS.md | catálogo existente, sem subseção MaxListBox identificada |
| git rev-parse --show-toplevel; git status --short | raiz confirmada; estado inicial sem alterações |

Convenções mandatórias: Composition API exclusiva, SFC template/script setup/style; base de quatro espaços no script Vue; aspas simples/ponto e vírgula/sem trailing comma; classes legadas preservadas; nenhuma reintrodução de PrimeVue. Biblioteca max-use somente via npm.

Documentação oficial consultada via Context7: Vue 3, props e computed (`https://vuejs.org/guide/components/props`, `https://vuejs.org/guide/essentials/computed`). O contrato usa computed/unref já presentes no projeto. A documentação consultada não é um manual específico de Vue 3.6 RC. package.json declara Vue `^3.6.0-rc.10`; a instalação efetiva não foi validada. Nenhum teste, instalação, build ou serviço foi executado nesta sessão.

Achado fora de escopo: divergência documental sobre PrimeVue registrada em `docs/notifications/wt-3eb968fe/notifications/documentacao-primevue-desatualizada.md`. Não há correção dessa divergência no plano.

## 4. Solução, decisões e alternativas

### Decisões confirmadas pelo usuário

1. Buffer de renderização, não pré-fetch nem pageSize.
2. Nome `overscan`, em vez de `numToleratedItems`; mantém a nomenclatura técnica presente em MaxCardList e opções do MaxTable.
3. Padrão 5 e configuração reativa, por lado.
4. Normalização defensiva, sem erro lançado e sem teto arbitrário.
5. Corrigir fim da janela para cobrir a última linha parcialmente visível; aceite explícito de uma linha adicional nos demais consumidores em scroll não alinhado.

### Proposta técnica executável

Alterar apenas o necessário no virtualizador existente:

- `UseVirtualListOptions.overscan?: MaybeRef<number>` aproveita o tipo local existente, sem expor um novo tipo público.
- Trocar a captura estática por computed que resolve unref, valida `typeof valor === 'number'` e `Number.isFinite`, normaliza e retorna 5 para inválidos/ausentes.
- Usar o valor do computed nos dois índices.
- Fim exclusivo: `Math.min(total, Math.ceil((scrollTop + effectiveViewportHeight) / itemHeight) + buffer)`.
- Preservar clamp do início, fallback de itemHeight, fallback da viewport, offset/altura, scrollToIndex e ramo desabilitado.
- No componente, declarar default 5 e passar `computed(() => props.overscan)`; não passar um número capturado na montagem.
- Não acrescentar watcher de fetch, watcher de remontagem, eventos novos ou mudanças nos outros consumidores.

Alternativas descartadas: manter ausência de prop (não atende escolha da entrevista), config apenas inicial (não atende R2), objeto de opções complexo ou virtualizador novo (escopo desnecessário), numToleratedItems (usuário preferiu overscan), manter fórmula antiga (não atende R4), teto arbitrário (não aprovado).

Não há hipótese crítica de contrato externo. A eficácia perceptível do buffer depende do conteúdo e dispositivo; não prometer que valor maior sempre melhora desempenho. Não há migração, dados persistidos, anexos, isolamento multitenant, fornecedor/modelo ou implantação de serviço envolvidos.

## 5. Execução por tarefas e marcos

### T0 — Revalidar e preparar execução autorizada

- Ler AGENTS.md e skills aplicáveis a implementação/TDD/testes/revisão.
- Confirmar raiz com `git rev-parse --show-toplevel`, HEAD com `git rev-parse HEAD` e mudanças com `git status --short`.
- Conferir se T1–T4 já foram implementadas. Não sobrescrever trabalho do usuário nem repetir etapas concluídas sem necessidade.
- Confirmar scripts em package.json e dependências disponíveis; não usar npx para baixar ferramentas automaticamente. Se ausentes, interromper e pedir autorização de provisionamento.
- Se HEAD/código mudou, reavaliar evidências afetadas e registrar revisão factual; não reabrir decisões de produto sem novo requisito/evidência.
- Conclusão: ambiente correto e arquivos-alvo sem conflito; autorização de implementação recebida. Divergência da worktree ou conflito exige pausa com próxima ação concreta.

### T1 — Composable: reatividade, normalização e cobertura parcial

Dependência: T0. Escrita exclusiva em `tests/composables/useVirtualList.test.ts` e `src/composables/useVirtualList.ts`.

1. Escrever testes novos primeiro, com dados determinísticos (1.000 itens, itemHeight=50, viewport=500) e verificar falha esperada. Falha de import/toolchain não conta como Red.
2. Cobrir número e ref/computed, default, 0, 20, -2, 2.9, NaN e ±Infinity; teste defensivo de entrada não numérica deve usar cast restrito ao cenário de runtime.
3. Cobrir mudança reativa de 5 → 20 → 0 com viewport já definida, sem chamar setViewport novamente; start/end/offset mudam, totalHeight não.
4. Cobrir scrollTop=25: buffer zero → [0,11); com buffer 5 → [0,16). Em scrollTop=5000, buffer 5 → [95,115), e buffer 20 → [80,130).
5. Testar extremos, lista curta/vazia, buffer superior ao total, enabled=false e preservação de scrollToIndex. Acrescentar caso desalinhado no meio e no fim.
6. Implementar mínimo previsto na seção 4, executar os testes e revisar a alteração compartilhada antes de integrar o componente.

Validação: `npm run test -- tests/composables/useVirtualList.test.ts`. Conclusão: casos novos e antigos passam; nenhum método/contrato alheio alterado. Revisão independente no marco do cálculo compartilhado, se disponível; não exigir subagente por microedição.

### T2 — MaxListBox: contrato público e integração

Dependência: T1. Escrita exclusiva em `tests/components/MaxListBox.test.ts` e `src/components/MaxListBox.vue`.

1. Adicionar testes antes da integração: default, prop 20, zero, normalização refletida no DOM e mudança por wrapper.setProps sem scroll/remount.
2. Usar itemHeight=50 para contagens exatas com viewport inicial de 400px. No topo: default 13 itens; buffer 20 → 28; zero → 8. Para testar layout/scroll realista em happy-dom, definir clientHeight/scrollHeight/scrollTop e disparar scroll como a suíte existente.
3. Em scrollTop=25 e viewport=400, buffer zero deve renderizar 9 linhas, não 8; conferir primeiro/último índice e translateY, sem testar somente “menos que total”.
4. Testar disabled/nonvirtual, threshold automático e modos local/API. No modo API usar callback mockado, resolver a primeira página com itens suficientes, capturar número de requests e mudar apenas overscan; chamadas e argumentos não devem aumentar/mudar.
5. Testar preservação de seleção/eventos e aria-activedescendant com zero e navegação End/Home; conferir alvo existente no DOM após nextTick.
6. Declarar prop/default/JSDoc e repassar fonte computed; não alterar template, CSS, listeners ou fetch.

Validação: `npm run test -- tests/components/MaxListBox.test.ts`. Conclusão: contrato confirmado observável no DOM, sem eventos/request extras e suíte antiga preservada.

### T3 — Documentação do consumidor

Dependência: T2 para conferir a assinatura real. Escrita em `COMPONENTS.md`; JSDoc já pertence à T2.

- Inserir uma subseção MaxListBox em Cards e Listas, sem atualizar contagens globais ou reconstruir catálogo.
- Documentar virtualScroll/threshold/itemHeight/pageSize apenas para contextualizar overscan com base no código real.
- Exemplo mínimo com `:overscan="20"`; deixar claro “até 20 por lado”, 0, default, mudança reativa, normalização, dados já disponíveis, custo de valores altos e altura fixa.
- Não atualizar planos históricos em docs/superpowers nem corrigir README fora de escopo.

Conclusão: revisão textual compara documentação com R1–R9 e assinatura implementada. Exemplo usa prop numérica com binding, não string `overscan="20"`.

### T4 — Regressão, revisão de entrega e handoff

Dependência: T1–T3. Sem novos arquivos de produção previstos.

1. Regressão focada dos consumidores identificados:

```bash
npm run test -- tests/composables/useVirtualList.test.ts tests/components/MaxListBox.test.ts tests/components/MaxInputAutoComplete.test.ts tests/components/MaxInputAutoCompleteApi.test.ts tests/components/MaxInputSelect.test.ts tests/components/MaxTagSelect.test.ts tests/components/MaxInputPhone.test.ts tests/components/MaxInputIconPicker.test.ts
```

2. Executar `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build` e `npm run test`. Build escreve artefatos: executar somente na sessão Execute autorizada e dentro da worktree.
3. Fechamento amplo: `npm run test:coverage` e `npm run test:browser` se infraestrutura instalada/disponível. Nenhuma instalação de browsers automática sem autorização. Suíte browser existente não é prova específica do MaxListBox; fazer a validação manual descrita na matriz.
4. Revisão independente da entrega: correspondência contrato/testes/docs, compatibilidade compartilhada, acessibilidade, ausência de fetch adicional e escopo do diff. Revisão pode ser outra sessão ou revisor humano; se indisponível, registrar pendência, não alegar independência.
5. Não executar `npm run release`. Não executar `npm run verify` sem revisar previamente seus scripts/autorizações: inclui consumidores, audit e outras ações mais amplas.
6. Entregar arquivos mudados, resultados por comando, revisões factuais e bloqueios/próximas ações. Sem commit/merge/push.

## 6. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência de aceite futura | Testes pertinentes | Revisão pelo risco | Verificação manual |
|---|---|---|---|---|
| T0 / contexto | Raiz/HEAD/status revalidados, conflito ausente | Não aplicável | Preservação de trabalho local | Confirmar autorização e worktree |
| T1 / R2–R5,R8 | Índices exatos, normalização e reatividade | useVirtualList: ref/computed/número, extremos, scroll parcial | Independente no marco compartilhado | Sem necessidade de layout para aritmética |
| T2 / R1–R6 | DOM e offset respondem a prop; foco/seleção íntegros | MaxListBox: default, zero, 20, setProps, teclado, threshold | Conferir a API e efeito dos próximos ticks | Navegador: topo/meio/fim e scroll entre linhas com zero |
| T2 / R7 | Número e argumentos das chamadas conservados | Mock de loadOptions, mudar apenas buffer; suíte API existente | Conferir ausência de watchers/requests novos | Com dados sintéticos/mock local, alterar buffer sem rolar e conferir requests |
| T3 / R9 | Texto e exemplo compatíveis com o código | Revisão de conteúdo contra R1–R9 | Distinguir renderização de paginação | Conferir exemplo e normalização documentada |
| T4 / R6,R8 | Suites existentes, tipos/lint/build e revisão aprovados | Comando focado de regressão + suíte ampla/cobertura/browser | Independente na entrega, confirmar diff restrito | Navegar por teclado e confirmar alvo ARIA existente |

Ambiente seguro: fixtures sintéticas, mocks, sem endpoint de produção. A inspeção manual futura pode usar playground já existente (`npm run dev:playground` confirmado), mas nesta sessão nenhum servidor será iniciado. Se não existir cenário utilizável, definir um fixture mínimo na sessão Execute mediante registro de revisão factual de arquivos; não inventar URL/porta ou resultado. A execução não está totalmente concluída enquanto houver validação exigida bloqueada/manual pendente.

## 7. Riscos, compatibilidade e recuperação

- **Cálculo compartilhado:** scroll desalinhado renderiza até uma linha adicional; default em scroll alinhado permanece igual. Revisar consumidores sem alterar suas APIs estáticas.
- **Valores altos:** maior custo de DOM/slots; sem promessa de desempenho ou teto oculto. Buffer não reduz dados em memória.
- **Reatividade:** capturar props.overscan como número quebra R2; teste deve falhar antes da integração e passar sem setViewport adicional.
- **Layout:** happy-dom não comprova ausência de lacunas no navegador. Verificação manual com alturas reais é necessária; medição inicial/resize fica fora de escopo.
- **Contagens antigas:** só atualizar expectativas com justificativa do caso parcial; não afrouxar asserts para mascarar regressão.
- **Paginação e seleção:** manter sem alterações; mocks devem verificar ausência de efeitos novos.
- **Toolchain indisponível/falha preexistente:** distinguir do código da tarefa e registrar próxima ação. Repetir a mesma falha sem progresso exige diagnosticar a causa antes de nova tentativa.
- **Recuperação:** alteração aditiva sem migração. Se regressão aparecer, interromper entrega e corrigir/revalidar o diff da tarefa. Qualquer reversão deve atingir somente mudanças próprias e requer autorização; nunca reset/checkout de trabalho alheio. Nenhum rollout automático.

## 8. Progresso, delegação futura e retomada

Somente durante Execute, com permissão de escrita ampliada, registrar após T1, T2 e entrega/handoff em `docs/plans/wt-3eb968fe/execution-state.json`. **Não criar esse arquivo em Plan.** Vincular o registro ao SHA256 real dos bytes de plan.md, calculado pelo executor, sem valor inventado. Se o plano mudar, recalcular o hash e reconciliar o trabalho já feito.

Proposta de conteúdo do registro: caminho/hash do plano, HEAD revalidado, tarefa, número da revisão factual, estado (pendente/em andamento/concluída/bloqueada), arquivos escritos, evidências, comandos/resultados por revisão, revisão de conteúdo, validações manuais pendentes e próxima ação. Não registrar segredos. Não marcar tarefa concluída só porque a escrita terminou.

Não há necessidade de delegação para uma mudança pequena. Se houver múltiplos executores autorizados, T1 → T2 são sequenciais; T3 espera assinatura consolidada e pode rodar em paralelo com regressão somente quando nenhum executor alterar os mesmos arquivos. Dar contexto mínimo: tarefa, requisitos aplicáveis, trechos da spec/plano e arquivos de escrita exclusivos. Revisor usa diffs e matriz, sem releitura integral compulsória por microedição.

Na retomada: conferir hash/estado, trabalho existente e alterações locais; executar somente lacunas; validar etapa antes das dependentes; não reabrir escolhas confirmadas sem nova evidência ou requisito. Em bloqueio, informar exatamente o que falta e a próxima ação (ex.: obter autorização de provisionamento ou executar cenário manual no navegador).

## 9. Revisão final deste planejamento

- Pedido delimitado por entrevista e separado de pré-fetch; R1–R9 cobrem decisões confirmadas.
- Solução mínima reaproveita composable; não introduz dependência, configuração global ou estilos novos.
- Impacto da correção compartilhada explicitamente aceito; fórmula, casos extremos e regressão documentados.
- Arquivos existentes separados dos documentos novos; exports existentes não serão reescritos.
- TDD focado por tarefa, dependências sequenciais, revisão nos marcos de risco e matriz de aceite vinculada ao conteúdo.
- Protegidos paginação, seleção, teclado, classes e trabalho local; achado documental geral isolado em notificação.
- Comandos identificados no projeto; todos os resultados de implementação/validação permanecem futuros, sem alegação de execução.
- Handoff/SHA256 previstos só para Execute; interrupções e retomadas têm ações concretas.
- Respeitada a limitação de escrita desta sessão: apenas spec, plano e notificação nos destinos autorizados.
