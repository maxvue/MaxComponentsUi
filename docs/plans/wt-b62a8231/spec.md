# Especificação técnica — disponibilidade de recursos no MaxApp

## 1. Contexto & Objetivo

- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.2`.
- Data: 15/10/2026.
- Worktree: `wt-b62a8231`, branch `wt-b62a8231`.
- Raiz: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-b62a8231`.
- Revisão investigada: `c65fa863ce5bf035816b85e81a5345f248879c14`; árvore inicialmente sem alterações.
- Situação deste documento: proposta para revisão; nenhuma implementação ou validação de runtime foi executada nesta sessão.

O usuário solicitou que itens de menu com `is_disponible === false` continuem aparecendo normalmente, mas apresentem, na área da página, a mensagem **“Recurso em desenvolvimento. Este recurso estará disponível em breve”**, centralizada, em vez do conteúdo real.

Hoje, `src/components/MaxApp.vue` renderiza um `RouterView` incondicional dentro do layout autenticado padrão. Os menus vêm de props ou de `useListMenusStore().list.side`. Não há referência a `is_disponible` em `src`.

O valor entregue é um estado informativo integrado ao shell existente, comum a desktop e mobile, sem ocultar navegação nem montar a página enquanto a indisponibilidade for conhecida.

## 2. Escopo

### Incluído

1. Reconhecer disponibilidade do item correspondente à rota atual, usando as fontes de navegação já aceitas por `MaxApp`.
2. Tipar `is_disponible?: boolean | null` nos contratos de itens, detalhes e subitens; aceitar também o campo nas abas inferiores customizadas.
3. Substituir somente o `RouterView` do layout autenticado padrão por um estado centralizado, reutilizando `MaxEmptyDiv`.
4. Reagir a mudanças de rota, props e dados/cache da store, sem estado duplicado.
5. Cobrir contrato, integração, visibilidade dos menus e geometria em navegador real.

### Fora do escopo

- Backend, endpoints novos, migrações e alteração de payloads no servidor.
- Guardas de navegação, redirecionamentos, bloqueio da URL ou alteração dos cliques dos menus.
- Proibir carregamento de módulos de rota ou efeitos executados por guardas do aplicativo consumidor.
- Alterar rotas de site, blank, guest/login, erro de bootstrap ou a precedência desses estados.
- Interceptar layouts inteiramente substituídos pelo slot `authenticated`; esse slot mantém seu contrato de substituição completa.
- Tratar ações sem destino de rota, inventar rotas para menus ou impedir acesso a APIs.
- Migrar stores, mudar o cache atual ou tornar o peer opcional MaxPinia obrigatório para toda a biblioteca.
- Refatorar menus, corrigir diferenças históricas de `hide`, extrair tipos de SFCs ou corrigir a documentação legada notificada separadamente.
- Publicação npm, instalação/atualização de dependências, commit, merge, push, troca/remoção de worktree.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Evidências confirmadas

| Local existente | Evidência relevante |
| --- | --- |
| `src/components/MaxApp.vue:4–48, 241–264` | Há ramos separados para páginas públicas, login, shell autenticado e bootstrap; o ponto de troca é o `RouterView` da linha 43. |
| `src/components/MaxApp.vue:93–94, 219–233` | Slots do topo são repassados separadamente; `useMaxPiniaSaveTracker()` já está integrado. |
| `src/components/MaxSideMenu.vue:137–146` | Desktop prioriza `items` não vazio, depois `groups`, depois `menus.list.side`; filtra `details.hide` e `item.hide`. |
| `src/components/MaxSideMenuMobile.vue:204–220` | Mobile prioriza `groups`, depois `items`, depois a store; no fallback da store filtra `details.hide`. |
| `src/stores/useListMenus.Store.ts:21–24` | A store expõe a ref cacheada `list`, obtida por `useRefCachedApi` de MaxUse. |
| `src/stores/useUser.Store.ts:9–19, 25–45` | O plugin MaxPinia da aplicação hospedeira gerencia carregamento/cache e o status usado pelo shell. |
| `src/types/app.ts:99–152` | Há formatos planos de subitem e formato `details` para item lateral; todos têm extensibilidade estrutural, mas não disponibilidade explícita. |
| `src/helpers/menuHelpers.ts:10–23, 51–69` | Já existem extração de subitens, aliases de destino e busca de itens ativos. |
| `src/helpers/menuRouteMatches.ts:7–26` | Correspondências nominais e `matches` usam `snakeCase` de MaxUse. |
| `src/components/MaxBottomMenu.vue:111–124, 190–200` | Aba usa `name` como nome da rota; `matches` é suportado; clique navega normalmente. |
| `src/components/MaxEmptyDiv.vue:8–18, 51–85` | Há slot padrão, modo transparente e centralização por grid; permite reutilizar o componente sem ícone/HTML dinâmico. |
| `src/components/MaxPageContent.vue:95–109` | `.pane1` define a área útil desktop, com altura e padding próprios. |
| `src/components/MaxPageMobileLayout.vue:138–184` | A área útil mobile fica entre as barras e tem padding no corpo; não equivale a `100vh`. |
| `tests/components/MaxApp.test.ts:7–61, 72–263` | Há rota e ref de menus reativas, Pinia por teste e regressões dos ramos/slots. |
| `tests/setup.ts:41–74` | `getComputedStyle` é substituído no teste unitário; ele não prova centralização visual. |
| `tests/browser/fontSizePreference.browser.ts:1–62` | Há padrão de montagem com Vue, Pinia, router em memória, temas e viewport real. |

