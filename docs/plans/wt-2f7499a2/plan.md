# Plano de execução — conter e compactar o MaxSteps no mobile

## 1. Identificação e autorização

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão local 1.1.3.
- Worktree e branch obrigatórias: `wt-2f7499a2`.
- Raiz: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-2f7499a2`.
- Especificação anterior a este plano: `docs/plans/wt-2f7499a2/spec.md`.
- Situação: planejamento concluído; implementação e validações de runtime não executadas. Este documento não autoriza iniciar Execute.

Trabalhar exclusivamente nesta worktree. Não criar outra, trocar branch, fazer commit, merge, push, publicação ou limpeza. Preservar trabalho local que surgir depois deste planejamento. A leitura inicial encontrou árvore limpa, branch correta e `.worktrees/`/`.max-code-worktrees/` ignoradas no `.gitignore`.

## 2. Pedido, comportamento esperado e preservações

Corrigir a largura do cabeçalho mobile para respeitar a tela e o contêiner pai, impedir que MaxSteps ocupe mais de 100% do espaço disponível e aproximar os itens.

### Requisitos

- **R1 — Contenção:** raiz, wrapper e header respeitam o pai e a viewport; não geram overflow horizontal de página.
- **R2 — Compactação:** 4 e 6 etapas ficam simultaneamente visíveis em viewport de 320px e host de 288px úteis, com botões superiores padrão; repetir com labels opcionais. Esse é um alvo proposto de aceite, não uma medição atual.
- **R3 — Excesso controlado:** quantidade maior que a capacidade física mantém rolagem interna existente, sem crescer a caixa externa, ocultar etapas ou sobrepor marcadores.
- **R4 — Compatibilidade:** manter contratos, aparência de estados, labels acessíveis, navegação e comportamento desktop fora dos limites corrigidos.

### Preservar explicitamente

Props e aliases, `value`/`modelValue`, eventos, identificação, cache `useRefCached`, `lazy`, callbacks, `nextOnlyDone`, `allowManual`, registro/desregistro, ordem das etapas, labels mobile, botões e contexto em `stepsContext.ts`. Não reintroduzir PrimeVue, remover classes existentes ou criar API pública.

Não mudar a política atual de override `isMobile`/`mobile` versus media query, nem o breakpoint. Não corrigir estilos globais, MaxStepItem, MaxIconButton, documentação de skills ou consumidores externos nesta entrega.

## 3. Evidências investigadas e limites

| Arquivo existente | Resultado útil para execução |
| --- | --- |
| `src/components/MaxSteps.vue:1–140, 150–234` | Anatomia raiz → wrapper com botões laterais → tablist → itens; labels mobile por prop; mobile automático ou explícito. |
| `src/components/MaxSteps.vue:250–554` | Navegação, cache, modelos e injeção já implementados; não precisam ser refeitos. |
| `src/components/MaxSteps.vue:557–617, 889–997` | Foco da correção: mínimos intrínsecos, wrapper limitado por viewport, base de largura do header e itens mobile mínimos de 68px sem encolhimento. |
| `src/components/MaxStepItem.vue` e `src/helpers/stepsContext.ts` | Registro das etapas, painel e rodapé dependem do contexto existente. Somente referência; não modificar. |
| `src/components/MaxIconButton.vue:79–82, 168–199` | Botões têm tamanho calculado, transformação e pseudoárea de toque. Reduzir escala visual não reduz necessariamente espaço de layout; não alterar o componente global. |
| `tests/components/MaxSteps.test.ts` | Cobertura funcional já existente; bloco mobile não mede layout. |
| `tests/setup.ts` e `vitest.config.ts` | happy-dom, `getComputedStyle` simulado, cache e rede simulados; inadequados para provar encaixe. |
| `vitest.browser.config.ts` e `tests/browser.setup.ts` | Chromium/Playwright, alias/dedupe Vue/Pinia/VueUse, Pinia por teste, Axios e fetch de ícones simulados. Preservar essa infraestrutura. |
| `tests/browser/maxGridLineBreaks.browser.ts:1–49, 290–346` | Padrão existente com `createApp`, host real, `page.viewport`, frames e desmontagem. Novo teste deve tornar resize obrigatório, sem pular silenciosamente se faltar a API. |
| `tests/browser/MaxInputTextList.browser.ts:1–63` | Outro exemplo de montagem e limpeza de testes geométricos. |
| `playground/src/scenarios/panels-tabs.vue:18–48` | Cenário existente de 4 etapas, estados e borda para inspeção manual. Não precisa ser editado. |
| `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.test.json` | Scripts, versões resolvidas, compilação de SCSS e inclusão de testes confirmados por leitura. |
| `scripts/check-lockfile.mjs`, `scripts/check-tracked-filenames.mjs` | Gates existentes de integridade; não executados nesta sessão. |

Versões do lockfile: MaxUse 1.1.47, Vitest 4.1.11, Vue 3.6.0-rc.10. São versões declaradas/resolvidas no repositório, não comprovação dos módulos efetivamente instalados. Não houve instalação, teste, build, servidor ou inspeção de credenciais.

Documentação consultada via Context7: Vitest v4.1.6, `docs/api/browser/context.md` e `docs/guide/browser/visual-regression-testing.md` no repositório oficial `vitest-dev/vitest`. Confirma `import { page } from 'vitest/browser'` e `await page.viewport(width, height)`. A fonte indexada é de patch anterior ao lockfile; o uso também existe nos testes locais. Confirmar tipos do pacote instalado antes de implementar detalhes dependentes da versão.

Não há captura do problema no consumidor nem prova de execução antes/depois nesta sessão. O diagnóstico é por leitura; os testes de geometria devem estabelecer a evidência real. Ancestrais externos já maiores ou deslocados para fora da viewport não podem ser corrigidos genericamente pelo filho; demonstrar contenção em hosts corretamente posicionados e relatar problemas externos sem ampliar escopo.

## 4. Solução e decisões técnicas

1. Ajustar somente SCSS scoped no componente, com classes semânticas existentes. A orientação canônica do `AGENTS.md` prevalece sobre exemplos de aplicativo nas skills.
2. Adicionar `min-width: 0` na raiz e wrapper; preservar `width: 100%` e border-box; usar teto da raiz compatível simultaneamente com pai e viewport, como `min(100%, 100vw)`.
3. Limitar wrapper a 100% da raiz também no mixin. Header deve receber apenas espaço restante entre botões: base flex zero, `min-width: 0` e largura-base compatível, sem somar 100% da linha aos botões/gaps.
4. No mobile, distribuir itens por base zero e permitir encolhimento. Base mínima proposta: 40px em vez de 68px; padding horizontal do cartão até 4px. Ajustar wrappers de cartão/label para que texto não imponha tamanho intrínseco maior que a coluna.
5. Preservar círculos de 28px, badges, linha ativa, foco e conectores; labels truncados dentro da coluna conservam nomes completos em `title`/`aria-label`.
6. Manter `overflow-x` interno, snap e `scrollActiveStepIntoView`. Para quantidades fisicamente incompatíveis com a largura, permitir rolagem no header, nunca na página. Não mascarar overflow por corte global.
7. Não introduzir stores nem helpers. Esta correção não tem GET, salvamento ou novo estado de aplicação; MaxUse e componentes Max já atendem o fluxo, e MaxPinia permanece sem alteração. Qualquer integração remota nova está fora do pedido e exigiria MaxPinia.

Alternativas descartadas: `width: 100vw` (ignora pai/padding); apenas esconder overflow (pode cortar etapas sem resolver mínimos); apenas reduzir `gap` (não remove mínimo de 68px); recalcular largura por JavaScript/ResizeObserver (complexidade dispensável para distribuição CSS); encolher círculos indefinidamente ou criar nova prop (altera aparência/contrato sem necessidade).

## 5. Etapas executáveis e dependências

### T1 — Admissão e preflight por leitura

1. Ler este plano e spec na primeira admissão; em retomadas consultar somente trechos pertinentes e o progresso disponível.
2. Conferir raiz, branch e `git status`; identificar implementações/documentos já feitos sem sobrescrever trabalho alheio.
3. Inspecionar scripts e eventuais prehooks vigentes, resolução efetiva de dependências e symlinks, Vue/Pinia/Axios únicos no harness e disponibilidade do Chromium. Não inspecionar nem copiar `.env`.
4. Revalidar as premissas dos três arquivos de implementação. Não instalar nem alterar versões como correção automática de ambiente. Dependência ausente ou vínculo local proibido deve ser relatado e tratado com autorização específica.
5. Não há banco, filas ou storage de servidor no escopo. Usar apenas estado local de fixture, `cached: false`, Pinia isolada e stubs de rede existentes; proibir chamadas reais de ícones/APIs nos novos casos.

**Saída:** ambiente e contratos conhecidos; impedimentos com próxima ação concreta. Não iniciar validação dependente de biblioteca com integridade inválida; não usar bypass de prehook/configuração.

### T2 — Escrever regressões e implementar o lote completo

Arquivos exclusivos: `src/components/MaxSteps.vue`, `tests/components/MaxSteps.test.ts` e novo `tests/browser/MaxSteps.browser.ts`.

1. Renomear o teste unitário estrutural para não prometer prova de largura; manter suas asserções.
2. Completar combinações de classes, `isMobile`/`mobile`, labels, nomes acessíveis e presença/ausência de botões sem medir CSS no happy-dom. Preservar a suíte funcional de navegação e bloqueios.
3. Criar teste browser com `createApp`/`h`, MaxSteps e MaxStepItem reais; host dentro do documento, com altura definida, padding e box-sizing conhecidos. Carregar o SCSS real compilado pelo plugin Vue, sem injetar CSS que reproduza a correção apenas na fixture.
4. Criar fixtures flex e grid que exponham mínimos intrínsecos: não adicionar `min-width: 0` ou `overflow: hidden` de teste para esconder a falha no próprio MaxSteps. Limitar somente o host/pai de maneira válida.
5. Implementar os ajustes da seção 4. Não refatorar template inteiro ou lógica funcional. Se editar tags, mantê-las em linha única, conforme `AGENTS.md`.
6. Preparar as medições e interações da matriz abaixo. Restaurar viewport, estilos globais temporários, montagem e hosts em limpeza garantida; nunca depender da ordem dos testes. Usar `nextTick`, frames e espera limitada por condição para scroll suave, sem sleeps arbitrários longos ou consultas repetidas sem mudança.

**Saída:** implementação e todos os testes do escopo escritos. Não rodar testes/tipos/build após cada microedição nem enquanto outra implementação estiver em andamento.

### T3 — Validar o conjunto e corrigir em lote

Após concluir T2 e revisar o diff:

1. Rodar `npm run check:filenames` e `npm run check:lockfile`. Falha de integridade bloqueia os gates dependentes; diagnosticar sem ignorar configuração.
2. Rodar `npm run test` e `npm run test:browser` para o conjunto completo das respectivas suítes.
3. Rodar `npm run type-check:test`, `npm run lint` e `npm run build`. O build já executa a checagem principal com `vue-tsc`; não repetir `npm run type-check` sobre o mesmo conteúdo sem falha ou dúvida concreta.
4. Registrar comandos reais, saídas/exit codes e revisão de conteúdo. Agrupar falhas por causa de harness/ambiente, regressão desta mudança ou baseline; estabelecer causalidade antes de alterar outros arquivos.
5. Corrigir o lote relevante e revalidar checks invalidados. Reaproveitar checks aprovados quando o conteúdo relevante não mudou. Falha repetida sem progresso exige diagnóstico do bootstrap/harness antes de repetir a suíte.

Esses comandos constam de `package.json`; não foram executados em Plan. Não usar formatador global, atualização npm ou build fora desta worktree. `npm run type-check` permanece disponível para diagnóstico específico; `type-check:test` usa outro projeto TypeScript e não é substituído pelo build principal. Não executar compiladores por microalteração.

Se a entrega passar a exigir gate completo de pré-release, usar `npm run verify` **no lugar** da sequência isolada sobre a mesma revisão, preservando suas etapas de cobertura, navegador, consumidores, benchmark, integridade e segurança. Ler antes os scripts envolvidos e verificar isolamento/permissões; não presumir autorização para efeitos externos. Não executar `release`.

### T4 — Revisão de risco, aceite visual e entrega

1. Revisar conjuntamente correção e testes: contenção real versus corte, limites do pai/viewport, compactação, conectores, badges, foco, toque, labels e acesso à última etapa.
2. Conferir manualmente o cenário `panels-tabs` existente usando `npm run dev:playground` em ambiente autorizado; viewport pequena e desktop, labels padrão, estados e borda. As variantes de 6/12 etapas e labels longos ficam nas fixtures browser, sem necessidade de alterar playground.
3. Registrar resultado manual, limitações e evidências de geometria. Chromium automatizado não comprova Safari/iOS; se acesso a dispositivo ou inspeção manual não estiver disponível, usar `manualPending` com próxima ação e não declarar aceite integral.
4. Entregar resumo dos três arquivos de implementação, resultados, falhas e pendências; não commitar, integrar ou remover worktree. Reversão, se necessária, deve ser limitada ao patch desta tarefa e autorizada, sem reset/checkout destrutivo de trabalho alheio.

Etapas são sequenciais. Não é necessária delegação. Se outra sessão receber tarefa independente, fornecer somente este plano, spec e arquivos pertinentes, com escrita distinta; não concorrer no mesmo componente nem iniciar gates enquanto houver implementação incompleta. Revisão independente deve se concentrar no marco de geometria e na entrega, não em cada microedição.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência exigida | Testes pertinentes | Revisão pelo risco / manual |
| --- | --- | --- | --- |
| T1 / ambiente | Resolução efetiva de módulos, harness e integridade conhecidos | Gates existentes de filenames e lockfile, antes dos dependentes | Bloquear caminhos locais proibidos, rede real e bypass; sem `.env` ou operações compartilhadas. |
| T2–T3 / R1 | Caixas da raiz, wrapper e header dentro do host/viewport; página sem excesso horizontal | Browser em 320/360/375/390px; host útil de 288px na viewport 320; hosts flex e grid, com padding e borda | Tolerância 1px; não aceitar `overflow: hidden` global ou fixture mascarando mínimos. |
| T2–T3 / R2 | 4/6 etapas sem rolagem interna, marcadores e botões sem sobreposição | `header.scrollWidth <= header.clientWidth + 1`; retângulos dos marcadores contidos; combinações `showTopButtons`/`mobileShowLabel` true/false e textos longos | Conferir conectores, badges e linha ativa; labels truncam, não expandem colunas. |
| T2–T3 / R3 | 12 etapas em 320px: header rolável, página contida e última etapa alcançável | Navegar até a última etapa, aguardar scroll com limite, verificar retângulo visível e `window.scrollX` inalterado | Não remover etapas nem sobrepor marcadores; testar botões e acesso pelo teclado quando aplicável. |
| T2–T3 / R4 mobile | Mobile explícito e automático mantêm conteúdo, nomes acessíveis e seleção | Unitários de props/classes/labels; browser com 0/1/4/6/12 etapas, ícones e números, estados variados; borda e botões opcionais | Zero/uma etapa sem erro nem divisão por zero; testar entrada/saída mobile por resize na mesma montagem. |
| T2–T3 / R4 contratos | Navegação e bloqueios iguais ao contrato atual | Suíte unitária completa preservada: modelos, callbacks, avanço/retorno, `allowManual`, `nextOnlyDone`; browser confirma clique e painel ativo | Não usar a correção CSS para alterar regras funcionais ou cache. |
| T2–T3 / R4 desktop | 1024/1280px, labels e marcadores sem regressão; host desktop estreito continua contido | Medidas browser e sequência 1280 → 375 → 1280; preservar política vigente na fronteira 767/768/769 sem redefini-la | Comparar layout de desktop e forçado mobile em tela larga; divergência preexistente de override é notificação, não escopo extra. |
| T3 / qualidade | Suítes, tipos, lint e build com resultado vigente na revisão entregue | Comandos da T3; `verify` quando houver exigência de pré-release | Não concluir integralmente com check pendente/falho; investigar baseline sem expandir escopo. |
| T4 / visual | Geometria, labels, foco e interação confirmados; limitações registradas | Playground existente e fixtures browser | Revisar toque/foco nos botões com pseudoárea e bordas do header; manualPending se falta acesso. |

Em toda fixture de contenção, comparar os lados esquerdo/direito e a largura contra a caixa útil do pai, não apenas `width <= viewport`. Verificar `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`. No excesso, é esperado apenas `header.scrollWidth > header.clientWidth`; a caixa externa não cresce. Restaurar os testes após alterações temporárias de viewport. Não simular dimensões ou `getBoundingClientRect` no teste geométrico.

## 7. Riscos, notificações e limites de operação

- CSS local reduz risco de contrato, mas o header é reutilizado em contêineres de tamanhos variados; daí flex/grid e labels longos na matriz.
- O mínimo proposto de 40px e padding de 4px precisam de confirmação real com bordas, badges e controles. Se não atenderem ao alvo, ajustar apenas a distribuição local, sem reduzir círculos ou remover botões automaticamente.
- O scroll suave pode terminar depois do próximo frame; usar espera limitada por visibilidade/posição estável. Falta de navegador ou cancelamento preserva resultados parciais e pendência explícita.
- Não há migração, fornecedor/modelo, API remota, credenciais ou recuperação de dados necessária. Build e relatórios futuros permanecem locais à worktree; sem deploy ou publicação.
- Achados fora do escopo documentados em `docs/notifications/wt-2f7499a2/notifications/max-components-ui-orientacao-estilos-legada.md` e `docs/notifications/wt-2f7499a2/notifications/max-components-ui-maxsteps-overrides-mobile.md`. Não tratá-los como autorização para correções adicionais.

## 8. Retomada e registro durante Execute

Antes de agir, conferir trabalho existente, revisão factual dos arquivos e decisões deste plano. Revalidar premissas alteradas; não reabrir escolhas sem evidência nova ou novo requisito. Ao retomar, executar lacunas, não repetir automaticamente checks aprovados da mesma revisão.

Somente durante Execute, registrar progresso após marcos e handoff em `docs/plans/wt-2f7499a2/execution-state.json`. **Não criar esse arquivo em Plan.** Usar o esquema version 2 estrito do ambiente, sem inventar campos adicionais. Vincular ao SHA256 real de `plan.md`, às revisões SHA256 reais do conteúdo das tarefas e aos arquivos correspondentes. A forma integral do esquema não foi inspecionada; consultá-la no executor antes da primeira gravação, sem improvisar formato.

Regras obrigatórias do registro:

- Tarefas com estado `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- `verification` contém `revision` SHA256 e `checks` com `command`, `revision` SHA256, `result` e `exitCode` quando permitido.
- Resultado de validação/check somente `passed`, `failed` ou `pending`; nunca `blocked`.
- `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não admite exitCode. Não inferir código a partir de `tool:end.ok`.
- Comandos de até 4.096 caracteres; motivos e próxima ação em `nextAction` de até 512 caracteres. Não acrescentar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`.
- Registrar somente comandos realmente executados, incluindo todas as falhas da suíte completa. Checks vazios, ausência de resultado vigente ou falha vigente impedem validação integral.
- Version 1 permanece compatível, mas não prova validação integral. Registro autodeclarado também não comprova execução nativa nem detecta checks omitidos.
- Bloqueio/manualPending sempre inclui próxima ação concreta; cancelamento conserva resultado parcial. Nenhuma pendência pode ser apresentada como conclusão total.

## 9. Revisão deste planejamento

- Solicitação coberta por contenção externa e compactação real, não apenas recorte.
- Spec criada antes do plano, com três arquivos previstos para implementação futura.
- Contratos e decisões fora do pedido preservados; sem perguntas necessárias sobre detalhes que o código resolve.
- Propostas numéricas separadas de fatos medidos; rolagem interna para excesso explicitada.
- Validações vinculadas a requisitos e revisão de conteúdo, em lote; baseline, preflight e limitações diferenciados de resultado aprovado.
- Nenhum código, teste, configuração ou serviço alterado; somente spec, plano e notificações nos destinos autorizados.
