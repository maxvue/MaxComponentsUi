# Especificação técnica — tamanho dos ícones por item nos menus do MaxApp

Data: 03/11/2026. Projeto: `@maxvue/max-components-ui` 1.1.36. Worktree: `wt-2e1ae3c1`.

## 1. Contexto & Objetivo

Os ícones de navegação lateral e inferior usam tamanhos fixos. A barra de ferramentas superior aceita `icon_size` somente nos itens com texto. O objetivo é reconhecer os tamanhos informados **nos dados de cada item**, mantendo os padrões de cada contexto quando não houver configuração.

Decisão confirmada pelo usuário: configuração por item, inclusive em `details` quando existir; não criar configuração geral em props do MaxApp ou das barras. As precedências, validação e limites abaixo são propostas técnicas para revisão, não contratos já implementados.

## 2. Escopo

### Incluído

- Campo genérico `size` e campos específicos: lateral `size_side`/`side_size`; inferior `size_bottom`/`bottom_size`; superior `size_top`/`top_size`. `side_size` é o alias simétrico proposto para o “etc.” do pedido.
- Itens principais e de configurações do menu lateral desktop, gaveta mobile, ícones de subitens e do pai no flyout.
- Abas inferiores em todos os ramos com/sem FAB.
- Itens com texto, somente ícone e submenus recursivos de `MaxTopToolbar`.
- Ícones dos itens de `addItems` no popover superior e no FAB inferior, identificando explicitamente a posição do popover.
- Tipagem, resolução centralizada, regressões, integração pelo MaxApp e comprovação de dimensões no navegador.

### Fora de escopo

- Props globais de tamanho; novos menus/posições não existentes; mudança de API/backend, banco, cache, persistência ou autenticação.
- Redimensionamento de barra, botão, área clicável, logo, avatar, fonte, FAB, chevrons, indicador de salvamento, busca ou botões fixos de sessão.
- Herança de tamanho do pai para filhos: cada item resolve seu próprio valor.
- Conteúdo arbitrário de slots do consumidor; ele continua responsável por sua renderização.
- Alteração global de `MaxIcon`, `MaxIconButton`, `getCssSize`, temas, dependências ou comportamento do popover fora do contexto de menus do shell.
- Commit, merge, push, publicação, atualização NPM ou limpeza da worktree nesta tarefa.

## 3. Arquitetura & Mudanças Técnicas

### Evidências atuais

| Arquivo existente | Evidência relevante |
| --- | --- |
| `src/components/MaxApp.vue:20–50, 123–132` | Repassa `sideMenuItems`, `sideMenuGroups`, `bottomTabs` e `addItems` aos layouts. |
| `src/components/MaxSideMenu.vue:15–28, 137–159` | Repassa os objetos aos dois grupos laterais, sem selecionar tamanho. |
| `src/components/MaxMenuVerticalItem.vue:17–27` | Ícone lateral fixo em `1.5`. |
| `src/components/MaxSideMenuMobile.vue:57–109` | Ícones de itens em `1.2` e subitens em `1.0`; chevrons separados. |
| `src/components/MaxSideMenuFlyout.vue:24–85` | Pai no cabeçalho em `1.5`; pai na lista e subitens em `1.4`. |
| `src/components/MaxBottomMenu.vue:30, 79, 97, 112–129` | Três renderizações de abas em `1.3`; contrato `BottomTab` sem os novos campos. |
| `src/components/MaxTopToolbar.vue:31–64` e `MaxTopToolbarSubmenu.vue:37–76` | Texto usa `icon_size ?? '1.2'`; somente ícone usa botão em `1.5`. |
| `src/components/MaxPopoverMenu.vue:26–34, 57–61` | `size` da prop controla o gatilho; ícones dos itens são fixos em `1.1`. |
| `src/components/MaxIcon.vue:143–159`; `MaxIconButton.vue:79–82` | MaxIcon usa `rem` para número sem unidade; botão multiplica por 16px e não aceita diretamente strings CSS. |
| `src/helpers/menuHelpers.ts`; `src/types/app.ts` | Helpers de domínio existentes e tipos laterais com formatos raiz/`details`. |

