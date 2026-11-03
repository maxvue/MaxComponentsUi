# Plano de execução — tamanhos dos ícones por item nos menus do MaxApp

## 1. Identificação e autorização

- Data: 03/11/2026. Projeto: `@maxvue/max-components-ui` 1.1.36.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-2e1ae3c1`.
- Branch informada e observada: `wt-2e1ae3c1`. HEAD investigado: `0579d033105409d6cf279ee6d974cac1358857d9`.
- Especificação: [spec.md](./spec.md), elaborada antes deste plano.
- Estado inicial observado: `git status` limpo. Não foram encontrados documentos anteriores neste destino. Revalidar ao retomar.
- Esta sessão autoriza somente estes dois documentos. **A implementação e seus comandos de validação são futuros e dependem de autorização de Execute.** Não criar outra worktree, trocar branch, commitar, integrar, publicar ou remover esta worktree.

## 2. Solicitação, decisão confirmada e resultado esperado

O usuário quer que as barras do MaxApp respeitem o tamanho informado para seus ícones e usem o padrão quando nada for informado. Foi esclarecido onde esses valores serão passados; a resposta foi **“Por item (Recomendado)”**, incluindo os dados em `details` quando houver.

Usuários afetados: consumidores da biblioteca e pessoas que navegam no shell desktop/mobile. Resultado: cada ícone de item pode ter tamanho próprio e específico por posição, sem alterar vizinhos, controles fixos ou navegação.

### Requisitos e fronteiras

1. Reconhecer `size` e aliases específicos: lateral `size_side`/`side_size`, inferior `size_bottom`/`bottom_size`, topo `size_top`/`top_size`.
2. Aplicar à raiz e a `details`, a itens e subitens existentes, incluindo configurações, flyout, abas, toolbar e itens de adição dos popovers do shell.
3. Específico da posição vence genérico; raiz vence `details` dentro da mesma categoria; prefixo `size_` vence alias invertido na mesma origem. Ignorar outras posições.
4. Preservar todos os defaults atuais e o legado `icon_size` onde já funciona. Não herdar configuração de pai para filho.
5. Atualizações reativas devem refletir sem remontar o shell, mutar dados, salvar preferências ou invalidar cache.
6. Não mudar dimensões das barras, botões, hitboxes, textos, logos, avatares, FAB e controles decorativos/fixos. Não assumir controle de conteúdo personalizado por slots.
7. Usar componentes Max existentes, manter integração MaxPinia e helpers MaxUse. Não criar store ou camada HTTP nova nem migrar as stores atuais para outro padrão.
8. Não editar backend, consumidores externos, dependências/lockfile, temas globais, `MaxIcon`, `MaxIconButton` ou `getCssSize` para resolver este pedido.

Propostas técnicas a revisar: alias simétrico `side_size`, precedências, aceitação de valores/unidades e contextualização de popovers. Não existe comportamento anterior desses aliases a ser preservado. Não há decisão funcional pendente que impeça elaborar este plano.

## 3. Evidências e rastreamento do fluxo existente

| Arquivos inspecionados | Comportamento atual e implicação |
| --- | --- |
| `src/components/MaxApp.vue`; `MaxPageLayout.vue`; `MaxPageMobileLayout.vue` | Objetos das props atravessam layouts; não há API de tamanho global. Preservar esse fluxo sem adicionar props gerais. |
| `src/components/MaxSideMenu.vue`; `MaxMenuVerticalItem.vue` | Principal/configurações recebem os mesmos objetos. Renderizador do ícone fixa `1.5`. |
| `src/components/MaxSideMenuMobile.vue`; `MaxSideMenuFlyout.vue` | Principais/subitens têm tamanhos próprios; cabeçalho do flyout também renderiza o pai. Não confundir esses ícones com chevrons/fechar/perfil. |
| `src/components/MaxBottomMenu.vue` | Três pontos de ícone de aba: esquerda/direita com FAB e lista sem FAB. `BottomTab` é declarado no SFC. |
| `src/components/MaxTopMenu.vue`; `MaxTopToolbar.vue`; `MaxTopToolbarSubmenu.vue` | Topo fixo não corresponde a uma lista de todos os seus controles. Itens configuráveis vivem na toolbar/store e em `addItems`. Toolbar tem variante com/sem texto e submenu recursivo. |
| `src/components/MaxPopoverMenu.vue` | Ícones de itens em `1.1`; prop `size` dimensiona gatilho. `items`/`model`, slots, Teleport, ações e teclado precisam permanecer. |
| `src/components/MaxIcon.vue`; `MaxIconButton.vue`; `src/helpers/getCssSize.ts` | Conversões incompatíveis: MaxIcon transforma número em rem; botão usa fator × 16px; getCssSize trata número como px. Não usá-los como conversões equivalentes. |
| `src/helpers/menuHelpers.ts`; `src/types/app.ts`; `app.d.ts`; `src/types/index.ts`; `src/index.ts` | Helper de domínio e contratos laterais existentes. `app.d.ts`/map são rastreados. Tipos de app já são reexportados por `types/index.ts:450` e `src/index.ts:469`. |
| `src/stores/useListMenus.Store.ts`; `useTopToolbar.Store.ts`; contrato em `useUser.Store.ts` | Menus laterais usam cache MaxUse; topo usa estado da toolbar; usuário usa integração MaxPinia. Tamanhos devem apenas consumir os objetos existentes. |
| `tests/components/MaxMenuVerticalItem.test.ts`; `MaxSideMenuMobile.subitems.test.ts`; `MaxBottomMenu.test.ts`; `MaxTopToolbar.test.ts`; `MaxTopToolbarSubmenu.test.ts`; `MaxPopoverMenu.test.ts`; `MaxApp.test.ts` | Harness de Pinia isolado, rotas/listas reativas, abertura de menus, callbacks e repasse de props já existem. Alguns stubs não declaram `size`: ampliá-los localmente quando necessário. |
| `tests/setup.ts`; `tests/browser.setup.ts`; `tests/browser/maxAppAvailability.browser.ts` | DOM unitário substitui getComputedStyle; browser tem Pinia/roteador e tema reais, adaptador Axios simulado e fetch de ícones. O adaptador só isola a instância efetiva de Axios: confirmar identidade antes de confiar no isolamento. |
| `package.json:856–883`; configs Vite/Vitest/TypeScript; `scripts/check-lockfile.mjs`; `scripts/verify-consumers.mjs` | Scripts e efeitos foram lidos, não executados. `test` recompila; `verify` agrega build, runtime, coverage, browser, consumidores e segurança. Consumidores temporários fazem instalações e limpeza. |
| `package-lock.json`; `.gitignore`; `README.md:114–127`; `playground/src/scenarios/nav-side.vue` | Lock declara Vue 3.6.0-rc.10/MaxUse 1.1.47; worktrees ignoradas. README tem entrada de app shell; playground tem exemplos laterais, mas não prova todos os fluxos. |

Consulta externa: documentação oficial Vue 3, [atributos herdados](https://vuejs.org/guide/components/attrs) e [useAttrs](https://vuejs.org/api/composition-api-helpers#useattrs), via Context7. `useAttrs` não é fonte adequada para novas decisões reativas. A solução usa dados reativos já existentes, sem depender de atributos implícitos. A consulta não cobre especificamente a RC instalada.

Limitações: nenhuma suíte, build, lint, instalação, servidor ou navegador foi executado. Não foram validados symlinks/dependências instaladas, baseline, credenciais ou aplicações consumidoras externas. O código atual confirma viabilidade dos pontos de integração, não comprova sozinho o comportamento desejado.

## 4. Solução e contratos estabilizados para a execução

### 4.1. Resolução única

Em `src/types/app.ts`, definir `MenuIconSizeFields` e `MenuIconPosition` conforme a spec. Estender os tipos laterais, `BottomTab` e `MaxTopToolbarSubmenuItem`, preservando nomes, obrigatoriedade, callbacks, index signatures e recursão atuais. Novas propriedades são opcionais `string | number | null`; `details` continua opcional nos tipos que ainda não o exigem.

Em `src/helpers/menuHelpers.ts`, adicionar `getMenuItemIconSize(item, position, fallback): string | number`. Aceitar item estrutural tipado ou entrada desconhecida com estreitamento seguro, sem espalhar `any` novo. Não substituir getters atuais de ícone/label/rota nem mudar suas precedências.

Ordem exata de candidatos, avaliada da esquerda para a direita:

| Posição | Candidatos |
| --- | --- |
| `side` | `size_side`, `side_size`, `details.size_side`, `details.side_size`, `size`, `details.size`, fallback |
| `bottom` | `size_bottom`, `bottom_size`, `details.size_bottom`, `details.bottom_size`, `size`, `details.size`, fallback |
| `top` | `size_top`, `top_size`, `details.size_top`, `details.top_size`, `size`, `details.size`, fallback |

Normalizar somente candidatos novos: número finito ≥ 0; string decimal ≥ 0; comprimento simples ≥ 0 com `px`, `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`. Trim externo; número sem unidade significa rem. Zero é válido. Descartar tipos inesperados, vazio, negativos, NaN/infinito, percentuais, unidades fora da lista e expressões CSS não suportadas por MaxIcon. Percentuais ficam fora porque o ícone aplica dimensões em dois elementos aninhados, tornando a referência ambígua. Pular inválido para tentar o próximo; nunca usar `||` para escolher tamanho. O fallback legado fornecido pelo chamador permanece como hoje, sem “corrigir” contratos antigos nesta tarefa.

Os aliases de outra posição são ignorados. Sem campo válido, manter precisamente os fallbacks abaixo:

| Renderizador | Fallback preservado |
| --- | --- |
| Menu vertical desktop | `'1.5'` |
| Navegação mobile / subitem mobile | `'1.2'` / `'1.0'` |
| Flyout cabeçalho / pai na lista e filhos | `'1.5'` / `'1.4'` |
| Aba inferior, três ramos | `'1.3'` |
| Toolbar/submenu com texto | `item.icon_size ?? '1.2'`, sem mudar semântica legada |
| Toolbar/submenu sem texto | Botão existente `size="1.5"`; sem nova regra CSS ativa |
| Itens dos popovers do shell | `'1.1'` |

### 4.2. Aplicação no topo sem regressão global

Itens com texto continuam usando MaxIcon; substituir apenas a seleção de tamanho. Para itens somente ícone, conservar MaxIconButton e sua prop `size="1.5"`. Se houver um novo tamanho válido no item, ativar classe local e variável dinâmica `--max-menu-item-icon-size`, formatando números sem unidade como rem. Nas duas toolbars, usar seletores scoped/deep restritos a essa classe para aplicar largura/altura aos elementos `.max-icon-div` e `.max-icon` internos. A precedência deve superar os estilos inline do ícone somente nessa instância; se necessário, `!important` fica restrito a essas dimensões locais.

Isso mantém área clicável, hover, eventos e loading, inclusive o ícone de carregamento. Quando o campo é removido/inválido, remover a classe/variável e restaurar o comportamento anterior. Não adicionar slot que elimine o spinner, não reimplementar o botão com HTML cru e não modificar a API genérica para strings CSS. Comprovar largura/altura do ícone e invariância do botão no navegador.

### 4.3. Popovers e transmissão dos dados

Adicionar a prop opcional `itemIconPosition?: MenuIconPosition` em MaxPopoverMenu. Com ela, o renderizador padrão do **item** usa o helper; sem ela, preserva `size="1.1"`. Slot `item` permanece substituição integral, sem alteração de contrato. A prop `size` do gatilho não é reinterpretada.

Passar `item-icon-position="top"` no popover de `MaxTopMenu` e `item-icon-position="bottom"` no popover de `MaxBottomMenu`. O mesmo `addItems` pode assim produzir tamanhos diferentes nas duas posições. O ícone fixo do gatilho/FAB não lê campos dos itens.

Manter props de objetos intactas através do MaxApp/layouts e listas das stores. Não incluir filtros/mapeamentos novos que descartem os campos. Mudanças nesses componentes de transmissão só se uma falha de integração demonstrar necessidade causal; não há alteração prevista neles.

### 4.4. Alternativas descartadas

- Configuração global por props: contraria a escolha confirmada por item.
- Defaults únicos para todos os menus: alteraria interfaces sem configuração.
- Leitura em attrs, CSS global ou store de tamanho: acrescenta acoplamento, vazamento ou persistência desnecessária.
- Encaminhar unidade CSS diretamente para `MaxIconButton.size`/getCssSize: conversão atual é incompatível.
- Modificar MaxIconButton globalmente: afetaria consumidores fora deste pedido; adaptação local é suficiente.
- Aplicar tamanho a todos os descendentes: atingiria avatar, chevrons, FAB, slots e controles fixos.

## 5. Etapas executáveis e dependências

### T1 — Admissão e preflight por leitura

1. Ler este plano e a spec na primeira admissão; conferir AGENTS e estado local antes de editar. Não inspecionar outras worktrees.
2. Conferir branch/caminho, alterações já existentes, tarefas implementadas e mudanças desde o HEAD investigado. Preservar trabalho alheio.
3. Ler scripts, prehooks efetivos, configs e integridade de biblioteca; conferir caminhos reais/symlinks e versões efetivas de Vue, Pinia, Axios e MaxUse no harness. O lock não comprova o instalado.
4. Confirmar uma única identidade de Pinia/Vue e se o adaptador/dublê de Axios intercepta a instância usada pelo MaxUse. Isolar storage/IndexedDB/localStorage e restaurar estado por teste; bloquear rede de backend/ícones externos no harness novo. Banco e filas não participam deste escopo.
5. Conferir navegador disponível sem instalar automaticamente. Nunca copiar .env, executar migrações/resets ou usar serviços compartilhados para validar ícones.
6. Confirmar como tratar `src/types/app.d.ts`: tipos distribuídos vêm de `dist`, porém a declaração rastreada não deve divergir do contrato-fonte. Atualizar somente a declaração pertinente conforme convenção confirmada; não editar `.d.ts.map` por aproximação nem emitir artefatos espalhados em `src`.

Saída: precondições verificadas ou tarefa `blocked` com próxima ação concreta. Falha em gate de integridade bloqueia execução dependente; sem bypass, `ignoreConfig` ou retirada de prehook. Não iniciar instalações/correções de ambiente fora de autorização.

### T2 — Contratos, resolução e testes de tabela

Dependência: T1. Arquivos: `src/types/app.ts`, declaração pertinente se necessária, `src/helpers/menuHelpers.ts`; novo `tests/helpers/menuIconSize.test.ts`.

1. Implementar os dois tipos e o helper puro conforme seção 4.
2. Testar tabela completa: sete campos, três posições, raiz/details, conflitos entre aliases/origens, específico em details contra genérico na raiz e campo de outra posição.
3. Cobrir número/string numérica/unidades previstas/zero, inválidos de cada classe, null/undefined, item ausente e fallback próprio por contexto.
4. Testar que a resolução não muta objetos e que subitem sem tamanho não herda o do pai.

Saída: contratos estáveis e testes escritos; revisão por leitura antes de integrações dependentes, sem executar validações entre microedições.

### T3 — Laterais e abas inferiores

Dependência: T2. Alterar `MaxMenuVerticalItem.vue`, `MaxSideMenuMobile.vue`, `MaxSideMenuFlyout.vue` e `MaxBottomMenu.vue`; estender `BottomTab` neste último.

1. Aplicar posição `side` somente aos ícones de itens nos três renderizadores laterais. No flyout resolver pai para cabeçalho/Visão Geral com fallbacks distintos; filho usa seus próprios campos.
2. Aplicar posição `bottom` às três ocorrências de ícones das abas. Não aplicar aos dois ícones fixos do FAB.
3. Acrescentar regressões em `tests/components/MaxMenuVerticalItem.test.ts`, `MaxSideMenuMobile.subitems.test.ts`, `MaxSideMenuFlyout.test.ts` e `MaxBottomMenu.test.ts`. Cobrir dois itens com tamanhos distintos, padrão, alterações reativas e remoção do campo.
4. Preservar filtros de visibilidade, seleção de fontes, disponibilidade, matches/active, configurações, clique/Enter, accordion, fechamento e navegação atuais.

Saída: todos os caminhos laterais/inferiores contemplados e testes escritos; nenhuma mudança de layout ou store.

### T4 — Topo, recursão e popovers contextualizados

Dependências: T2; coordenar com T3 porque esta tarefa também altera `MaxBottomMenu.vue`. Alterar `MaxTopToolbar.vue`, `MaxTopToolbarSubmenu.vue`, `MaxPopoverMenu.vue`, `MaxTopMenu.vue` e o popover em `MaxBottomMenu.vue`.

1. Estender `MaxTopToolbarSubmenuItem`; integrar `top` nas variantes com/sem texto conforme 4.2, preservando icon_size e dimensões de controles sem novos campos.
2. Cobrir níveis recursivos sem herança implícita. Não aplicar tamanho do item ao chevron do submenu.
3. Implementar `itemIconPosition` e seus dois chamadores conforme 4.3; manter consumidores genéricos sem essa prop idênticos.
4. Ampliar `tests/components/MaxTopToolbar.test.ts`, `MaxTopToolbarSubmenu.test.ts`, `MaxPopoverMenu.test.ts` e `MaxBottomMenu.test.ts`; neste último, testar também os itens do popover inferior. Ajustar stubs somente localmente para expor size e dimensões pertinentes.
5. Cobrir `items`/`model`, popover aberto, slot `item`, gatilho inalterado, callbacks, spinner, navegação por teclado e remoção reativa da configuração.

Saída: revisão de compatibilidade antes da validação final, com nenhum diff em MaxIconButton/MaxIcon e nenhum efeito fora de contexto em popovers.

### T5 — Integração, browser e documentação

Dependências: T3 e T4. Arquivos: `tests/components/MaxApp.test.ts`; novo `tests/browser/menuIconSizes.browser.ts`; `README.md`.

1. No harness de MaxApp existente, provar passagem sem perdas de campos em `sideMenuItems`, grupos, `bottomTabs` e `addItems`, tanto na montagem quanto na troca reativa. Cobrir menus provenientes da store existente sem GET real novo.
2. Criar teste browser específico usando como referência o harness de `maxAppAvailability.browser.ts`, sem alterar seus testes de disponibilidade. Usar MaxApp/menus reais, Pinia isolado, roteador em memória, tema e SVGs locais; não depender de fornecedor externo.
3. Medir dimensões de `.max-icon-div`/SVG com fonte raiz controlada e restaurada. Cobrir lateral/flyout desktop, gaveta/subitem mobile, abas com/sem FAB e topo com/sem texto/submenu. No topo medir também ícone durante loading e dimensão inalterada do botão.
4. Cobrir números/string/unidade, prefixo/alias, fallback e atualização reativa. Medir igualdade com tolerância de até 1 CSS px; obter a conversão de rem da fonte raiz real, não assumir sempre 16px. Percentuais e expressões CSS fora do contrato devem cair no próximo candidato válido ou no fallback.
5. Testar dois itens vizinhos, controles fixos/slots e gatilho do popover inalterados, desktop 1280×800 e mobile 390×844. Tema escuro: ao menos uma regressão visual/geométrica sem alteração de cores. Limpar overlays, apps, estilos e storage ao terminar.
6. Acrescentar subseção junto ao app shell em README: campos por item, exemplos raiz/details, precedências, unidades, defaults locais, zero, legado icon_size e limite de slots. Não aproveitar para corrigir documentação histórica alheia ao pedido.

Saída: **todo o escopo e seus testes escritos antes dos comandos de validação**. Se navegador/manual não puder concluir, registrar `manualPending` com próxima ação, sem declarar aceite geométrico completo.

### T6 — Validação do lote, revisão e entrega

Dependência: T5. Nenhuma implementação concorrente enquanto os gates avaliam a revisão factual do lote.

1. Revisar diff por escopo e contratos: sem alterações globais/dependências, defaults preservados, sem remoção de classes legadas, tags de abertura editadas em linha única, Composition API e tipagem estrita.
2. Executar o lote de qualidade da seção 6. Agrupar diagnóstico e correções, executar novamente somente após concluir o conjunto das correções. Não repetir uma falha equivalente sem nova evidência/progresso.
3. Registrar todas as execuções reais, falhas e pendências no estado de execução. Gate que não iniciou não é aprovado.
4. Revisar independentemente nos marcos de risco do topo/popovers e na entrega; delegação só se autorizada. Submeter o diff bruto final à verificação de requisitos.
5. Entregar arquivos afetados, critérios atendidos, comandos/resultados e pendências. Preservar worktree para integração pelo MaxCode; sem commit, merge, push, release ou limpeza.

## 6. Matriz de aceite e comandos futuros

| Tarefa/requisito | Evidência exigida | Testes pertinentes | Revisão por risco / manual |
| --- | --- | --- | --- |
| T1: ambiente e isolamento | Resolução efetiva de libs, scripts e instâncias; nenhuma rede externa no harness novo | Gate de integridade identificado antes do runtime dependente | Interromper se libs divergirem ou serviço não estiver isolado |
| T2: aliases/precedência/valores | Tabela exaustiva, zero preservado e ausência de mutação | Novo `tests/helpers/menuIconSize.test.ts` | Conferir divergências raiz/details e fallback legado |
| T3: laterais | Dimensão correta de item/pai/filho e vizinho preservado | MenuVerticalItem, SideMenuMobile.subitems, SideMenuFlyout; browser novo | Abrir/fechar submenu e navegar por teclado |
| T3: inferior | Mesma regra nos três ramos; FAB intacto | MaxBottomMenu; browser novo | Verificar rótulos, active/matches e áreas clicáveis |
| T4: superior | Com/sem texto, recursão, legado icon_size e loading preservados | MaxTopToolbar, MaxTopToolbarSubmenu; browser novo | Risco maior pelas conversões: dimensões reais do ícone e botão |
| T4: popovers | Campos por posição só no contexto do shell; gatilho/slots intactos | MaxPopoverMenu, MaxBottomMenu, MaxApp | Conferir ação única, foco e overlay |
| T5: shell/reatividade | Props/store chegam intactas; atualização e remoção sem remount | MaxApp e browser novo | Desktop/mobile, claro/escuro; sem rede/persistência nova |
| T5: documentação | Exemplos coerentes com tipos e precedência implementados | Revisão cruzada README/spec/código | Não prometer configuração geral ou tamanho de slots |
| T6: entrega | Checks vigentes aprovados e diff restrito | Gates abaixo | Sem conclusão integral com falha vigente ou manual pendente |

Comandos identificados no `package.json`, para **Execute**, após preflight e lote completo:

```bash
npm run check:lockfile
npm run type-check
npm run type-check:test
npm run lint
npm run build
npm run test:coverage
npm run test:browser
```

`test:coverage` executa a suíte unitária completa e sua cobertura; não repetir `npm run test`/`test:built` sobre o mesmo conteúdo sem motivo. `build` já inclui vue-tsc: a checagem sem emissão pode ser absorvida por ele se o executor registrar a equivalência e o resultado vigente, evitando duplicação. Manter `type-check:test`, pois é outro contrato. Gate de lockfile falhado bloqueia comandos dependentes, sem execução direta para contorná-lo.

Este lote valida a alteração, **não equivale a liberação pré-release**. Se houver solicitação posterior de release, executar `npm run verify` como gate completo, sem repetir isoladamente seus componentes na mesma revisão. Ele agrega consumidores temporários com instalação/rede/limpeza, bundle, benchmarks e auditoria: revisar isolamento e obter a autorização operacional pertinente antes. Não executar release nem instalações nesta sessão Plan ou por mera aprovação deste texto.

Nenhum comando acima foi executado nesta investigação. Suite DOM com props/stubs não substitui browser. Mudança do tamanho não depende de aceite em API externa ou credencial; se surgir essa dependência, diagnosticar a origem em vez de introduzir integração real.

## 7. Riscos, recuperação e pontos de interrupção

- **Topo — risco elevado:** números/unidades têm semânticas distintas no botão e ícone. Limitar adaptação ao ícone por item e provar invariância do controle/loading; não “resolver” mudando biblioteca genérica.
- **Laterais/popovers — risco moderado:** formatos raiz/details e componente reutilizado. Helper único, testes de conflitos, contextualização explícita e teste negativo sem contexto evitam propagação indevida.
- **Inferior:** três ramos duplicados podem divergir. Aplicar helper nos três e testar com/sem FAB; o FAB não recebe tamanho de aba nem do primeiro addItem.
- **Geometria:** gaveta tem coluna de 24px, lateral 55px, itens e botões têm alturas existentes. Honrar tamanhos não implica que valores arbitrariamente grandes caibam. Não limitar silenciosamente valores válidos nem redesenhar barras; sobreposição para tamanhos extremos é limite documentado. Regressões usam valores compatíveis com o espaço atual.
- **Estado/cache:** resolver durante render/computed a partir do item atual, sem snapshot não reativo. Não persistir tamanho nem alterar cache de ícones; cada filho resolve seu próprio objeto.
- **Declarações rastreadas:** sincronizar somente contrato pertinente; sem geração colateral/mapas inventados. Se exigir workflow não identificado, parar e registrar próxima ação antes de ampliar escopo.
- **Baseline/infra:** falha persistente de suíte, integridade ou navegador exige diagnóstico agrupado. Não reduzir asserções, desativar política de console/cobertura ou corrigir baseline sem causalidade e autorização.
- **Segurança/operacional:** sem segredos, .env, migrações ou dados compartilhados. Worktree não prova isolamento de rede/storage. Comandos potencialmente destrutivos exigem autorização específica e guardrail prévio.
- **Recuperação:** mudança é aditiva de apresentação, sem migração. Remover os campos dos itens restaura os defaults; remoção futura da implementação exige reversão seletiva apenas dos próprios hunks, sem reset/checkout de trabalho alheio. Publicação não faz parte deste plano.

## 8. Retomada, coordenação e registro de execução

Ler plano/spec integralmente na primeira admissão; nas retomadas consultar apenas tarefas/contratos pertinentes. Conferir trabalho realizado, estado Git e revisões dos arquivos; executar lacunas, não refazer etapas aprovadas sem mudança relevante. Não reabrir decisões confirmadas sem requisito novo ou evidência concreta.

Dependências: T1 → T2 → T3/T4 → T5 → T6. Por padrão, execução sequencial por uma sessão. Se delegação futura for autorizada, estabilizar T2 antes; T3 e T4 compartilham `MaxBottomMenu.vue` e seu teste, portanto **não podem editá-los simultaneamente**. Designar um único responsável por ambos ou executar esses trechos sequencialmente. Repassar task ID, referências de seção, contratos, revisões reais e critérios de aceite, não toda a conversa. Revisões independentes nos marcos de risco, não a cada edição.

Durante Execute, após marcos e handoffs, manter `docs/plans/wt-2e1ae3c1/execution-state.json`. **Não criar esse arquivo em Plan.** Contrato estrito para registros novos:

- Raiz: somente `{version: 2, planRevision, tasks, verification, updatedAt?, nextAction?}`. `planRevision` é SHA256 real dos bytes de `plan.md`; `updatedAt`, quando usado, é inteiro positivo em milissegundos.
- `tasks`: array de objetos somente `{id, status, files, validations, revision?, nextAction?}`. Usar IDs T1–T6, paths relativos em `files` e a chave obrigatória `validations: []`; registrar os comandos reais no formato de checks abaixo, sem inventar estrutura adicional em validations.
- Status da tarefa: somente `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. `revision`, se presente, é SHA256 real do conteúdo factual da tarefa, não branch/HEAD/rótulo.
- `verification`: somente `{revision, checks}`. `revision` é SHA256 real do conteúdo da revisão avaliada; `checks` contém somente `{command, revision, result, exitCode?}`. Esse objeto check existe apenas em `verification.checks`.
- Resultados de validação/check: somente `passed`, `failed`, `pending`; nunca `blocked`. Passed exige `exitCode: 0`; failed exige inteiro não zero; pending não permite exitCode. Não escrever `exitCode: null`.
- `command`: até 4.096 caracteres. `nextAction`: até 512 caracteres; colocar ali motivo e próxima ação concreta de impedimento ou pendência.
- Proibidos campos adicionais, inclusive `schemaVersion`, `worktree`, `branch`, `head`, `planPath`, `status`/`checks` soltos na raiz, `title`/`evidence` na tarefa e `blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp` em qualquer nível.

