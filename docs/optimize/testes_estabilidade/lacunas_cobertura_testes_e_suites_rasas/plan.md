# Plano de Implementação: Eliminação de Lacunas de Cobertura e Paridade 1:1 de Testes Unitários

## 1. Objetivo da Refatoração

Eliminar definitivamente a fragilidade e a falsa sensação de segurança decorrentes de testes superficiais e da ausência de suítes unitárias dedicadas. O objetivo é:
1. Implementar a lógica real e a estilização do componente [`MaxAnimateFade.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAnimateFade.vue), que atualmente consiste em uma casca vazia (`<template><slot></slot></template>`), dotando-o de transição suave de opacidade e suporte às propriedades `:show` e `:duration`.
2. Estabelecer paridade estrita 1:1 componente-teste criando **16 novos arquivos de teste unitário dedicados** no diretório `tests/components/` para todos os componentes que hoje não possuem suíte própria ou que estão agrupados superficialmente em suítes "guarda-chuva".
3. Aposentar ou refatorar os arquivos agregados [`tests/components/DisplayAndTransitions.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/DisplayAndTransitions.test.ts), [`tests/components/IconsAndLoaders.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/IconsAndLoaders.test.ts) e [`tests/components/LayoutComponents.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/LayoutComponents.test.ts), transferindo suas asserções para os arquivos dedicados e aprofundando a cobertura para validar reatividade, acessibilidade WAI-ARIA, classes de transição e fallbacks de ciclo de vida.

---

## 2. Arquivos Afetados

### Código-fonte dos Componentes:
- [`src/components/MaxAnimateFade.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAnimateFade.vue) — Implementação funcional com `<Transition>` e estilo SCSS scoped.

### Novos Arquivos de Teste Unitário (Paridade 1:1):
1. [`tests/components/MaxAnimateFade.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxAnimateFade.test.ts)
2. [`tests/components/MaxDoneIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxDoneIcon.test.ts)
3. [`tests/components/MaxEmptyDiv.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxEmptyDiv.test.ts)
4. [`tests/components/MaxErrorIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxErrorIcon.test.ts)
5. [`tests/components/MaxGrid.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxGrid.test.ts)
6. [`tests/components/MaxGridCols.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxGridCols.test.ts)
7. [`tests/components/MaxLink.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLink.test.ts)
8. [`tests/components/MaxLoader.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLoader.test.ts)
9. [`tests/components/MaxLoaderIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLoaderIcon.test.ts)
10. [`tests/components/MaxPageContent.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxPageContent.test.ts)
11. [`tests/components/MaxTab.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTab.test.ts)
12. [`tests/components/MaxTopToolbarSubmenu.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTopToolbarSubmenu.test.ts)
13. [`tests/components/MaxTransitionFadeLight.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTransitionFadeLight.test.ts)
14. [`tests/components/MaxTransitionUp.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTransitionUp.test.ts)
15. [`tests/components/MaxWaitIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxWaitIcon.test.ts)
16. [`tests/components/TransitionFade.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/TransitionFade.test.ts)

### Suítes Agregadas a Higienizar:
- [`tests/components/DisplayAndTransitions.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/DisplayAndTransitions.test.ts)
- [`tests/components/IconsAndLoaders.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/IconsAndLoaders.test.ts)
- [`tests/components/LayoutComponents.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/LayoutComponents.test.ts)

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Implementação Real do Componente `MaxAnimateFade.vue`
1. Atualizar [`src/components/MaxAnimateFade.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAnimateFade.vue) substituindo a casca vazia por uma implementação canônica de transição:
   - Declarar props tipadas via TypeScript:
     ```typescript
     interface MaxAnimateFadeProps {
         /** Controla a visibilidade do elemento animado quando embutido */
         show?: boolean;
         /** Duração da transição em segundos ou formato CSS (ex.: 0.3 ou '300ms') */
         duration?: number | string;
         /** Modo da transição Vue ('out-in' | 'in-out' | undefined) */
         mode?: 'out-in' | 'in-out';
         /** Dispara transição na montagem inicial */
         appear?: boolean;
     }
     ```
   - No template, envolver o `<slot></slot>` em uma tag `<Transition name="max-animate-fade" :mode="props.mode" :appear="props.appear">`.
   - Adicionar suporte a CSS variable reativa `--max-animate-fade-duration` para permitir customização dinâmica da duração via prop `duration` (padrão: `0.2s`).
   - Adicionar bloco `<style lang="scss" scoped>` com regras `:global(.max-animate-fade-enter-active)` e `:global(.max-animate-fade-leave-active)` com transição de opacidade suave e fallback para `prefers-reduced-motion: reduce`.

### Passo 2: Criação das Suítes Unitárias para Componentes de Ícones e Loaders
1. [`tests/components/MaxDoneIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxDoneIcon.test.ts):
   - Montagem e validação da classe `.icon-done-max`.
   - Presença do nó SVG e estrutura vetorial interna de check verde.
   - Validação de herança de atributos adicionais e classes repassadas.
