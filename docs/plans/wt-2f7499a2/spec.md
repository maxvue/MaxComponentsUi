# Especificação técnica — largura mobile do MaxSteps

## 1. Contexto & Objetivo

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui` (pacote local 1.1.3).
- Worktree e branch: `wt-2f7499a2`.
- Raiz confirmada por `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-2f7499a2`.
- Solicitação: impedir que `.max-steps-header` ultrapasse a tela no mobile, limitar o MaxSteps a 100% da largura disponível e aproximar os itens para caberem.
- Usuários afetados: consumidores de assistentes por etapas em telas pequenas e em contêineres estreitos, inclusive dentro de flex e grid.

Esta sessão produz somente documentos. Não implementa a correção nem executa testes. A árvore Git estava limpa no início da investigação.

### Evidências e diagnóstico

| Local existente | Fato observado |
| --- | --- |
| `src/components/MaxSteps.vue:557–617` | Raiz com `width/max-width: 100%`, mas sem `min-width: 0`; wrapper com `max-width: 100vw`; cabeçalho flexível com `width: 100%` e rolagem horizontal interna. |
| `src/components/MaxSteps.vue:889–977` | Mobile fixa `min-width: 68px` e `flex: 1 0 auto` por etapa; cartão adiciona padding horizontal; labels aceitam até 76px. Esses limites dificultam compactar o conjunto. |
| `src/components/MaxSteps.vue:210–234, 250–256, 979–997` | Mobile por breakpoint, `isMobile` ou `mobile`; labels opcionais; etapa ativa usa `scrollIntoView`; mixin também é aplicado por media query. |
| `tests/components/MaxSteps.test.ts:325–421` | Testes de mobile cobrem classes e labels. O teste de largura somente verifica existência do wrapper, header e `role`, não geometria. |
| `vitest.config.ts` e `tests/setup.ts` | Suíte unitária usa happy-dom; `getComputedStyle` é simulado globalmente. Não é evidência de layout real. |
| `vitest.browser.config.ts` | Existe Chromium via Playwright; descoberta de testes em `tests/browser/**/*.browser.ts`. Não existe teste browser de MaxSteps. |

**Hipótese fundamentada, não reprodução concluída:** larguras mínimas, flex sem encolhimento e mínimos intrínsecos de ancestrais podem provocar expansão ou excesso de conteúdo. A causa visual exata deve ser demonstrada pelas medidas do teste browser; não há captura do consumidor nem execução de navegador nesta sessão.

## 2. Escopo

### Incluído

1. Ajuste localizado de dimensionamento no SCSS scoped de `MaxSteps.vue`.
2. Compactação mobile dos itens e contenção de labels longos.
3. Regressões unitárias de contratos e teste novo de geometria em navegador real.
4. Compatibilidade com contêiner menor que a tela, botões superiores ligados/desligados, borda e rótulos mobile opcionais.

### Fora de escopo

- Alterar props, eventos, modelos, aliases, cache, callbacks, regras de avanço, lazy rendering ou contexto de injeção.
- Mudar cores, estados, ícones, breakpoint, precedência de props mobile ou layout desktop deliberadamente.
- Ocultar etapas, criar carrossel, quebrar o cabeçalho em várias linhas ou adicionar dependências.
- Alterar MaxStepItem, MaxIconButton, stores, helpers, configurações ou playground para corrigir esta ocorrência.
- Publicar pacote, atualizar npm, fazer commit, trocar branch, integrar ou remover a worktree.

## 3. Arquitetura & Mudanças Técnicas

### Arquivos da implementação futura

| Arquivo | Situação | Responsabilidade |
| --- | --- | --- |
| `src/components/MaxSteps.vue` | Existente; modificar | Contenção e compactação no SCSS local. |
| `tests/components/MaxSteps.test.ts` | Existente; modificar | Nome fiel ao alcance do teste estrutural e regressões de contratos mobile. |
| `tests/browser/MaxSteps.browser.ts` | Novo proposto | Medições de largura, encaixe, não sobreposição e navegação real. |

### Dimensionamento proposto

- Raiz: permitir encolhimento como item flex/grid com `min-width: 0`; manter `width: 100%` e `box-sizing: border-box`; limitar simultaneamente pelo pai e pela viewport, por exemplo `max-width: min(100%, 100vw)`. Não usar `width: 100vw`, que ignora margens, padding e colunas.
- Wrapper do cabeçalho: `min-width: 0` e limite de 100% do componente; eliminar a dependência de `100vw` como único teto, inclusive no mixin mobile.
- Cabeçalho: ocupar apenas o espaço restante após os botões e gaps. Preferir base flex zero (`flex: 1 1 0`) e retirar o pedido redundante de 100% da linha (`width: 0` como base de distribuição é uma opção); manter `min-width: 0`, limite percentual e rolagem interna existente.
- Itens mobile: substituir `flex: 1 0 auto` por distribuição com base zero e encolhimento (`flex: 1 1 0`); reduzir mínimo de 68px para uma base compacta proposta de 40px. Esse valor deve ser confirmado por geometria, não tratado como resultado medido.
- Cartão mobile: reduzir padding horizontal de 6px para até 4px; propagar `min-width: 0`, `max-width: 100%` e dimensionamento border-box nos wrappers necessários, sem mudar os círculos de 28px, badges ou números.
- Labels: limitar pela coluna real do item, não pelo texto; manter ellipsis, `title`, `aria-label`, número e linha ativa. O teto de 76px pode permanecer desde que também respeite 100% da coluna.
- Preservar conectores alinhados ao centro dos marcadores, foco acessível, estados e todas as classes existentes. Não encobrir o problema com `overflow-x: hidden` em `body` ou no componente inteiro.

### Contrato de encaixe e excesso

- A caixa externa do componente, wrapper e header nunca deve crescer além do espaço disponível nem criar rolagem horizontal na página em um host corretamente contido.
- Critério proposto para demonstrar a aproximação: 4 e 6 etapas cabem simultaneamente em viewport de 320px com host de 288px úteis, botões padrão visíveis, com e sem labels. Também validar 360, 375 e 390px.
- Como não há limite público para a quantidade de etapas, preservar rolagem **somente interna** quando a soma dos mínimos legíveis realmente não couber (ex.: 12 etapas em 320px). Não reduzir marcadores indefinidamente, sobrepor itens nem esconder etapas. Essa é uma decisão de preservação do recurso existente, não uma afirmação de que qualquer quantidade cabe sem rolagem.
- Não ajustar comportamento de overrides mobile ou os limites de 768px nesta correção. Divergência preexistente foi notificada separadamente.

### Integrações e contratos preservados

Fluxo existente: `MaxStepItem → registro via StepsContext → lista de cabeçalhos → ação de navegação → active_step/modelos/eventos → painel ativo`.

A correção atua na apresentação desse fluxo. Continuar usando `MaxIcon`, `MaxIconButton`, `MaxStepItem` e helpers de `@maxvue/max-use` existentes. Não há GET, salvamento ou novo estado de página: não introduzir store MaxPinia artificialmente nem substituir o cache existente. Caso surja necessidade real de estado remoto, isso exige novo escopo com MaxPinia. Não importar PrimeVue, VueUse direto ou bibliotecas locais irmãs.

## 4. Plano de Execução Faseado

1. Ler `plan.md`, esta spec e diretrizes; conferir branch, árvore local, trabalho já iniciado e ambiente efetivo por leitura.
2. Preparar teste browser de regressão e completar testes de contrato, sem executar validações entre microalterações.
3. Aplicar contenção e compactação no SCSS de MaxSteps; revisar o conjunto dos três arquivos antes de rodar validações.
4. Executar gates previstos no plano uma vez por revisão; agrupar correções e revalidar apenas o que foi invalidado.
5. Revisar geometria e interação em telas pequenas; registrar evidências e pendências; entregar sem operações Git de integração.

## 5. Critérios de Aceite & Validação

- Medir `getBoundingClientRect`, `clientWidth` e `scrollWidth` reais no iframe browser; tolerância máxima de 1px para arredondamento.
- Em fixtures sem overflow alheio: `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`; caixas externas contidas no host e na viewport; header contido entre os botões.
- Para 4/6 etapas na matriz mínima: `header.scrollWidth <= header.clientWidth + 1`, todos os marcadores visíveis e sem interseção entre marcadores ou entre botões e marcadores.
- Para excesso: página continua contida; todas as etapas continuam alcançáveis por rolagem interna e navegação; última etapa pode ficar visível sem deslocar horizontalmente a página.
- Labels longos não aumentam a largura das colunas, nomes acessíveis continuam íntegros e linha ativa/badges não desaparecem.
- Cobrir flex/grid, pai com padding, `showBorder`, `showTopButtons`, `mobileShowLabel`, mobile explícito e automático; manter regressão desktop em 1024/1280px.
- Preservar modelos, `nextOnlyDone`, `allowManual`, estados e navegação anterior/próximo.

Comandos identificados no projeto, reservados para Execute: `npm run test`, `npm run test:browser`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`. Sequenciamento e política de falhas estão em `plan.md`. Não foram executados. Gate completo `npm run verify` só quando a entrega exigir pré-release, sem repetir suas etapas isoladamente na mesma revisão.
