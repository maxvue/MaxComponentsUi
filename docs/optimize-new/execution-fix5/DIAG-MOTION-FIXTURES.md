# Diagnóstico R18 — fixtures reais para os 59 SFCs de motion

- Natureza: levantamento estático, somente leitura de código; nenhum build ou Vitest foi iniciado.
- HEAD observado: `d12d4571` (`fixes/optimize-fix5`).
- Fonte do inventário: `rg -l '@keyframes|transition\\s*:|animation\\s*:' src/components -g '*.vue'`.
- Resultado: 59 SFCs. O teste atual monta três (`MaxAiIcon`, `TransitionFade`, `MaxTransitionUp`); portanto uma fixture genérica não é aceitável para os outros 56.

## Contrato comum da futura prova browser

Cada fixture deve importar o SFC real e `src/themes/all.scss`, montar uma árvore de produto no DOM do Chromium, alternar CDP entre `no-preference` e `reduce`, e consultar o elemento real que possui a regra animada. Para cada alvo, registrar `animationDuration`, `animationIterationCount`, `transitionDuration` e `transform` nos dois modos. Quando a UI possui entrada/saída, a fixture deve disparar o estado que a cria e a remove e aguardar o fim entregue pelo navegador, verificando estado final/remoção e ausência de listeners ou timers pendentes.

Não usar classes, regras CSS ou `div`s artificiais como substitutos. Providers abaixo devem ser reais (Pinia e Router de memória) e os serviços externos devem ser adaptadores locais válidos, não componentes filhos substituídos.

## Família A — primitivas autônomas (19)

Montagem: `createApp` simples, `all.scss`, contêiner visível; os componentes com `Transition` recebem slot real e um `ref<boolean>` alternado.

| SFCs | Props/estado mínimo que expõe motion | Dependências adicionais |
|---|---|---|
| `MaxAiIcon`, `MaxLoaderIcon`, `base/MaxBaseSpinner` | render padrão; no spinner usar `animationDuration="2s"` | nenhuma |
| `MaxAnimateFade`, `MaxTransitionFadeLight`, `MaxTransitionUp`, `TransitionFade` | slot `<span>` e `show/visible` alternado; em `MaxAnimateFade`, `show=true`, `appear=true` | nenhuma |
| `MaxBadge`, `MaxBadgeButton`, `MaxButton`, `MaxIconButton`, `MaxLikeButton` | label/ícone real; acionar `hover`, `focus-visible` e clique quando aplicável | nenhuma; `MaxBadge` lê o tema do documento |
| `MaxCreditCard` | dados válidos e alternar face/estado que aplica transformação | nenhuma |
| `MaxInputCheckbox`, `MaxInputOTP`, `MaxInputRadio`, `MaxInputSwitch`, `MaxInputToggle` | `v-model` real; foco e alteração pelo teclado/clique | formulário real recomendado para a anatomia de input |
| `base/MaxBaseInput` | `modelValue`, `label`, foco e erro/disabled | nenhuma |

## Família B — contextos estruturais obrigatórios (4)

| SFCs | Pai/provider real obrigatório | Props/ação que deve ocorrer |
|---|---|---|
| `MaxAccordionItem` | `<MaxAccordion>`; ele fornece `accordionContext` | `value`, `title`; clique no header para abrir e fechar conteúdo |
| `MaxTab`, `MaxTabItem`, `MaxTabList` | `<MaxTabs>` com `<MaxTabList>` e ao menos dois `<MaxTabItem>`; `MaxTabs` fornece `tabsContext`/`tabs_info` e os alvos de teleport | `scrollable`, itens largos; seleção por clique/teclado e rolagem para expor transições |

`MaxAccordionItem`, `MaxTabItem` e `MaxTabList` não devem ser montados isoladamente: seus `inject*Context` e destinos de `Teleport` são parte do comportamento efetivo.

## Família C — inputs, seletores e editor (13)

| SFCs | Fixture real mínima | Estado que torna motion observável |
|---|---|---|
| `MaxChips`, `MaxTagsList` | `v-model` array, opções e item inicialmente selecionado | adicionar/remover chip/tag; abrir seletor filho |
| `MaxInputAutoCompleteApi` | `route`/adaptador de fetch local respondendo lista válida, `modelValue` e trigger | foco/digitação abre overlay e estado de carregamento |
| `MaxInputSelect`, `MaxTagSelect` | `v-model`, ao menos três `options`, contêiner com dimensão | clique/foco abre `Teleport`; selecionar opção fecha |
| `MaxInputDatePicker` | `v-model` data ISO, locale/data válidas | abrir calendário e navegar mês |
| `MaxInputCode`, `MaxInputCodeToolbar` | `v-model` texto; para toolbar, editor/contrato real fornecido por `MaxInputCode` | foco e fullscreen/toolbar, quando disponível |
| `MaxInputFileUpload`, `MaxInputFileUploadBig` | `v-model=[]`, `File` criado pelo browser e callback de upload que resolve/rejeita | drop/seleção e estados uploading/error |
| `MaxInputIconPicker` | `v-model`, lista de ícones real pequena | abrir drawer, filtrar e fechar |
| `MaxInputMarkdown`, `MaxInputMarkdownToolbar` | montar `MaxInputMarkdown` com extensão Tiptap real e `v-model` | abrir preview/lightbox e toolbar; não injetar editor falso |

