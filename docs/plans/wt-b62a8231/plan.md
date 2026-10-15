# Plano de execução — aviso de recurso em desenvolvimento no MaxApp

## 1. Identificação e autorização

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree/branch obrigatória: `wt-b62a8231`.
- Raiz exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-b62a8231`.
- Base investigada: `c65fa863ce5bf035816b85e81a5345f248879c14`; status inicialmente limpo.
- Especificação vinculada: [spec.md](./spec.md).
- Estado: planejamento para revisão, não autorização para implementar/publicar. Nesta sessão só foram escritos os documentos autorizados.

## 2. Resultado e limites

Quando o menu correspondente à rota atual declarar `is_disponible === false`, manter normalmente a navegação e apresentar **“Recurso em desenvolvimento. Este recurso estará disponível em breve”** centralizada no espaço da página, sem montar o conteúdo real da rota.

Usuários afetados: pessoas autenticadas usando o layout padrão de `MaxApp` em desktop ou mobile. Consumidores sem o novo campo mantêm o comportamento atual.

Não esconder/desabilitar menus; não mudar cliques, URLs, rotas, autenticação, permissão de API, cache, backend ou o contrato de substituição completa do slot `authenticated`. Não migrar stores, refatorar componentes adjacentes ou corrigir achados fora do escopo. Não instalar dependências, criar outra worktree, trocar branch, commitar, integrar, publicar ou remover esta worktree.

## 3. Evidências e decisões para execução

### Fluxo confirmado

1. `src/components/MaxApp.vue:4–48` decide entre site/blank, login e layout autenticado; dentro do layout padrão há `RouterView` na linha 43.
2. `src/components/MaxPageLayout.vue:24, 64–66` entrega o slot padrão ao corpo mobile ou a `MaxPageContent` no desktop. Topo e navegação ficam fora desse slot.
3. `src/components/MaxSideMenu.vue:137–146` e `src/components/MaxSideMenuMobile.vue:204–220` selecionam fontes de menus com precedências diferentes. Preservar essas diferenças nesta tarefa.
4. `src/stores/useListMenus.Store.ts` já centraliza menus com MaxUse/cache. `src/stores/useUser.Store.ts` declara o contrato MaxPinia do usuário; `MaxApp` já usa `useMaxPiniaSaveTracker`. A funcionalidade só lê estado existente: não adicionar camada HTTP, store paralela ou persistência de disponibilidade.
5. `src/helpers/menuHelpers.ts` oferece extração de subitens e aliases de destino; `src/helpers/menuRouteMatches.ts` usa `snakeCase` de MaxUse e suporta `matches`.
6. `src/components/MaxEmptyDiv.vue` já é um estado centralizado reutilizável com slot padrão e modo transparente. Não falta componente ou helper genérico de MaxUse necessário a esta solução.
7. `src/components/MaxPageContent.vue:95–109` e `src/components/MaxPageMobileLayout.vue:138–184` delimitam áreas úteis distintas; a mensagem não deve ocupar `100vh`.
8. `tests/components/MaxApp.test.ts` já tem rota/ref de menus reativas e autenticação simulada; `tests/setup.ts` substitui `getComputedStyle`. A validação geométrica precisa do navegador real.

### Decisões propostas, sem perguntas pendentes

- Comparação estrita sobre `item.is_disponible ?? item.details?.is_disponible`; raiz não nula prevalece. Não converter strings ou números em booleano.
- Resolver a fonte realmente exibida: desktop itens → grupos → store; mobile grupos → itens → store. Usar lista não vazia, como hoje. Manter filtros de `hide` exatamente como os respectivos componentes; o campo novo não é filtro.
- No mobile, acrescentar abas customizadas informadas em `bottomTabs`, adaptando `name` para destino. Não deixar abas ocultas no desktop bloquearem páginas.
- Destino direto vence alias `matches`; entre candidatos da mesma categoria vence o mais profundo, depois a primeira ocorrência. Em empate entre fonte lateral e abas, a lateral vem primeiro.
- Corresponder nomes normalizados via MaxUse e caminhos `/...` por igualdade exata com `route.path`. Ver `spec.md`, seção 3.2, para todos os aliases.
- Sem herança implícita de indisponibilidade do pai para filho; sem mapas privados de rotas de negócio; sem correspondência por título/prefixo de URL.
- Menus ausentes, atualização pendente ou nenhuma correspondência mantêm o conteúdo atual. Reatividade corrige a exibição quando os dados chegam. Não se trata de controle de acesso.
- Preservar o slot `authenticated` como substituição completa: a regra automática se aplica ao fallback padrão de `MaxApp`.
- Não adicionar prop/evento/slot público para personalizar a mensagem, pois não foi solicitado.

Alternativas descartadas: ocultar/desabilitar menus contraria o pedido; alterar todos os handlers duplicaria a regra e falharia no acesso direto; guarda global/redirecionamento ampliaria o escopo; `v-show` deixaria a página montada; novo componente de aviso duplicaria `MaxEmptyDiv`; migrar o cache de menus não é necessário.

### Limites de investigação

Não foram executados testes nem confirmado ambiente instalado, symlinks, plugin MaxPinia real ou payload de aplicação consumidora. O manifest declara MaxUse `^1.1.47` e peer MaxPinia opcional `^0.2.0`; o lockfile registra Vue `3.6.0-rc.10`, Router `5.3.1` e MaxUse `1.1.47`. Não há entrada de MaxPinia no lockfile pesquisado. Não afirmar disponibilidade/compatibilidade instalada sem preflight.

A documentação oficial Vue 3 confirma a diferença de montagem entre `v-if` e `v-show`: <https://vuejs.org/guide/essentials/conditional>. Ela orienta o desenho, mas não comprova os resultados da versão local.

## 4. Tarefas ordenadas

### T1 — Preflight por leitura e conferência de contratos

**Escritas:** nenhuma de implementação até autorização de Execute e conclusão deste gate.

1. Ler este plano e a especificação na primeira admissão; verificar instruções aplicáveis. Nas retomadas, consultar somente trechos pertinentes.
2. Confirmar raiz, branch, `git status --short` e diff atual; não assumir que o executor encontrará a mesma revisão. Investigar/preservar trabalho preexistente e nunca descartar alterações de terceiros.
3. Reler os sete arquivos-alvo abaixo e os trechos de layout/menus apontados nas evidências. Confirmar que as fontes e seus filtros ainda são os mesmos.
4. Ler `package.json`, lockfile, configs Vitest e setups, scripts dos gates e eventuais prehooks. Confirmar resolução/symlinks efetivos de Vue, Pinia, Axios e MaxUse; o adapter Axios do browser setup precisa interceptar a instância usada por MaxUse.
5. Não executar chamadas reais de usuário, menus, ícones ou impersonação. Nos testes, usar instância Pinia isolada, dados sintéticos, router em memória, armazenamento local ao teste e transportes simulados. Não copiar `.env` nem tocar em banco, cache, filas ou storage compartilhados; esta mudança não precisa desses serviços.
6. Verificar disponibilidade local das ferramentas e Chromium. Ausência de ferramenta exige próxima ação/autorização, não instalação automática. Falha de integridade de biblioteca bloqueia validação dependente: não usar comando direto para contornar gate, remover prehook ou ignorar configuração.

**Saída:** contratos e ambiente viáveis, ou tarefa `blocked`/`manualPending` com próxima ação concreta. Não reabrir decisões sem evidência nova relevante.

### T2 — Contrato opcional e resolver puro

**Arquivos existentes:** `src/types/app.ts`, `src/components/MaxBottomMenu.vue`.

**Arquivo novo proposto:** `src/helpers/menuAvailability.ts`.

1. Acrescentar `is_disponible?: boolean | null` com JSDoc a `SideMenuItem`, `SideMenuDetails`, `SideMenuSubItem` e `BottomTab`. Não tornar campo obrigatório nem alterar exports existentes.
2. Implementar `isCurrentMenuUnavailable` como helper interno puro, recebendo lista de itens e rota mínima `{ name?: string | symbol | null; path?: string }`. Usar os contratos existentes de item/subitem; abas são adaptadas pelo chamador, sem dependência de SFC no helper.
3. Reutilizar `getSubItems`, `getMenuItemRoute`, `isMenuRouteActive` e `snakeCase` de MaxUse. Separar correspondência direta de alias para respeitar prioridade, incluindo `page_component` plano e dentro de `details`.
4. Percorrer subitens sem mutação, com proteção de objetos já visitados para ciclos. Listas vazias/nulas, destino em branco e rota ausente não devem lançar erro. Não ampliar o comportamento dos helpers compartilhados existentes.
5. Aplicar as regras da seção 3.2 da spec, inclusive conflitos de disponibilidade e fonte. Documentar que o helper não aplica segurança ou herança implícita.

**Saída:** contrato aditivo e resolução determinística, sem acesso ao DOM, rede ou cache.

### T3 — Troca de conteúdo no MaxApp

**Arquivo existente:** `src/components/MaxApp.vue`.

1. Instanciar a store de menus existente e criar computeds para dispositivo, fonte efetiva e indisponibilidade. Ler dados das props/store dentro da computação para preservar reatividade; não guardar cópia em `ref` independente.
2. Replicar somente a seleção de fonte já usada pelo dispositivo, sem alterar os componentes de menu. Acrescentar abas customizadas apenas no mobile e somente após a fonte lateral.
3. Dentro do slot padrão de `MaxPageLayout`, renderizar `MaxEmptyDiv` transparente quando indisponível, com slot padrão contendo o texto estático exato, `role="status"` e `aria-live="polite"`; renderizar o `RouterView` existente no `v-else`.
4. Importar explicitamente componentes/helpers/stores, conforme a biblioteca. Não depender dos auto-imports de aplicações consumidoras.
5. Acrescentar estilos scoped `.max-app-unavailable` para largura/altura úteis, centralização, padding, quebra de texto e tokens existentes. Se necessário, usar classe condicional no layout e seletor deep no próprio `MaxApp` para resolver a altura/box-sizing da `.mobile-page-body` somente neste estado. Evitar `100vh`, posicionamento fixo, CSS global e ajustes nos layouts compartilhados.
6. Preservar integralmente o slot `authenticated`, demais ramificações, slots do topo, extras, singletons e eventos. Manter URL/navegação e menus sem mutações.
7. Manter ordem template → script setup TypeScript → style SCSS scoped, recuo base de quatro espaços no script e tags de abertura editadas em linha única. Não reformatar trechos sem relação com a tarefa; não introduzir PrimeVue.

**Saída:** indisponibilidade troca só o conteúdo; páginas disponíveis e contratos do shell ficam inalterados.

### T4 — Implementar todos os testes do lote

**Arquivo existente:** `tests/components/MaxApp.test.ts`.

**Arquivos novos propostos:** `tests/helpers/menuAvailability.test.ts`, `tests/browser/maxAppAvailability.browser.ts`.

1. Helper: cobrir false/true/ausência/null, números/strings em payload runtime, raiz versus `details`, rotas diretas/normalizadas, `page_component` plano/aninhado, `rota`, caminhos exatos, `matches`, subitens em cada alias de lista, profundidade, empates, pai sem herança, ciclos, item não relacionado e dados vazios.
2. Integração: aproveitar fixtures e Pinia do arquivo existente; limpar `menusRef` e campos adicionais da rota em cada teste para não contaminar a suíte. Asserir aviso exato, ausência de página, shell/menu preservado e quantidade de itens idêntica com true/false.
3. Testar fontes da store, props `sideMenuItems`, `sideMenuGroups`, precedências conflitantes desktop/mobile e abas inferiores. Testar props vazias usando fallback, rotas sem item e atualização tardia da ref de menus.
4. Testar navegação reativa entre recurso disponível e indisponível, mudança do campo nos dois sentidos e substituição de props; usar contadores de montagem/desmontagem do componente de página para não depender apenas de CSS/DOM escondido.
5. Preservar regressões existentes: site/blank/blankPages, login/guest, erro de bootstrap/retry, slot `authenticated`, slots do topo, extras e eventos. Incluir caso em que menu falso não interfere nesses ramos.
6. No browser, seguir o harness de `tests/browser/fontSizePreference.browser.ts`, `vitest.browser.config.ts` e `tests/browser.setup.ts`: app isolado, temas reais, router em memória e dados sintéticos. Não mascarar centralização com layout stub nem usar `getComputedStyle` do setup unitário.
7. Navegar via item real por clique/Enter; comprovar alteração da rota, aviso e contador de montagem igual a zero enquanto falso. Acesso direto à rota deve produzir o mesmo estado quando os menus já estiverem conhecidos. No mobile, abrir a gaveta para verificar item e fechar antes de medir o corpo.
8. Medir bloco textual contra área útil de `.pane1` desktop e `.mobile-page-body` mobile, descontando padding: erro de centro horizontal/vertical ≤ 8 CSS px. Cobrir `1280×800` e `390×844`, claro/escuro, ausência de overflow/sobreposição e volta à página disponível. Limpar app, hosts, teleports, estilos de tema e estado após testes.

**Saída:** todo o escopo e seus testes implementados antes dos gates. Não executar testes/tipos/builds a cada microedição ou enquanto outra implementação do mesmo lote estiver incompleta.

### T5 — Validar o lote, revisar e entregar evidências

1. Executar os gates abaixo depois de T2–T4 completos, respeitando preflight/prehooks. Corrigir falhas em lote; repetir somente verificações invalidadas por mudanças, falha ou dúvida concreta.
2. Diagnosticar de forma agrupada problemas de harness/bootstrap antes de repetir testes equivalentes. A mesma falha sem progresso exige causa identificada, não repetição cega ou correção de baseline fora do escopo.
3. Revisar diff por risco: contrato aditivo, comparação estrita, fonte efetiva, montagem/desmontagem, preservação de slots, acessibilidade e geometria. Usar revisão independente no marco de entrega se houver executor/revisor disponível; sem delegação automática ou revisões por microedição.
4. Conferir manualmente leitura do aviso, menus acessíveis e centralização nas duas dimensões. Preferir harness local de navegador, sem depender de API/credencial real. O playground `layout-shell.vue` apenas monta exemplos básicos de `MaxApp`; iniciar o playground não comprova esta funcionalidade.
5. Registrar comandos/saídas reais, falhas e pendências; atualizar o estado de execução conforme seção 8. Submeter diff bruto final às verificações de entrega exigidas pelo projeto, sem incluir dados sensíveis.
6. Entregar resumo dos arquivos e resultados vinculados à revisão. Se faltar navegador, ambiente isolado ou aceite manual, registrar pendência e próxima ação; não relatar conclusão integral. Não commitar, publicar, integrar ou limpar a worktree.

## 5. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência observável | Testes/gates pertinentes | Revisão pelo risco | Verificação manual |
| --- | --- | --- | --- | --- |
| T1: ambiente seguro | Raiz/branch certas; módulos efetivos conhecidos; transportes isolados | Preflight por leitura; gates de integridade antes dos dependentes | Sem escrita fora da worktree, rede acidental ou bypass | Confirmar Chromium e isolamento; bloquear se ausentes |
| T2: booleano estrito | Só valor efetivo false produz indisponibilidade | Novo teste de helper + cobertura + build/tipos | Conflitos raiz/details, dados legados e comparação sem coerção | Revisar exemplos sintéticos dos dois formatos |
| T2: identidade correta | Destino/alias/subitem específico selecionado com precedência previsível | Helper: nomes, caminhos, listas, empates, ciclos e pai/filho | Evitar bloquear rota por rótulo, prefixo ou mapa implícito | Conferir regras da spec com diff |
| T3: substituição sem montar página | Texto exato; RouterView não montado; URL segue rota | Integração + browser com contadores de ciclo de vida | Não usar v-show; guards não são prometidos como bloqueados | Clique e Enter em item indisponível; voltar a disponível |
| T3: menus/fontes preservados | Quantidade/visibilidade e interação não mudam por false | Integração desktop/mobile, store/props/abas | Sem filtro, disabled ou leitura de fontes substituídas | Abrir gaveta/flyout e conferir item |
| T3: compatibilidade do shell | Ramos públicos/login/erro e slots/eventos permanecem | Suíte existente de MaxApp e suíte completa com cobertura | Slot authenticated continua substituição integral | Conferir extras/topo durante aviso |
| T4: reatividade | Mudança de rota, dados e props troca conteúdo sem reload | Integração false↔true e chegada tardia de menus | Sem cópia de estado ou cache paralelo | Observar troca e ausência de aviso residual |
| T4: centralização/acessibilidade | Centro com erro ≤ 8px; sem overflow; status legível | Browser nos dois viewports/temas; anúncio/status | Área útil, padding, foco e barras preservados | Leitura, teclado e inspeção visual claro/escuro |
| T5: entrega verificável | Todos os gates previstos vigentes aprovados | Sequência abaixo; revisão final do diff | Resultados pertencem ao conteúdo efetivamente testado | Pendências explícitas impedem conclusão integral |

## 6. Comandos confirmados e sequência de validação futura

Todos existem em `package.json`; **não foram executados nesta sessão Plan**. Após inspeção dos scripts/preflight e autorização de Execute:

```bash
npm run check:filenames
npm run check:lockfile
npm run type-check:test
npm run lint
npm run build
npm run test:coverage
npm run test:browser
```

- Executar integridade primeiro; falha relevante bloqueia gates dependentes. Não ignorar prehooks.
- `build` já contém `vue-tsc` e Vite: não repetir `type-check` sobre o mesmo conteúdo sem motivo concreto.
- `test:coverage` já executa a suíte unitária completa e limites globais: não repetir `test` no mesmo conteúdo. A suíte browser usa Chromium e inclui o novo arquivo pelo padrão `tests/browser/**/*.browser.ts`.
- Tipos da suíte são checados separadamente por `type-check:test`.
- Esta é uma mudança de componente, não um release. Não prescrever `verify` completo por rotina; se houver solicitação futura de pré-release, usar `npm run verify` como gate agregado, preservando consumidores, segurança, integridade, cobertura e benchmarks, sem repetir seus componentes na mesma revisão.
- Resultados previamente aprovados só podem ser reaproveitados quando não houver mudança relevante no conteúdo/dependências/harness. Um exit code 0 não comprova que o teste visual ou manual foi feito se não houver evidência específica.

## 7. Riscos, operação e interrupções

- **Payload externo não verificado:** suporte a raiz/details evita exigir decisão de backend. Se o consumidor real usar outra representação ou o destino não existir, documentar evidência sanitizada e pedir decisão somente sobre a lacuna concreta; não inventar rota/campo alternativo.
- **Cache/chegada tardia:** por compatibilidade, estado desconhecido não bloqueia. Não prometer ausência absoluta de efeitos prévios nem proteção de dados. Endpoints e guardas mantêm sua própria segurança.
- **Slot customizado:** não desmontar shell personalizado para impor a regra; isso quebraria contrato explicitamente testado.
- **Layout mobile:** porcentagem de altura isolada pode ser insuficiente. Resolver no estado do próprio MaxApp e comprovar no browser; se exigir alteração estrutural compartilhada além do ajuste delimitado, interromper e revisar escopo com evidência.
- **Aliases/duplicatas:** teste de conflito é obrigatório para evitar aviso em página disponível. Não transformar o marcador visual de menu ativo em regra de autorização.
- **MaxPinia:** manter integração atual e nenhuma escrita de dados. Dublês de Pinia comprovam renderização, não integração externa real do plugin. Não instalar/migrar MaxPinia para fechar esta tarefa.
- **Desempenho:** percorrer apenas fontes efetivas quando dependências reativas mudarem, em custo linear nos itens percorridos; não criar polling, watcher profundo com efeitos ou chamadas de rede.
- **Recuperação:** não há migração nem dados a desfazer. Reversão futura deve remover somente o código introduzido para este comportamento e seus testes, com autorização; nunca resetar a árvore ou descartar trabalho alheio. O campo ausente continua compatível.
- **Achado separado:** ver `../../notifications/wt-b62a8231/notifications/max-components-ui-documentacao-configuracao-legada.md`. Não incluir sua correção no lote.
- Processos assíncronos devem aguardar evento de mudança/conclusão com espera limitada e recuo, sem consultas repetidas sem informação nova. Cancelamento mantém resultados parciais e pendência concreta.

## 8. Progresso, retomada e handoff durante Execute

1. Ler os documentos na primeira admissão; em retomadas, conferir trabalho já realizado e consultar as seções relevantes, sem releitura compulsória de tudo. Revalidar código local antes de assumir tarefa pendente ou resultado aprovado.
2. Dependências: T1 → T2 → T3 → T4 → T5. Uma pessoa pode executar tudo sequencialmente. Delegação futura só se autorizada; fornecer contexto mínimo, task ID e referências. Testes de helper podem ser escritos em paralelo à integração após estabilizar T2, com arquivos de escrita distintos; nenhum gate antes do lote completo. Não permitir dois executores em `MaxApp.vue` ou no mesmo arquivo de teste.
3. Registrar progresso após marcos e no handoff em `docs/plans/wt-b62a8231/execution-state.json`, **somente durante Execute**. Esse arquivo não foi criado nesta sessão e não é um destino autorizado de Plan.
4. Usar o contrato estrito version 2 do executor/MaxCode, sem inventar campos adicionais. Vincular o registro ao SHA256 real do conteúdo final de `plan.md` e tarefas/revisões factuais. Se o executor não dispuser do schema completo de sua ferramenta, obter esse contrato antes de gravar, em vez de improvisar JSON incompatível.
5. Estados de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Motivos e próxima ação ficam em `nextAction`, até 512 caracteres. Não usar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`.
6. Comandos têm até 4.096 caracteres. `verification` segue `{ revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`; hashes são reais de conteúdo, nunca rótulos. Resultados de validação/check só aceitam `passed`, `failed`, `pending`; `blocked` é estado de tarefa, não resultado.
7. `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não aceita exitCode. Registrar todos os comandos efetivamente executados e todas as falhas, inclusive da suíte completa. Não inferir exit code/aprovação de `tool:end.ok`.
8. Checks vazios, falha vigente ou ausência de evidência vigente impedem validação integral. Version 1 é compatível, mas não comprova validação integral automaticamente. Registro autodeclarado não prova execução nativa nem detecta checks omitidos.
9. Repetição sem progresso exige diagnóstico; `blocked` ou `manualPending` precisam de próxima ação concreta. Relatar execução parcial quando faltar qualquer gate obrigatório.

## 9. Revisão do plano

- O ponto de intervenção é a área da página, preservando navegação e contratos existentes.
- Detalhes não definidos pelo usuário foram resolvidos por regras explícitas, aditivas e testáveis; não há decisão essencial pendente de entrevista.
- Cada requisito tem evidência, teste pertinente, revisão de risco e inspeção manual na matriz.
- Arquivos existentes e novos estão identificados; os gates foram encontrados no projeto, mas não executados.
- Não há necessidade de backend, segredo, serviço externo, migração, nova dependência ou publicação.
- O executor deve interromper diante de alteração de escopo, falha de integridade ou ambiente não isolado, sem bypass e sem alegar conclusão total.