2. [`tests/components/MaxWaitIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxWaitIcon.test.ts):
   - Montagem e validação de SVG de espera/ampulheta.
   - Verificação de classes e atributos repassados.
3. [`tests/components/MaxErrorIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxErrorIcon.test.ts):
   - Montagem e validação de SVG de erro/alerta vermelho.
4. [`tests/components/MaxLoaderIcon.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLoaderIcon.test.ts):
   - Montagem da div raiz `.max-loader-icon-div`.
   - Verificação de renderização do SVG animado.
   - Teste de repasse de estilos dinâmicos (`width`, `height`) e atributos (`data-test`).
5. [`tests/components/MaxLoader.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLoader.test.ts):
   - Montagem por padrão (`show=undefined`) exibindo `.max-loader-main-div`.
   - Renderização de rótulo customizado via prop `label`.
   - Ocultação correta com prop `show={false}` e coerção da string `show="false"`.
   - Validação de que `MaxLoaderIcon` é renderizado internamente de forma real (sem depender de stub artificial).

### Passo 3: Criação das Suítes Unitárias para Componentes de Layout e Exibição
1. [`tests/components/MaxGrid.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxGrid.test.ts):
   - Renderização do container `.max-grid` e repasse de slots.
   - Renderização condicional do rótulo `.label-grid` quando `label` é informado.
   - Aplicação da classe `.label-center` quando `labelCenter` é `true`.
2. [`tests/components/MaxGridCols.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxGridCols.test.ts):
   - Renderização da classe `.max-grid-cols` com grid de 24 colunas.
   - Projeção de múltiplos filhos no slot default.
