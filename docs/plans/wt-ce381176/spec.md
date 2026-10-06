# Especificação técnica — tamanho da fonte no perfil do MaxCode

## 1. Contexto & Objetivo

- Data: 06/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.2`.
- Worktree/branch: `wt-ce381176`.
- Raiz autorizada: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-ce381176`.
- Relato: alterar “Tamanho da Fonte” no perfil do MaxCode não modifica o tamanho do texto.
- Objetivo: corrigir a causa demonstrada no fluxo da biblioteca e comprovar mudança visual imediata, sem recriar o menu nem substituir a persistência existente.

**Estado do diagnóstico:** há infraestrutura implementada, mas a causa do relato não foi reproduzida nesta sessão somente de planejamento. Não confundir existência de código ou testes com funcionamento na aplicação aberta pelo usuário.

## 2. Escopo

### Incluído

1. Confirmar o ponto em que se perde o efeito: interação, estado, evento, aplicação no documento, atualização posterior ou tamanho computado do texto.
2. Correção mínima nos arquivos da biblioteca realmente responsáveis, nesta worktree.
3. Regressões unitárias e em Chromium, com estilos reais e clique no menu, não apenas evento emitido artificialmente.
4. Preservação do passo de 1px, intervalo 10–24px, restauração para 16px, menu aberto, teclado e preferência existente.
5. Validação manual no MaxCode em ambiente isolado e com a revisão corrigida efetivamente carregada, em etapa posterior autorizada.

### Fora de escopo

- Alterar o MaxCode, MaxUse ou MaxPinia fora da worktree autorizada; atualizar dependências ou corrigir sua infraestrutura sem autorização específica.
- Converter toda a biblioteca e todas as telas do consumidor de px para rem.
- Zoom de página, `transform: scale`, regras universais com `!important`, mudanças de família tipográfica, cores ou dimensões não relacionadas.
- Migração de dados, novos endpoints, novas stores, troca de persistência, instalação, publicação, commit, merge, push ou troca de branch.
- Corrigir achados independentes do relato como condição artificial para concluir esta tarefa.

## 3. Arquitetura & Mudanças Técnicas

### Evidências atuais

| Local existente | Evidência por leitura |
|---|---|
| `src/components/MaxUserSection.vue:254–285` | Mantém valor local, normaliza, chama `setGlobalFontSize` e emite `changeFontSize`. |
| `src/helpers/useHtmlFontSize.ts:36–52` | Aplica inline em `html`, escreve `--max-font-size-base`, salva `max_font_size` e sincroniza ref compartilhada. |
| `src/components/MaxTopMenu.vue:44–61,109–125` | Alimenta o perfil e encaminha evento no desktop/mobile. |
| `src/components/MaxPageLayout.vue:3–22,31–42` | Encaminha evento; passa `fontSize` ao topo desktop, mas não explicitamente ao layout mobile. |
| `src/components/MaxPageMobileLayout.vue:3–15` | Declara/consome `fontSize` no topo mobile e encaminha evento. |
| `src/components/MaxApp.vue:329–348` | Reaplica tamanho, atualiza `user.data.settings.fontSize`, chama `save` se disponível e emite evento; watcher prioriza prop sobre preferência. |
| `src/stores/useUser.Store.ts:12–45` | GET/cache/save delegados ao plugin MaxPinia; rotas vêm de configuração. |
| `tests/components/MaxApp.test.ts:522–546` | Testa estilo inline e persistência com evento sintético, não tamanho computado. |
| `tests/components/MaxUserSection.test.ts:199–247` | Testa clique, valor, evento e limites, não efeito tipográfico real. |
| `tests/setup.ts:41–74` | Substitui `getComputedStyle`; testes unitários não comprovam tipografia real. |
| `src/components/MaxUserSection.vue:694` | Texto do menu usa `0.9rem`, que deve responder à raiz. |
| `src/components/InputBase.vue:559` | Há textos em px fixos que não respondem automaticamente à raiz. |

### Consumidor inspecionado somente em leitura

Base: `/home/johnattas/GitHub/MaxCode` — não é destino autorizado de escrita.

- `resources/App.vue:2`: usa `MaxApp`, sem prop `fontSize` fixa, sem listener de fonte externo; ausência do listener não é defeito, pois `MaxApp` já aplica internamente.
- `resources/app.ts:104–143`: configura `user.data`/`user.save` e instala MaxPinia com Axios.
- `resources/Theme/font.scss:18–20`: regra normal de `html` com 15px. Não há `!important` nessa regra; ela não explica, sozinha, a derrota do estilo inline.
- `resources/App.vue` e `resources/Vue/Pages/RunnersPage.vue`: há textos em px e em rem nas telas; px explica somente os textos fixos, não prova falha do menu inteiro.
- `vite.config.ts:151–169`: alias da biblioteca para `storage/libs/MaxComponentsUi/src/index.ts`.
- O link `storage/libs/MaxComponentsUi` aponta para a raiz `/home/johnattas/GitHub/MaxComponentsUi`, não para esta worktree. O helper lido na raiz tem o mesmo comportamento descrito acima. Não se comprovou identidade de toda a revisão nem do bundle servido.