### Contrato proposto

Acrescentar em `src/types/app.ts` um contrato compartilhado `MenuIconSizeFields` com os sete campos opcionais (`number | string | null`) e `MenuIconPosition = 'side' | 'bottom' | 'top'`. Aplicar a `SideMenuItem`, `SideMenuDetails`, `SideMenuSubItem`, `BottomTab` e `MaxTopToolbarSubmenuItem`. Para os tipos locais que aceitam `details`, declarar esse objeto opcional com os campos de tamanho, sem exigir sua presença ou mudar os demais dados.

Adicionar ao helper de domínio existente `getMenuItemIconSize(item, position, fallback): string | number`. A resolução não muta o objeto, não persiste nada e não faz I/O. Examinar candidatos nesta ordem e usar o primeiro válido:

| Posição | Ordem antes do fallback |
| --- | --- |
| Lateral | `item.size_side`, `item.side_size`, `item.details?.size_side`, `item.details?.side_size`, `item.size`, `item.details?.size` |
| Inferior | `item.size_bottom`, `item.bottom_size`, `item.details?.size_bottom`, `item.details?.bottom_size`, `item.size`, `item.details?.size` |
| Superior | `item.size_top`, `item.top_size`, `item.details?.size_top`, `item.details?.top_size`, `item.size`, `item.details?.size` |

- Específico da posição vence o genérico, inclusive quando o específico estiver em `details` e o genérico na raiz. Dentro de cada categoria, raiz vence `details`; `size_<posição>` vence o alias invertido na mesma origem.
- Não consumir campos de outra posição. Não procurar aliases dinamicamente nem aceitar chaves arbitrárias.
- Aceitar números finitos não negativos, strings decimais equivalentes e comprimentos simples não negativos com unidades `px`, `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`. Retirar espaços externos. Número sem unidade segue MaxIcon: `1.5` significa `1.5rem`, não 1.5px. Zero explícito é válido.
- Ignorar `null`, `undefined`, strings vazias, booleanos, objetos, arrays, negativos, `NaN`, infinitos e strings inválidas; seguir para o próximo candidato e, ao final, para o fallback do contexto.
- `calc()`, `var()` e tamanhos textuais como `small` não integram este contrato, pois o MaxIcon atual não os dimensiona. Percentuais também ficam fora: MaxIcon aplica a dimensão em dois elementos aninhados, tornando sua referência ambígua. Não ampliar a API genérica do ícone nesta mudança.
- Manter `icon_size` como fallback **apenas onde já funciona hoje**, nos itens com texto do topo. Novos campos válidos têm prioridade. Sem novos campos, não alterar a semântica legada de `icon_size`.

### Integração e preservação

```text
Props de itens do MaxApp / stores existentes
  → layouts existentes, sem adaptar ou descartar campos
  → renderizador lateral / inferior / superior
  → getMenuItemIconSize(item, posição, fallback local)
  → MaxIcon ou adaptação local do ícone no MaxIconButton
```

Os fallbacks permanecem `1.5` na lateral desktop; `1.2`/`1.0` na navegação/subitem mobile; `1.5`/`1.4` no cabeçalho/lista do flyout; `1.3` nas abas; `icon_size ?? '1.2'` nos itens com texto do topo; botão atual `1.5` nos itens sem texto; `1.1` nos itens do popover.

Para itens somente ícone do topo, não encaminhar uma string CSS ao `size` numérico de MaxIconButton. Preservar botão, eventos, loading e hover existentes; aplicar o tamanho configurado aos elementos de ícone internos mediante classe local e variável CSS dinâmica, limitada àquela instância, com seletores scoped/deep. Converter números para `rem` somente nessa adaptação. A regra só atua quando um dos novos campos fornece valor válido; ausência mantém exatamente o botão atual. Não redimensionar o controle nem modificar o componente genérico.

Adicionar a `MaxPopoverMenu` a prop opcional `itemIconPosition?: MenuIconPosition`, distinta de `size`. Somente quando informada, resolver o tamanho dos ícones dos itens; quando omitida, preservar a renderização atual. Informá-la como `top` em `MaxTopMenu` e `bottom` em `MaxBottomMenu`. Não mudar gatilho, slot `item`, execução de ações ou navegação.