Calcular revisões sobre conteúdo real, com lista de arquivos e ordem determinísticas; não usar o próprio registro como entrada circular do hash. Associar cada check à revisão factual que verificou. Registrar todos os comandos de validação realmente executados, inclusive falhas da suíte completa; não inferir exit code ou aprovação de `tool:end.ok`. Mudanças relevantes invalidam apenas evidências afetadas; conservar o histórico de falhas sem apresentá-las como resultado vigente aprovado.

Checks vazios, ausência de resultado vigente, manual pendente ou falha vigente impedem alegar validação integral. Version 1 é compatível em retomada, mas não comprova validação integral automaticamente. O registro é autodeclarado: não prova execução nativa nem detecta verificações omitidas. Tarefas assíncronas aguardam conclusão/mudança com limite e recuo, sem polling repetido sem novidade; cancelamento preserva parciais e próxima ação. Não declarar conclusão total antes de resolver gates previstos e pendências.

## 9. Revisão deste planejamento

- Pedido e decisão por item refletidos; props globais e controles fixos excluídos.
- Pontos de renderização e contratos críticos identificados, incluindo recursão, três ramos inferiores, details, legado icon_size e incompatibilidade de unidades.
- Fallbacks e precedências explícitos, casos extremos e preservação de comportamento vinculados à matriz de aceite.
- Sem implementação, mudanças de dependências ou validações intermediárias nesta sessão. Escrita limitada a spec/plan autorizados.
- Preflight, isolamento, limites operacionais, execução em lote, revisão por risco, registro e retomada definidos. Pendências de ambiente são futuras, sem alegação de baseline aprovado.