### Fluxo preservado

```text
Clique +/-/restaurar no MaxUserSection
  → normalização + helper existente → html/variável CSS/localStorage/ref
  → changeFontSize → MaxTopMenu → layout desktop/mobile → MaxApp
  → user.data.settings.fontSize → save/cache/auto-save MaxPinia
  → evento público para o consumidor
```

### Decisão técnica condicionada à evidência

Primeiro distinguir: (A) DOM não atualizado; (B) valor atualizado e sobrescrito; (C) raiz atualizada, texto fixo em px; (D) aplicação carregando outra revisão/documento. Registrar o ramo observado antes de modificar produção.

- A/B: corrigir somente a origem comprovada no menu/helper/watcher/repasse; preservar nomes e assinaturas públicas e prioridades atuais. Se o repasse mobile for necessário para o defeito demonstrado, passar explicitamente `:font-size="props.fontSize"` do layout genérico ao mobile e cobrir com teste.
- C: ajustar apenas a regra tipográfica da biblioteca demonstradamente ligada ao relato, preservando o tamanho base equivalente; texto fixo do MaxCode exige autorização separada, não um hack global na biblioteca.
- D: entregar diagnóstico e regressões locais; bloquear aceite externo até carregar a revisão correta por procedimento autorizado do MaxCode. Não apontar links para esta worktree por conta própria.
- Se o fluxo já funcionar com os estilos reais, não criar alteração de produção sem causa. Manter a regressão e registrar a dependência externa.

Reutilizar os componentes Max e o helper público existente, que pertence ao design system. A busca nas declarações distribuídas do MaxUse instalado não encontrou equivalente de `useHtmlFontSize`/`applyHtmlFontSize`; isso não autoriza migrar a API para outro repositório. GET/save permanecem no MaxPinia e helpers de integração no MaxUse, sem HTTP próprio.

## 4. Plano de Execução Faseado

1. **Preflight e reprodução:** conferir revisão, permissões, scripts, links e isolamento; estabelecer evidência do ramo A/B/C/D, sem operar o consumidor compartilhado.
2. **Regressões e correção em lote:** preparar casos e implementar somente a correção respaldada, mantendo os testes existentes.
3. **Validação local:** unitários completos, tipos de teste, lint, build e navegador depois do lote; corrigir falhas agrupadas e revalidar conteúdo alterado.
4. **Aceite externo/handoff:** validar no MaxCode somente com ambiente e revisão corretos, credenciais de teste e autorização; enquanto indisponível, marcar `manualPending` e próxima ação.

Dependências e comandos estão detalhados em `plan.md`. Nenhuma destas fases foi executada nesta sessão Plan.

## 5. Critérios de Aceite & Validação

- Clique no aumento muda raiz, valor do menu e tamanho computado de texto rem real; diminuição reverte e restauração volta a 16px.
- Para `.main-item-menu-div` em `0.9rem`, raiz de 16px e 20px corresponde aproximadamente a 14.4px e 18px, com tolerância de arredondamento de 0.1px, sem mocks de CSS.
- Valor não volta ao anterior após ciclo reativo ou confirmação de salvamento; não se altera a precedência atual de prop explícita.
- Preferência existente aparece ao carregar; após salvar e recarregar ambiente de teste, permanece; se não há conta carregada, o comportamento local é preservado.
- Desktop/mobile, limites, menu aberto, foco e teclado não sofrem regressão; overlays continuam dentro da tela em 320px e 1280px.
- Comandos confirmados: `npm run test`, `npm run type-check:test`, `npm run lint`, `npm run build` (inclui checagem de tipos), `npm run test:browser`. `npm run verify` é o gate completo de eventual pré-release, não substituído pelo lote local nem autorizado como publicação.
- Não declarar o relato corrigido no MaxCode com apenas testes da biblioteca ou dublê de `save`.
- Nenhum teste, build ou acesso autenticado ao aplicativo foi realizado no planejamento. Documentação oficial consultada: https://vuejs.org/api/reactivity-core.html e https://vuejs.org/guide/essentials/reactivity-fundamentals (Vue 3; sem documentação específica do RC utilizado).