Usar os componentes Max existentes. Preservar a integração MaxPinia do shell e as stores atuais; não criar store concorrente nem nova camada GET/save/cache. Reutilizar MaxUse para utilidades genéricas já adotadas e manter a resolução específica de menu nos helpers de domínio locais. Não introduzir PrimeVue.

### Arquivos previstos

- Existentes a alterar: `src/types/app.ts`; `src/helpers/menuHelpers.ts`; `src/components/MaxMenuVerticalItem.vue`; `MaxSideMenuMobile.vue`; `MaxSideMenuFlyout.vue`; `MaxBottomMenu.vue`; `MaxTopToolbar.vue`; `MaxTopToolbarSubmenu.vue`; `MaxPopoverMenu.vue`; `MaxTopMenu.vue`; `README.md`; testes pertinentes listados no plano.
- `src/types/app.d.ts` é rastreado: conferir a convenção efetiva na execução e manter o contrato alinhado, sem regenerar arquivos de todo `src` ou editar mapas por aproximação. O build emite os tipos distribuídos em `dist`.
- Novos propostos: `tests/helpers/menuIconSize.test.ts` e `tests/browser/menuIconSizes.browser.ts`.
- Referências de preservação, sem edição prevista: `MaxApp.vue`, layouts, `MaxSideMenu.vue`, stores, `MaxIcon.vue`, `MaxIconButton.vue`, manifests e configurações de build/testes.

## 4. Plano de Execução Faseado

1. Revalidar worktree, arquivos, dependências reais e harness por leitura; confirmar isolamento e gates antes de execução dependente.
2. Estabilizar contratos compartilhados, helper puro, precedências e testes de tabela.
3. Integrar renderizadores laterais e inferiores, mantendo todos os fallbacks e comportamentos de navegação.
4. Integrar topo/submenus e popovers contextualizados; comprovar por revisão que não houve mudança global de botões ou gatilhos.
5. Completar testes de regressão, integração no MaxApp, navegador e documentação pública, antes de executar validações.
6. Validar o lote, corrigir falhas agrupadas, revalidar somente revisões afetadas e entregar com pendências explícitas.

## 5. Critérios de Aceite & Validação

- Cada campo e alias funciona no próprio contexto, na raiz e em `details`; conflitos seguem a tabela; campo de outra posição não interfere.
- Itens vizinhos e filhos sem configuração mantêm seu tamanho original; retirar configuração restaura o fallback; zero não é substituído por uso de `||`.
- Números, strings numéricas e unidades previstas produzem largura/altura reais esperadas; inválidos não geram `NaN`, esticamento ou fallback acidental de 1rem.
- Todos os ramos de abas, submenus laterais e superiores e popovers de adição estão cobertos. Sem novos campos, preservar `icon_size`, botões fixos, FAB, slots e áreas clicáveis.
- Atualizar item reativo, substituir listas e alternar desktop/mobile atualiza o tamanho sem remount forçado, persistência ou rede adicional causada pelo tamanho.
- Navegação, disponibilidade, foco/teclado, classes legadas `.p-*`, callbacks, loading e slots permanecem funcionando.
- Usar a esteira dimensionada no `plan.md`: tipos, lint, build, suíte com cobertura e navegador. `npm run verify` permanece gate de pré-release e não foi executado nesta sessão.
- Navegador real é obrigatório para dimensões computadas: `tests/setup.ts` substitui `getComputedStyle` na suíte DOM. Não confundir prop correta ou stub com evidência geométrica.

Limites desta investigação: somente leitura de código/configuração e consulta à documentação oficial Vue sobre props/attrs. Lockfile fixa Vue 3.6.0-rc.10 e MaxUse 1.1.47; a documentação consultada é Vue 3 geral, não uma certificação específica da RC. Dependências instaladas, navegador disponível, baseline e consumidores externos não foram executados/verificados. Não houve implementação, instalação ou validação de runtime nesta sessão Plan.