Esses treze já encapsulam helpers de overlay/virtual list. Eles precisam de layout mensurável (`attachTo` no body, dimensões explícitas no host) para que posição, transform e `Teleport` existam de fato.

## Família D — overlays, modal store e carregamento (8)

| SFCs | Provider/infraestrutura real | Props/ação |
|---|---|---|
| `MaxDrawer`, `MaxModal`, `MaxImage`, `MaxPdfView`, `MaxPopover`, `base/MaxBaseOverlay` | Pinia instalada; `useModalStore`/`usePopoverStore` reais; host `body`; foco inicial interagível | alternar `visible`/`modelValue`, abrir por trigger, então fechar por botão/Escape/backdrop conforme contrato |
| `MaxToast` | Pinia com `useToastStore` real | inserir toast pela API da store, aguardar entrada e remover/expirar |
| `MaxLoadScreenTarget` | Pinia com `useLoadingStore`; destino DOM real (por exemplo `#motion-target`) | `target={ target: '#motion-target', items: { a: { status: 'loading', message: '...' } } }`; alternar loading/done |

`MaxImage` requer `src` de `data:image/svg+xml,...` ou `Blob` válido; `MaxPdfView` requer um PDF/Blob mínimo válido e seu componente assíncrono real. A prova deve evitar rede e Lottie remoto, pois eles transformam o gate em teste de infraestrutura.

## Família E — layout e dados (4)

| SFCs | Fixture real mínima | Estado/medição |
|---|---|---|
| `MaxDividers` | Pinia com `useSystemStore`, dois slots de painel, `resizable` e host com tamanho | arrastar gutter e alternar direção/colapso |
| `MaxStats` | `items` válidos e largura de host controlada | resize/breakpoint para os estilos responsivos |
| `MaxTable` | colunas e pelo menos 20 linhas; altura mensurável; se virtualizado, rolar | hover/focus de linha, scroll/virtualização |
| `MaxTableFields` | colunas com `input` (`text`, `select`, `checkbox`) e uma linha mutável | editar célula/incrementar para renderizar controles filhos |

## Família F — navegação, usuários e menus (9)

Todos usam Router de memória com rota inicial nomeada e Pinia real. Onde há stores, inicializar apenas dados públicos mínimos (usuário, menus, toolbar, busca e `system.page`), sem stubs de componentes.

| SFCs | Provider/props mínimos | Estado que expõe motion |
|---|---|---|
| `MaxBottomMenu` | Router, tabs com `route`/`icon`; `addItems` opcional | trocar rota e abrir ação flutuante |
| `MaxMenuVerticalItem` | Router e Pinia (`useSystemStore`, `useSearchBarStore`); `items` com `details` completo | foco/hover e navegação |
| `MaxSideMenuMobile` | Router e Pinia (`System`, `User`, `ListMenus`); `visible=true` e menus válidos | abrir/fechar drawer e trocar item |
| `MaxTopMenu` | Pinia (`System`, `User`, `TopToolbar`), slots de fallback; router se filhos o utilizarem | alternar toolbar/busca e estado mobile |
| `MaxTopMenuSearchBar` | Pinia (`System`, `SearchBar`, `Modal`) e host mobile | abrir painel de busca e fechar |
| `MaxTopToolbar`, `MaxTopToolbarSubmenu` | Pinia `TopToolbar`; árvore de itens/subitens válida | abrir submenu e voltar |
| `MaxUserAvatar` | Pinia `Confirm`; user/dados de avatar válidos | hover/clique que chama confirmação |
| `MaxUserSection` | posição de âncora mensurável e itens de menu | abrir/fechar overlay de usuário |

## Família G — composição de aplicação/formulário (2)

| SFC | Provider/pai real | Props/estado |
|---|---|---|
| `MaxAuthCard` | Router de memória; callbacks locais de autenticação que resolvem; campos `v-model` | alternar fluxo e enviar dados para revelar erro/sucesso e controles internos |
| `MaxApp` | Router com rota nomeada, Pinia (`System`, `User`, `Login`) inicializada e slots `blank/login/authenticated`; não montar sem router | estado de bootstrap/logado e troca de slot/layout |

`MaxApp` é a única fixture que deve criar uma miniaplicação deliberada. Montá-lo sozinho causa `useRoute`/stores inválidos e não representa o CSS/lifecycle que R18 precisa medir.

## Ordem prática de implementação

1. Criar um helper browser compartilhado que construa `createPinia()` e `createMemoryHistory()` por teste, limpe `body`/stores e exponha `emulateMotion` + leitura CSSOM.
2. Implementar A, B e E primeiro: 27 SFCs sem serviços remotos e com contratos de pai explícitos.
3. Implementar C e D em hosts dimensionados; os adaptadores de fetch/upload/PDF devem ser locais e determinísticos.
4. Implementar F e G com uma fábrica de estado Pinia e router por fixture, nunca mockando os filhos que carregam o CSS de produto.
5. Para cada grupo, executar o mesmo caso em `no-preference` e `reduce`; só então consolidar a lista de 59 e os ciclos de lifecycle aplicáveis.

## Critério de completude verificável

A implementação só cobre R18 quando o manifesto do teste referenciar estes 59 paths, cada entrada indicar seu elemento animado real e seu acionador de estado, e a execução Chromium registrar ambos os modos. A contagem textual de media queries continua útil apenas como guarda de inventário; não substitui a montagem nem a medição CSSOM.