### 3.2. Regras propostas de resolução

Estas regras completam detalhes técnicos não especificados no pedido. Não descrevem uma funcionalidade já existente.

1. **Fonte lateral efetiva:** em `MaxApp`, usar a mesma escolha de fonte e os mesmos filtros de visibilidade do menu do dispositivo atual. Resolver dispositivo por `props.screen ?? system.type_device`. Não combinar props substitutas com a store, pois isso permitiria que dados de menus não exibidos interferissem na página.
2. **Abas inferiores:** no mobile, complementar a fonte lateral com `props.bottomTabs`, quando informada. Adaptar internamente `name` para destino `route`, preservando `matches` e o novo campo. Não importar o tipo do SFC no helper; não mudar as abas padrão, que não declaram indisponibilidade. No desktop, abas que não são exibidas não influenciam a resolução.
3. **Campo:** ler `item.is_disponible ?? item.details?.is_disponible`. O campo da raiz, quando não nulo, prevalece; `details` é fallback compatível com o formato existente. Somente o resultado booleano `false` bloqueia a renderização. `true`, ausência, `null` sem fallback, `0` ou string `"false"` não equivalem a `false`.
4. **Identidade:** considerar destino de `getMenuItemRoute`, `page_component` da raiz e de `details`. Nomes são normalizados com `snakeCase` de MaxUse, como o helper existente. Destinos iniciados por `/` só correspondem ao `route.path` exato; não aplicar `snakeCase` em URLs. Não usar igualdade de rótulos, prefixos de caminho ou mapas de negócio novos.
5. **Aliases:** após considerar destinos diretos, aceitar `matches` já declarado, reutilizando `isMenuRouteActive`. Não transplantar o mapa de rotas de negócio privado de `MaxMenuVerticalItem` para esta funcionalidade.
6. **Subitens:** percorrer as listas reconhecidas por `getSubItems`, sem modificar arrays ou objetos. Entre candidatos, destino direto tem prioridade sobre alias; dentro da mesma classe, o item mais profundo vence. Empates usam a primeira ocorrência na ordem de exibição, com fonte lateral antes das abas. Usar proteção por identidade de objeto para não recursar indefinidamente em props cíclicas.
7. **Sem herança implícita:** a disponibilidade pertence ao item selecionado pela regra anterior. Um pai indisponível não torna automaticamente indisponíveis filhos com destino próprio; um pai sem destino nem `matches` não bloqueia páginas por proximidade visual.
8. **Sem correspondência/dados:** manter a página atual. A chegada ou atualização dos dados recalcula o resultado e desmonta/monta a página conforme necessário. Não inventar carregamento bloqueante, timeout, persistência ou permissões.

### 3.3. Contratos e arquivos

| Arquivo | Natureza | Mudança planejada |
| --- | --- | --- |
| `src/types/app.ts` | Existente | Acrescentar `is_disponible?: boolean | null` a `SideMenuItem`, `SideMenuDetails` e `SideMenuSubItem`, com documentação da comparação estrita. |
| `src/components/MaxBottomMenu.vue` | Existente | Acrescentar o campo opcional documentado em `BottomTab`, sem alterar navegação/template. |
| `src/helpers/menuAvailability.ts` | Novo proposto | Resolver puro `isCurrentMenuUnavailable`, com itens existentes e descrição mínima de rota `{ name?: string | symbol | null; path?: string }`; nenhum I/O, store, cache ou export público novo. |
| `src/components/MaxApp.vue` | Existente | Consumir `useListMenusStore`, calcular fonte e indisponibilidade; alternar conteúdo com `v-if`/`v-else`; importar `MaxEmptyDiv`; acrescentar somente estilos do novo estado e documentação pertinente. |
| `tests/helpers/menuAvailability.test.ts` | Novo proposto | Testar resolução, formatos, precedências, estriteza e entradas degeneradas. |
| `tests/components/MaxApp.test.ts` | Existente | Testar substituição, reatividade, fontes, permanência dos menus e preservação de contratos. |
| `tests/browser/maxAppAvailability.browser.ts` | Novo proposto | Testar navegação real em memória, não montagem da página e centralização em desktop/mobile, com temas. |

Helpers novos de domínio pertencem à biblioteca, não representam falta de utilitário genérico no MaxUse. Reutilizar `snakeCase`, `getSubItems`, `getMenuItemRoute` e `isMenuRouteActive`; não importar lodash/VueUse diretamente. Não modificar o comportamento dos helpers existentes só para atender este fluxo.

### 3.4. Renderização e apresentação

