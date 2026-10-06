# Plano de execução — corrigir o tamanho da fonte no perfil do MaxCode

## 1. Identificação e autorização

- Data: 06/10/2026.
- Projeto: `@maxvue/max-components-ui` (`1.1.2`, conforme manifesto).
- Worktree/branch: `wt-ce381176`, baseada em `dev`.
- Raiz: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-ce381176`.
- Especificação: `docs/plans/wt-ce381176/spec.md`.
- Usuários afetados: pessoas que ajustam a legibilidade pelo perfil do MaxCode.

Esta sessão autorizou investigação e escrita destes documentos, **não implementação**. Para executar, obter autorização em modo Execute/Build. Usar a worktree já alocada; não criar outra, trocar branch, alterar a raiz, investigar outras worktrees, instalar pacotes, publicar, commitar, fazer merge/push ou remover a worktree. Integração fica com o MaxCode/usuário.

## 2. Resultado esperado e preservações

**R1 — efeito visual:** aumentar/diminuir a fonte no perfil deve mudar imediatamente o texto que participa da tipografia global, não só o número do controle.

**R2 — consistência:** número exibido, raiz HTML, ref compartilhada, variável `--max-font-size-base` e preferência de usuário devem concordar depois de estabilizar a atualização reativa.

**R3 — persistência:** preservar `max_font_size` no navegador e `settings.fontSize` na store; MaxPinia continua responsável por GET/cache/save. Verificar preferência após recarregar ambiente de teste.

**R4 — compatibilidade:** preservar passo 1, limites 10–24, restauração 16, props/eventos públicos, precedência de prop explícita, tema, perfil, logout, slots e classe legada. Menu permanece aberto durante ajustes; foco e teclado continuam utilizáveis.

**R5 — alcance verdadeiro:** separar correção/testes desta worktree de comprovação no MaxCode. Não entregar “corrigido no MaxCode” com bundle de outra revisão.

Não se pretende ampliar editor Monaco, texto de código ou todas as regras px da aplicação; não usar zoom, escala visual universal, seletores `*` tipográficos ou `!important` para disfarçar a causa. Se a evidência mostrar que o pedido depende de CSS do consumidor, interromper esse ramo e solicitar autorização em contexto próprio, com arquivos exatos e impacto.

## 3. Investigação realizada e limites

### Fatos

1. `pwd` e `git rev-parse --show-toplevel` confirmaram a raiz acima; `git branch --show-current` confirmou `wt-ce381176`. Estado Git inicialmente limpo.
2. Menu existente: `src/components/MaxUserSection.vue`, especialmente template 75–114 e script 254–285. Ajusta o estado local, chama o helper e emite o valor normalizado.
3. Helper existente: `src/helpers/useHtmlFontSize.ts`. Muda `document.documentElement.style.fontSize`, variável CSS e armazenamento local; o composable apenas lê o valor salvo ao inicializar a ref, sem aplicar essa leitura ao DOM automaticamente.
4. Shell: `MaxTopMenu.vue`, `MaxPageLayout.vue`, `MaxPageMobileLayout.vue`, `MaxApp.vue`. O evento atravessa o shell. `MaxApp` aplica e salva; watcher observa carregamento, preferência e prop.
5. `MaxPageLayout.vue` declara `fontSize`, passa ao topo desktop, mas não ao filho mobile. Como prop declarada não pertence a attrs, há divergência estática real no repasse da prop explícita; isso não comprova a causa do relato, pois o topo mobile também lê a store.
6. `src/stores/useUser.Store.ts` já utiliza o contrato de MaxPinia. Não criar nova store para preferências.
7. `tests/helpers/useHtmlFontSize.test.ts`, `tests/components/MaxUserSection.test.ts`, `tests/components/MaxApp.test.ts` e `tests/components/MaxTopMenu.test.ts` cobrem partes do fluxo. Teste do shell injeta evento sintético; nenhum destes comprova texto computado em navegador. `tests/setup.ts` substitui `getComputedStyle` global.
8. `vitest.browser.config.ts` usa Chromium/Playwright, inclui `tests/browser/**/*.browser.ts` e executa `tests/browser.setup.ts`. `tests/browser/MaxToast.browser.ts` oferece padrão de montagem real e limpeza. Não existe teste específico de fonte nessa pasta.
9. Texto do menu usa rem; há textos fixos em px em `InputBase.vue`. Nem toda tipografia responde à raiz; conversão geral está fora do pedido.
10. Manifesto: Vue `^3.6.0-rc.10`, Vitest `^4.1.10`, MaxUse `^1.1.47`, MaxPinia peer opcional `^0.2.0`; versões declaradas não comprovam versões efetivas do processo servido.
11. `.gitignore` já ignora `.worktrees/` e `.max-code-worktrees/`.

### Consumidor lido, sem autorização de escrita

Em `/home/johnattas/GitHub/MaxCode`:

- `resources/App.vue:2`: usa `MaxApp`, sem fonte fixa por prop; não precisa acrescentar listener para repetir comportamento interno.
- `resources/app.ts:104–143`: configura `user.data` e `user.save`; registra MaxPinia com Axios.
- `resources/Theme/All.scss` importa `font.scss`; este define raiz 15px sem `!important`. Estilo inline deveria prevalecer sobre esta regra normal.
- `resources/App.vue` e `resources/Vue/Pages/RunnersPage.vue`: partes da interface usam px; outras usam rem.
- `vite.config.ts:151–169` e links de biblioteca: código usado no desenvolvimento vem de `/home/johnattas/GitHub/MaxComponentsUi/src`, **não desta worktree**. O helper lido na raiz possui o mesmo algoritmo, mas não se comprovou a revisão completa nem o servidor/bundle aberto pelo usuário.

### Ambiente e limitações

- `node_modules` desta worktree é link para o diretório da raiz da biblioteca. Instalações ou escrita dentro dele afetariam ambiente compartilhado. Não reparar esse link neste escopo.
- A leitura de metadados encontrou Vue/MaxUse presentes e ausência de `node_modules/@maxvue/max-pinia`; como peer opcional, ausência não prova erro na biblioteca nem no MaxCode. Aceite integrado real depende do plugin no consumidor.
- A busca nas declarações distribuídas de MaxUse não encontrou equivalente aos helpers de fonte existentes. Reutilizar a API pública do design system, sem criar clone ou migrar código de repositório.
- Nenhum segredo foi lido; não abrir `.env`, credenciais ou banco. Não foi realizada reprodução visual, teste, build, instalação ou chamada autenticada.
- Documentação Vue 3 consultada via Context7: `watch` é agendado e `nextTick` aguarda DOM; use isso para asserções, não sleeps arbitrários. Documentação não específica do RC.
- Notificação de ambiente: `docs/notifications/wt-ce381176/notifications/max-components-ui-ambiente-validacao.md`.

## 4. Solução e decisões

### Confirmadas

- Reutilizar `MaxUserSection` e o shell Max; não reintroduzir PrimeVue.
- Persistência permanece no MaxPinia, integração existente permanece no MaxUse; não criar Axios/HTTP avulso.
- Preservar o helper `useHtmlFontSize` já exportado em `src/index.ts:278`, chave e variável CSS.
- Corrigir a origem comprovada, não o sintoma; testes visuais reais são obrigatórios para este relato.
- Não alterar escolhas visuais, dimensões fixas ou precedência das configurações sem necessidade demonstrada.

### Hipóteses a discriminar na execução

| Resultado observado | Conclusão permitida | Ação mínima |
|---|---|---|
| Clique não chega ao helper | Interação/integração defeituosa | Corrigir handler/repasse demonstrado e testar o clique real. |
| Inline muda, depois volta | Outra fonte de estado sobrescreve | Identificar writer e ordem de atualização; corrigir apenas sincronização causal, preservando prop explícita. |
| HTML computado muda, texto não | Texto medido está fixo ou isolado | Identificar regra/unidade/documento; modificar somente regra causal na biblioteca. CSS do consumidor bloqueia este ramo. |
| Texto rem muda em teste, MaxCode não | Ambiente/revisão/documento diferente ou falha específica do consumidor | Registrar diferença; não modificar biblioteca especulativamente. |
| Apenas recarregamento perde efeito | Inicialização/persistência | Isolar entre preferência remota, ref local e DOM; não introduzir salvamento duplicado nem mudar prioridade. |

O repasse mobile e a leitura local sem aplicação são fatos, mas só entram na implementação se reproduzirem requisito relevante deste defeito. Não ampliar o lote para saneamento geral.

Alternativas descartadas: listener extra no MaxCode para repetir o helper, store paralela, migração de helpers para MaxUse, regra universal de fonte, zoom CSS e atualização de versão como tentativa sem causa.

## 5. Tarefas ordenadas

### T1 — Preflight por leitura e diagnóstico causal

**Dependência:** autorização de execução. **Escrita:** nenhuma até delimitar o ramo.

1. Ler plano/spec e AGENTS aplicáveis; conferir branch/raiz e mudanças já existentes. Não sobrescrever trabalho do usuário.
2. Conferir scripts/pre/post hooks em manifesto, resolução efetiva de dependências, links, versões, instâncias Vue/Pinia/Axios do harness e destinos de caches/artefatos. `vitest*.config.ts`, `tests/setup.ts`, `tests/browser.setup.ts`, `vite.config.ts`, `scripts/check-lockfile.mjs` e manifesto são pontos de partida existentes.
3. Bloquear instalações/alterações em dependências compartilhadas. Caso execução de script possa escrever fora da worktree, resolver a autorização/isolamento antes, sem bypass de hooks/configuração.
4. Antes de validar contrato integrado, confirmar disponibilidade e bootstrap de MaxPinia no ambiente isolado. Um `save` espião serve para unidade, não prova GET/cache/backend. Não copiar `.env` nem testar banco/cache/filas/storage compartilhados. Worktree e transações não demonstram isolamento.
5. Confirmar qual app/documento/revisão exibe o problema. No navegador de teste isolado, medir antes e depois de 16→20: número, eventos, ref, estilo inline/computado de HTML e texto real rem. Aguardar ciclo Vue e frame limitado; verificar também se o valor volta após estabilizar.
6. Para consumidor real, apenas com acesso/ambiente autorizado: identificar bundle/alias carregado, regra vencedora de CSS do texto, valores numéricos de preferência e sequência de save/load. Não registrar payload completo do usuário nem credenciais. Navegar para outra rota e verificar persistência visual.
7. Registrar evidência do ramo e arquivos necessários. Se só o MaxCode exigir edição, não escrever lá: handoff com próximo passo. Se não reproduzir falha na biblioteca, não inventar causa ou mudança de produção.

**Saída:** causa/localização demonstrada ou bloqueio externo concreto. **Gate:** T2 não deve conter correção especulativa.

### T2 — Implementar correção mínima e todas as regressões do lote

**Dependência:** T1. **Arquivos existentes candidatos, não lista de mudanças obrigatórias:**

- `src/helpers/useHtmlFontSize.ts` e `tests/helpers/useHtmlFontSize.test.ts`: somente se helper/recuperação local for causal.
- `src/components/MaxUserSection.vue` e `tests/components/MaxUserSection.test.ts`: somente se interação/sincronização local for causal.
- `src/components/MaxApp.vue` e `tests/components/MaxApp.test.ts`: somente se normalização/persistência/watcher for causal.
- `src/components/MaxPageLayout.vue`, `MaxPageMobileLayout.vue`, `MaxTopMenu.vue` e respectivos testes existentes: somente se passagem de prop/evento for causal; localizar os arquivos de teste antes de alterar.
- Arquivo SCSS/SFC responsável: somente após identificar regra vencedora. Manter proporção visual no valor base e não alterar controles explicitamente fixos sem evidência.

**Novo arquivo proposto:** `tests/browser/fontSizePreference.browser.ts`.

1. Implementar casos de regressão e correção em lote. Preservar asserções anteriores. Não executar suíte, tipos ou build entre microedições.
2. No teste Chromium, montar componentes reais, com Pinia/router quando exigidos, slots mínimos, usuário de teste e estilos SFC reais; não stublar o perfil nem simular `changeFontSize` no lugar de clicar.
3. Medir `getComputedStyle` real de HTML e `.main-item-menu-div`: aproximadamente 14.4px a 16px de raiz e 18px a 20px de raiz. Usar tolerância 0.1px. Confirmar aumento, diminuição, restauração e valor sem reversão após estabilizar.
4. Cobrir modo independente do perfil e fluxo do shell autenticado, desktop/mobile. Se regressão envolver prop explícita, reproduzir também prioridade de prop versus preferência e passagem ao mobile, sem alterar esse contrato.
5. Cobrir armazenamento/montagem e preferência carregada de usuário; limites 10/24; menu aberto; escape/foco; botões e atalhos existentes. Não transformar um teste de teclado em nova política de navegação.
6. Montagem em 320px e 1280px: perfil/overlay e ajuste continuam acessíveis em 10/16/24, sem recorte irreversível ou scroll horizontal criado pela correção.
7. Limpar mounts/overlays, restaurar estilos/variáveis, ref singleton e armazenamento de teste ao final; não usar `localStorage.clear()` na aplicação pessoal do usuário. Bloquear rede real no harness de unidade.

**Saída:** diff mínimo e regressões completas. Sem novo contrato público, endpoint ou alteração de dados.

### T3 — Validação local agrupada e revisão

**Dependência:** implementação inteira concluída e nenhum executor escrevendo.

Após preflight, comandos existentes previstos na raiz desta worktree:

```bash
npm run check:lockfile
npm run test
npm run type-check:test
npm run lint
npm run build
npm run test:browser
```

- Integridade falhada bloqueia validação dependente; não usar comando direto para contornar gate.
- `build` já executa `vue-tsc`; não repetir `type-check` para a mesma revisão sem dúvida concreta.
- Se houver falhas, registrar todas, diagnosticar em conjunto, separar baseline de causalidade e corrigir somente escopo autorizado. Repetir os checks afetados depois do lote de correções; não repetir falha idêntica sem progresso.
- Revisar compatibilidade, normalização, writes duplicados, watchers que podem desfazer escolha, tratamento local/SSR quando tocado e isolamento/limpeza de teste. Não promover outras falhas a escopo sem autorização.
- Para entrega pré-release futura, o gate é `npm run verify`, cujo manifesto agrega integridade, tipos, lint, build, testes/cobertura, navegador, consumidores, benchmarks e auditoria. Nesse cenário, usar o agregado em vez de repetir suas etapas isoladas na mesma revisão; ler antes os scripts de consumidores e comprovar isolamento/autorização de seus efeitos. Este plano não autoriza release.

**Saída:** resultados reais vinculados ao conteúdo validado, revisão por risco e pendências explícitas.

### T4 — Aceite no MaxCode e entrega

**Dependências:** T3 e ambiente/revisão/acesso autorizado do consumidor.

1. Não alterar links, raiz ou dependências do MaxCode. Pedir ao responsável que disponibilize, por fluxo autorizado, a revisão corrigida em ambiente isolado; confirmar qual código está sendo servido antes do aceite.
2. Usar conta de teste, registrar preferência numérica anterior; aumentar, diminuir, restaurar, manter menu aberto, navegar e recarregar. Conferir tamanho computado em texto rem do perfil e texto representativo da página.
3. Conferir que o salvamento por MaxPinia usa `user.save` e o retorno subsequente de `user.data` preserva a preferência. Aguardar conclusão limitada, sem polling repetitivo; não expor cookies ou payload de usuário.
4. Restaurar a preferência original da conta de teste. Não alterar preferências pessoais ou serviços externos nesta sessão Plan.
5. Sem ambiente ou revisão correta: registrar `manualPending`, responsável e próxima ação (carregar revisão validada e repetir procedimento). Não declarar resolução completa do relato.
6. Entregar arquivos realmente alterados, causa comprovada, evidências, resultados e limitações. Nenhum commit/merge/push ou limpeza de worktree.

## 6. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência exigida | Testes pertinentes | Revisão pelo risco | Manual |
|---|---|---|---|---|
| T1 / R5 | Raiz, revisão carregada, links e ramo causal | Não substituído por teste verde | Isolamento e diferença biblioteca/consumidor | Identificar aplicação que apresenta o sintoma |
| T2 / R1 | Clique real e tamanhos computados antes/depois | Novo teste Chromium com estilos reais | CSS causal, sem zoom ou regra universal | Texto do perfil e página variam no MaxCode |
| T2 / R2 | Valor/ref/DOM/variável/pref concordam e não revertem | Helper, perfil e shell conforme ramo | Fontes de estado, prioridade de prop e watcher | Navegar e aguardar estabilização |
| T2 / R3 | Preferência existente recuperada e save acionado | Unidade com dublê + teste isolado de montagem | Sem store paralela, save redundante ou HTTP direto | MaxPinia real e recarga preservam preferência |
| T2 / R4 | Passo, limites, restauração, menu/foco e mobile mantidos | Componentes e Chromium em 320/1280 | Props/eventos/slots e layout compacto | Teclado, extremos e modo mobile |
| T3 / R1–R4 | Comandos reais com saída/código registrados | Lote local ou gate agregado pré-release | Diff final e falhas fora de escopo separadas | Não usar dublês como aceite externo |
| T4 / R5 | Revisão correta + aceite real ou pendência | Reaproveitar checks vigentes sem mudanças | Não afirmar resultado além da evidência | Procedimento na conta de teste, restauração |

## 7. Riscos, recuperação e limites

- **Causa ainda não reproduzida:** é obrigatório discriminar o ramo antes de editar; se não houver defeito local, entregar regressão/diagnóstico e não inventar alteração.
- **Unidades fixas:** mudar fonte da raiz não altera px. Não prometer escalabilidade de toda a UI nem converter o projeto inteiro.
- **Revisão consumida:** alterações nesta worktree não são vistas automaticamente pelo MaxCode. Integração/servir revisão depende de ação externa autorizada.
- **Ambiente compartilhado:** link de node_modules impede assumir instalação ou cache isolado; bloquear comandos com escrita externa até esclarecer.
- **Persistência real:** plugin ausente no harness não pode ser substituído por dublê para afirmar funcionamento de backend/cache.
- **Preferência vs prop:** corrigir sincronização não autoriza modificar contrato de configuração controlada.
- **Desempenho:** não adicionar listeners globais, observers tipográficos ou gravação por frame; reutilizar watchers existentes e evitar ciclos.
- **Recuperação:** não há migração. Antes de integração, revisar diff e manter alterações pendentes na worktree; após eventual implantação autorizada, retorno à revisão anterior e restauração da preferência de teste são ações do responsável. Não apagar estado do usuário.

## 8. Retomada, progresso e handoff

Na primeira admissão, ler plano/spec/instruções. Nas retomadas, consultar a tarefa, dependências e evidências pertinentes; conferir trabalho existente, código atual e alterações locais. Executar lacunas, não refazer checks aprovados sem alteração relevante. Não reabrir decisões sem nova evidência ou requisito. T1→T2→T3→T4 é sequencial; não há benefício de delegação durante a identificação causal. Se delegação futura for autorizada, dividir somente arquivos distintos, fornecer referências e contexto mínimo, reunir todo o lote antes das validações e revisar de forma independente nos marcos de risco/entrega.

Durante Execute, registrar marcos e handoff em `docs/plans/wt-ce381176/execution-state.json`; **não criar esse arquivo na sessão Plan**. Usar version 2, SHA256 real de `plan.md`, tarefas/estados/arquivos e `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`. Cada revisão factual deve derivar de conteúdo real das tarefas; nunca usar rótulos como hash. Comando registrado é o realmente executado, com todas as falhas inclusive suíte completa. `passed` exige código 0, `failed` inteiro diferente de 0, `pending` sem código. Não inferir resultado pelo sucesso da chamada de ferramenta. Checks vazios, falha vigente ou falta de resultado atual impedem validação integral. Version 1 pode ser lida, mas não comprova validação automaticamente; registro autodeclarado não prova execução nativa nem ausência de verificações omitidas.

Bloqueios ou `manualPending` devem nomear próxima ação concreta. Cancelamento mantém progresso parcial e pendências; não narrar conclusão total.

## 9. Revisão final do plano

- Pedido preservado: fonte do perfil no MaxCode, não redesign ou zoom.
- Evidências separadas de hipóteses; regra 15px normal não foi tratada como causa comprovada.
- Nenhum arquivo de produção ou consumidor foi alterado; somente documentos autorizados.
- Arquivos candidatos são condicionais, novo teste proposto é identificado e contratos atuais são preservados.
- Todos os requisitos têm evidência/teste/revisão/manual associados.
- Preflight de ambiente, limites de escrita, integração externa e recuperação foram explicitados.
- Validações são futuras; aceite do MaxCode permanece pendente até revisão correta e acesso isolado.