3. [`tests/components/MaxEmptyDiv.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxEmptyDiv.test.ts):
   - Renderização com label default "Sem Registros".
   - Renderização com label customizado via prop `label`.
   - Sanitização de XSS em `props.label` via `sanitizeHtml`.
   - Renderização dos modificadores `transparent` e `nospace`.
   - Projeção de slots nomeados `#icon` e `#label`.
4. [`tests/components/MaxLink.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLink.test.ts):
   - Renderização com componente stub `RouterLink`.
   - Priorização de `route_name` gerando prop `:to="{ name: route_name }"`.
   - Renderização com `route` como string de path ou objeto.
5. [`tests/components/MaxPageContent.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxPageContent.test.ts):
   - Montagem com Pinia ativo (`setActivePinia(createPinia())`).
   - Validação de classes `.max-page-content` e `.pane1`.
   - Verificação da atualização da store `useSystemStore().content_page_size` quando o elemento possui dimensões calculadas.
   - Renderização do slot default.

### Passo 4: Criação da Suíte Unitária para `MaxTab.test.ts`
1. [`tests/components/MaxTab.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTab.test.ts):
   - Teste de erro amigável ao montar `MaxTab` fora de um contexto `tabsContext`: deve capturar o erro lançado por `injectTabsContext('MaxTab')`.
   - Montagem controlada fornecendo mock do contexto de abas via `global.provide`:
     - Testar registro no ciclo de vida (`context.registerTab`) com `props.value` e limpeza no `onBeforeUnmount` (`unregister()`).
     - Testar cálculo de estado ativo: aplicação da classe `.max-tab-active` e atributo `aria-selected="true"`.
     - Testar estado desabilitado (`disabled: true`): aplicação da classe `.max-tab-disabled`, `aria-disabled="true"`, e bloqueio de cliques/foco.
     - Testar acessibilidade WAI-ARIA: `role="tab"`, `:id`, `:aria-controls`, e `tabindex` dinâmico (`0` para aba ativa/focável, `-1` para as demais).
     - Testar seleção ao focar quando `select_on_focus` estiver habilitado no contexto.

### Passo 5: Criação da Suíte Unitária para `MaxTopToolbarSubmenu.test.ts`
1. [`tests/components/MaxTopToolbarSubmenu.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTopToolbarSubmenu.test.ts):
   - Renderização de lista de itens de menu com rótulos, subrótulos e ícones.
   - Renderização de divisores horizontais (`divider: true`).
   - Recursão de submenus: abertura do submenu aninhado quando o mouse entra em item que possui `items` filhos (`activeSubmenu === index`).
   - Emissão de eventos:
     - `@keep-open` ao passar o mouse sobre o menu raiz e itens.
     - `@schedule-close` ao sair do elemento.
     - `@item-click` emitido com o item clicado como payload.
   - Renderização correta de botões de ação quando `label` não for informado.

### Passo 6: Criação das Suítes Unitárias para Componentes de Transição
1. [`tests/components/TransitionFade.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/TransitionFade.test.ts):
   - Validar que a tag raiz é um componente `<Transition>` com atributo `name="fade"`.
   - Testar visibilidade dinâmica com alternância de `v-if`.
2. [`tests/components/MaxTransitionFadeLight.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTransitionFadeLight.test.ts):
   - Validar componente `<Transition>` com atributo `name="fadelight"`.
   - Testar renderização de slots e transição de entrada.
3. [`tests/components/MaxTransitionUp.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTransitionUp.test.ts):
   - Validar componente `<Transition>` com atributo `name="slide-vertical-animation"`.
   - Testar transição de saída e entrada vertical.
4. [`tests/components/MaxAnimateFade.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxAnimateFade.test.ts):
   - Testar renderização com `<Transition name="max-animate-fade">`.
   - Testar repasse de classes e aplicação da variável CSS de duração `:duration="0.5"`.
   - Validar transição de nós em `v-if` alternado.

### Passo 7: Saneamento das Suítes Agregadas Legadas
1. No arquivo [`tests/components/DisplayAndTransitions.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/DisplayAndTransitions.test.ts):
   - Manter apenas os testes consolidados de `MaxTitle1` e `MaxTitle2` (ou verificar redundância com `MaxTitle1.test.ts` e `MaxTitle2.test.ts`), removendo as seções de `MaxEmptyDiv`, `MaxLink` e `Transições` que foram migradas para suas respectivas suítes dedicadas.
2. No arquivo [`tests/components/IconsAndLoaders.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/IconsAndLoaders.test.ts):
   - Excluir o arquivo monolítico após a validação de que os 5 arquivos individuais (`MaxDoneIcon.test.ts`, `MaxWaitIcon.test.ts`, `MaxErrorIcon.test.ts`, `MaxLoaderIcon.test.ts` e `MaxLoader.test.ts`) cobrem e expandem todos os cenários com sucesso.
3. No arquivo [`tests/components/LayoutComponents.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/LayoutComponents.test.ts):
   - Excluir o arquivo monolítico após a validação de que `MaxGrid.test.ts`, `MaxGridCols.test.ts` e `MaxAnimateFade.test.ts` absorveram os cenários com testes unitários autônomos.

---

## 4. Padrões de Estabilidade e Convenções do GEMINI.md

1. **Estrutura Canônica de SFC**: `MaxAnimateFade.vue` deve seguir estritamente a ordem 1º `<template>`, 2º `<script setup lang="ts">`, 3º `<style lang="scss" scoped>`.
2. **Proibição de Utilitários Inline**: Zero classes utilitárias ou atributos UnoCSS attributify nas tags de template. Todo o estilo de transição deve ser centralizado no bloco SCSS scoped com seletores aninhados e regras globais de transição scoped (`:global(...)`).
3. **TypeScript Estrito**: Tipagem formal com `defineProps<Interface>()`, generic types sem uso de `any`.
4. **Convenções de Formatação**: Indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório.
5. **Isolamento em Testes**: Cada arquivo de teste deve inicializar sua própria instância do Pinia (`setActivePinia(createPinia())`) quando interagir com stores, sem efeitos colaterais entre suítes.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Paridade 1:1 Completa**:
   - Cada um dos 16 componentes possui exatamente um arquivo correspondente `tests/components/{NomeComponente}.test.ts`.
2. **Execução Verde dos Testes Unitários**:
   ```bash
   npx vitest run tests/components/MaxAnimateFade.test.ts tests/components/MaxDoneIcon.test.ts tests/components/MaxEmptyDiv.test.ts tests/components/MaxErrorIcon.test.ts tests/components/MaxGrid.test.ts tests/components/MaxGridCols.test.ts tests/components/MaxLink.test.ts tests/components/MaxLoader.test.ts tests/components/MaxLoaderIcon.test.ts tests/components/MaxPageContent.test.ts tests/components/MaxTab.test.ts tests/components/MaxTopToolbarSubmenu.test.ts tests/components/MaxTransitionFadeLight.test.ts tests/components/MaxTransitionUp.test.ts tests/components/MaxWaitIcon.test.ts tests/components/TransitionFade.test.ts
   ```
   Todos os 16 testes devem passar com 100% de sucesso.
3. **Checagem de Tipos sem Regressão**:
   ```bash
   npm run type-check
   ```
   Deve concluir com zero erros de compilação do `vue-tsc`.
4. **Linters Aprovados**:
   ```bash
   npm run lint
   ```
   ESLint e Stylelint devem passar sem qualquer violação.

---

## 6. Mitigação de Riscos de Regressão

1. **Compatibilidade com `MaxPopover.vue`**:
   - [`MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue#L20) consome `<MaxAnimateFade :show="isOpen" :duration="0.3">`. A nova implementação de `MaxAnimateFade` deve preservar integralmente essa API para que os testes de `MaxPopover.test.ts` continuem passando sem qualquer ajuste de contrato.
2. **Preservação de Contexto do `MaxTabs`**:
   - A criação de `MaxTab.test.ts` com mock isolado de `tabsContext` garante que os testes agregados de `MaxTabs.test.ts` não sejam afetados e continuem cobrindo a integração end-to-end do conjunto de abas.
3. **Recursão Segura no `MaxTopToolbarSubmenu`**:
   - Garantir que a renderização recursiva em submenus não gere loops infinitos quando a estrutura de dados contiver referências circulares acidentais.