```text
rota + props + menus.list (cache reativo existente)
  → escolha da fonte efetivamente exibida
  → resolver puro de correspondência/disponibilidade
  → ramo autenticado padrão / MaxPageLayout preservado
      ├─ indisponível: MaxEmptyDiv transparente + texto centralizado
      └─ demais casos: RouterView atual
```

- O aviso fica dentro do slot padrão de `MaxPageLayout`, não em overlay, toast ou substituição do shell.
- Conteúdo textual exato: `Recurso em desenvolvimento. Este recurso estará disponível em breve`.
- Usar o slot padrão de `MaxEmptyDiv` com texto estático, evitando ícone remoto, HTML dinâmico ou componente novo. Usar classe `.max-app-unavailable`, texto alinhado ao centro e sem alturas de viewport na mensagem.
- Usar `role="status"` e anúncio educado (`aria-live="polite"`), sem capturar foco ou alterar a navegação por teclado.
- A altura deve corresponder à área útil, com `box-sizing` e padding considerados. Se o corpo mobile não oferecer altura resolvida, acrescentar uma classe condicional ao `MaxPageLayout` e ajuste scoped/deep em `MaxApp`, limitado à `.mobile-page-body` deste estado. Não alterar CSS global nem estilos das páginas disponíveis.
- Preservar menu lateral, flyout, topo, menu inferior, slots repassados, extras e singletons. Não aplicar `disabled`, remover item ou acrescentar filtro por disponibilidade.
- Aplicar `v-if`/`v-else`, nunca apenas `v-show`: a página não deve permanecer montada atrás do aviso. A navegação pode resolver normalmente a rota e atualizar a URL.

### 3.5. Limitações e compatibilidade

- As regras são de apresentação, não de segurança. Cache ausente/desatualizado pode permitir montagem prévia; quando chegar `false`, a página será desmontada. A API continua exigindo autorização própria.
- Um consumidor com slot `authenticated` próprio controla integralmente seu layout e não recebe interceptação automática.
- Backend e aplicações consumidoras não foram acessados. Não se confirmou onde um payload real coloca o campo; a proposta suporta raiz e `details` sem exigir alteração do servidor.
- `package-lock.json` registra MaxUse `1.1.47`, Vue `3.6.0-rc.10` e Vue Router `5.3.1`. MaxPinia é peer opcional `^0.2.0` no manifest, sem entrada instalada no lockfile pesquisado; não há comprovação de plugin efetivo ou dependências locais nesta sessão.
- A documentação oficial Vue 3 consultada confirma que `v-if` impede montagem inicial e destrói/recria filhos. A consulta não é uma validação específica da pré-versão travada: <https://vuejs.org/guide/essentials/conditional> e <https://vuejs.org/guide/components/slots.html>.

## 4. Plano de Execução Faseado

1. **Preflight por leitura:** reler instruções, conferir branch/raiz/diff, contratos e scripts; verificar resolução real das dependências e isolamento do harness, sem instalações ou bypass de integridade.
2. **Contrato e resolução:** acrescentar campos opcionais e implementar helper puro, documentando todas as precedências acima.
3. **Integração visual:** calcular estado derivado em `MaxApp`, preservar layout/slots e inserir aviso com dimensões restritas à área útil.
4. **Cobertura completa do lote:** implementar testes de helper, integração e navegador antes de rodar os gates. Não validar entre microalterações.
5. **Validação e revisão:** executar os comandos confirmados em `plan.md`, corrigir falhas em lote e revalidar apenas resultados afetados; revisar diff e registrar evidências reais. Não concluir com gate visual pendente.

## 5. Critérios de Aceite & Validação

1. Para item correspondente com valor efetivo `false`, o texto exato aparece na área da página e o componente da rota não é montado.
2. Menus e suas interações permanecem acessíveis/visíveis, inclusive quando o recurso está em desenvolvimento.
3. Itens sem `false` explícito e rotas não correspondentes continuam renderizando a página normalmente.
4. Troca de rota, dados da store e props atualiza a exibição; false → true volta a montar a página, true → false a desmonta.
5. Fontes desktop/mobile, raiz/details, subitens, aliases e abas seguem regras documentadas, com testes de conflito.
6. Site, blank, guest/login, bootstrap, slot `authenticated`, slots do topo, extras e eventos existentes não regridem.
7. Em Chromium, o centro do bloco textual fica a até 8 CSS px do centro da caixa útil da página, horizontal e verticalmente, descontado o padding do contêiner e sem sobrepor barras/flyout. Verificar viewports `1280×800` e `390×844`, claro/escuro; texto não pode gerar overflow horizontal.
8. Sem novos GETs/salvamentos, dependências, novas chaves de cache, mutação de menus, imports PrimeVue ou alteração de permissões.
9. Gates de tipos da suíte, lint, build/tipos da biblioteca, cobertura completa e navegador passam na revisão correspondente. Comandos, matriz de aceite e condições de interrupção estão em `plan.md`.

Nenhum teste, build, lint, instalação, serviço ou migração foi executado durante a elaboração desta especificação.
