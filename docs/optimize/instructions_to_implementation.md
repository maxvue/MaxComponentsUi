# PROMPT DE EXECUÇÃO E ORQUESTRAÇÃO DE IMPLEMENTAÇÕES
## Auditoria Técnica e Refatoração Global da Biblioteca `@maxvue/max-components-ui`

> **Instrução para o Agente Executor:**
> Você é o **Agente Orquestrador de Engenharia** responsável por liderar e executar a implementação completa dos 22 planos de refatoração validados pela auditoria técnica da biblioteca `@maxvue/max-components-ui`.
> Este documento é o seu manual operacional definitivo e prompt mestre. Você **DEVE** utilizar **subagentes especializados** para executar as etapas, garantindo paralelismo seguro, isolamento de escopo e verificação contínua de integridade.

---

## 1. Diretrizes Canônicas e Regras Invioláveis do Projeto

Antes de iniciar qualquer alteração, o Agente Executor e todos os seus subagentes **DEVEM** assimilar as seguintes diretrizes:

1. **Ambiente de Execução (Worktree Git):**
   - Todas as modificações devem ser realizadas estritamente na worktree ativa:
     `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01`
   - Não troque de branch, não crie outras worktrees e não execute `git commit`, `git merge` ou `git push` (o versionamento é controlado externamente pelo MaxCode quando solicitado pelo usuário).

2. **Independência Total do PrimeVue (Zero Dependências Externas):**
   - É terminantemente proibido reintroduzir ou manter classes `.p-*` (como `.p-inputtext`, `.p-select`, `.p-button`, `.p-floatlabel`, etc.).
   - Toda marcação deve ser semântica e nativa, com estilização isolada.

3. **Padrões de Identidade Visual e Estilização Front-End (`GEMINI.md`):**
   - **Proibição absoluta de classes utilitárias e estilos inline no template:** É proibido `style="..."`, `:style="..."` arbitrário no template, classes como `flex`, `p-30`, `w-full` ou atributos UnoCSS attributify (`<div flex>`, `<div pointer>`, `<div center>`).
   - **Único meio autorizado:** Todo o estilo deve residir no bloco `<style lang="scss" scoped>`.
   - **Aninhamento hierárquico obrigatório:** Os seletores SCSS devem espelhar fielmente a árvore DOM do template.
   - **Cores canônicas do Design System:** Proibido hardcoded hex (`#fff`, `#00768E`, etc.). Utilizar estritamente variáveis CSS: `--background-*` para superfícies neutras com inversão dark mode, `--max-primary-50` a `950` (Teal institucional `#00768E`), `--max-success-*`, `--max-danger-*`, `--max-warning-*`, `--max-info-*`.
   - **Tipografia e Geometria:** Fonte `Quicksand`, altura padrão de controles de formulário e botões de `36px`, border-radius de `4px` para controles e `6px`/`8px` para modais/overlays.
   - **Acessibilidade de Foco (WCAG 2.4.7 / 2.4.11):** Todo elemento interativo deve ter `:focus-visible` consumindo `var(--max-focus-ring)`.

4. **Convenções de Código Vue 3 & TypeScript:**
   - Exclusivamente Composition API com `<script setup lang="ts">`.
   - Props tipadas via `defineProps<Interface>()` e emits estritamente tipados via `defineEmits<{ (e: 'event', payload: Type): void }>()`.
   - Ordem obrigatória dos blocos SFC: 1º `<template>`, 2º `<script setup>`, 3º `<style lang="scss" scoped>`.
   - Indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório.

---

## 2. Mapa dos 22 Planos de Implementação

Todos os planos detalhados com trechos de código e especificações encontram-se em `docs/optimize/`:

| Categoria | Identificador do Achado | Caminho do Plano |
|---|---|---|
| **Testes/Estabilidade** | Artefatos Corrompidos | [`docs/optimize/testes_estabilidade/artefatos_corrompidos_e_poluicao_repositorio/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/testes_estabilidade/artefatos_corrompidos_e_poluicao_repositorio/plan.md) |
| **UI/Design** | Adulteração Cromática & Dark Mode | [`docs/optimize/ui_design/achado_02_adulteracao_cromatica_fallbacks_incoerentes_dark_mode/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ui_design/achado_02_adulteracao_cromatica_fallbacks_incoerentes_dark_mode/plan.md) |
| **UI/Design** | Atributos Utilitários & `params.scss` | [`docs/optimize/ui_design/achado_04_atributos_utilitarios_unocss_params_scss_templates/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ui_design/achado_04_atributos_utilitarios_unocss_params_scss_templates/plan.md) |
| **UI/Design** | Resíduos de Classes PrimeVue | [`docs/optimize/ui_design/achado_01_acoplamento_residual_classes_primevue_inputbase/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ui_design/achado_01_acoplamento_residual_classes_primevue_inputbase/plan.md) |
| **Usabilidade** | Desconexão Rótulos `InputBase` | [`docs/optimize/usabilidade/desconexao-rotulos-mensagens-inputbase/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/usabilidade/desconexao-rotulos-mensagens-inputbase/plan.md) |
| **UX** | Truncamento e Validação Formulários | [`docs/optimize/ux/truncamento-mensagens-validacao-inconsistente-formularios/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ux/truncamento-mensagens-validacao-inconsistente-formularios/plan.md) |
| **Testes/Estabilidade** | Fragilidade de Props (`null`) | [`docs/optimize/testes_estabilidade/fragilidade_props_falta_defensividade/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/testes_estabilidade/fragilidade_props_falta_defensividade/plan.md) |
| **UI/Design** | Estilos Inline & `MaxBaseOverlay` | [`docs/optimize/ui_design/achado_03_violacao_estilos_inline_ausencia_primitiva_overlay/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ui_design/achado_03_violacao_estilos_inline_ausencia_primitiva_overlay/plan.md) |
| **UX** | Dead Clicks & Flickering Overlays | [`docs/optimize/ux/dead-clicks-flickering-posicionamento-overlays/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ux/dead-clicks-flickering-posicionamento-overlays/plan.md) |
| **Usabilidade** | Supressão de Outline & Foco Visível | [`docs/optimize/usabilidade/supressao-outline-fragmentacao-foco-visivel/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/usabilidade/supressao-outline-fragmentacao-foco-visivel/plan.md) |
| **Usabilidade** | Ausência de Focus Trap em Overlays | [`docs/optimize/usabilidade/ausencia-focus-trap-overlays-flutuantes/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/usabilidade/ausencia-focus-trap-overlays-flutuantes/plan.md) |
| **Usabilidade** | Roving Tabindex em Toolbars/Tabs | [`docs/optimize/usabilidade/ausencia-roving-tabindex-toolbars-acordeoes/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/usabilidade/ausencia-roving-tabindex-toolbars-acordeoes/plan.md) |
| **Usabilidade** | Controles Interativos Aninhados | [`docs/optimize/usabilidade/controles-interativos-aninhados-semantica-aria/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/usabilidade/controles-interativos-aninhados-semantica-aria/plan.md) |
| **Performance** | Falta de Virtualização | [`docs/optimize/performance/falta-virtualizacao-colecoes-grandes/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/performance/falta-virtualizacao-colecoes-grandes/plan.md) |
| **Performance** | Reatividade Desnecessária em Overlays | [`docs/optimize/performance/reatividade-posicionamento-desnecessario-overlays-inativos/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/performance/reatividade-posicionamento-desnecessario-overlays-inativos/plan.md) |
| **UX** | Upload: Progresso e Erros Efêmeros | [`docs/optimize/ux/ausencia-feedback-progresso-e-degradacao-erros-upload/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ux/ausencia-feedback-progresso-e-degradacao-erros-upload/plan.md) |
| **Performance** | Inchaço Bundle SVG Cartão de Crédito | [`docs/optimize/performance/inchaco-bundle-payload-svg-duplicado/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/performance/inchaco-bundle-payload-svg-duplicado/plan.md) |
| **UX** | Destruição de Contexto: Modais | [`docs/optimize/ux/destruicao-contexto-singleton-global-modais/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ux/destruicao-contexto-singleton-global-modais/plan.md) |
| **UX** | Sequestro de Atalhos Globais (`Ctrl+F`) | [`docs/optimize/ux/sequestro-atalhos-nativos-e-eventos-globais/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/ux/sequestro-atalhos-nativos-e-eventos-globais/plan.md) |
| **Testes/Estabilidade** | Vazamento Timers e Listeners | [`docs/optimize/testes_estabilidade/vazamento_recursos_timers_e_listeners_globais/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/testes_estabilidade/vazamento_recursos_timers_e_listeners_globais/plan.md) |
| **Testes/Estabilidade** | Contratos TypeScript & Emits | [`docs/optimize/testes_estabilidade/violacao_contratos_typescript_emits_e_attrs/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/testes_estabilidade/violacao_contratos_typescript_emits_e_attrs/plan.md) |
| **Testes/Estabilidade** | Lacunas Cobertura de Testes 1:1 | [`docs/optimize/testes_estabilidade/lacunas_cobertura_testes_e_suites_rasas/plan.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/docs/optimize/testes_estabilidade/lacunas_cobertura_testes_e_suites_rasas/plan.md) |

---

## 3. Roteiro de Implementação em 15 Etapas Sequenciais

A execução deve seguir rigorosamente a ordem abaixo para evitar quebras de dependência, regressões e retrabalho. Ao final de cada etapa, o agente deve validar `npm run type-check`, `npm run lint` e `npm test`.

---

### ETAPA 1: Higiene Básica e Infraestrutura do Repositório
- **Planos Abrangidos:** `testes_estabilidade/artefatos_corrompidos_e_poluicao_repositorio/plan.md`
- **Atividades:**
  1. Executar a remoção cirúrgica do arquivo corrompido `src/components/base/-l` utilizando o delimitador POSIX `--`:
     ```bash
     git rm -f -- src/components/base/-l
     ```
  2. Verificar se não há outros arquivos com nomes anômalos no repositório.
- **Validação:** `test ! -e src/components/base/-l` e `git status`.

---

### ETAPA 2: Consolidação Cromática e Tokens do Design System (Dark Mode e Teal Canônico)
- **Planos Abrangidos:** `ui_design/achado_02_adulteracao_cromatica_fallbacks_incoerentes_dark_mode/plan.md`
- **Atividades:**
  1. Atualizar `src/themes/colors.scss`: injetar no bloco `:root.dark, .dark` os tokens semânticos que estavam ausentes (`--surface-border: var(--background-300)`, `--primary-*`, `--text-*`).
  2. Varrer e substituir em todos os SFCs os fallbacks de variáveis CSS de rampa primária que utilizavam azul do Tailwind (`#3b82f6`, `#2563eb`, `#1d4ed8`) pelas cores institucionais Teal Max (`#00768E`, `#005F77`, `#004860`).
  3. Eliminar cores fixas `white` e `#fff` em pseudo-elementos (`MaxDoneIcon.vue`, `MaxErrorIcon.vue`, `MaxLoaderAi.vue`), substituindo por `var(--background-0)`.
- **Validação:** `rg -i '#3b82f6|#2563eb|#1d4ed8' src/components` deve retornar 0 resultados.

---

### ETAPA 3: Saneamento de `params.scss` e Erradicação de Atributos de Estilo nos Templates
- **Planos Abrangidos:** `ui_design/achado_04_atributos_utilitarios_unocss_params_scss_templates/plan.md`
- **Atividades:**
  1. Remover atributos soltos nos templates:
     - `pointer` em `MaxButtonConfirm.vue`, `MaxIconConfirm.vue`, `MaxTogglePopover.vue`, `MaxIconButton.vue` e `MaxUserSection.vue`.
     - `transparent` em `MaxTopToolbar.vue` e `MaxTopToolbarSubmenu.vue` (formalizar prop `transparent?: boolean` e classe `.is-transparent`).
     - `flex` em slots de `MaxInputFile.vue`.
     - `no-padding` em `MaxSideMenuMobile.vue` para `:no-padding="true"`.
  2. Depreciar e limpar regras de seletores baseadas em colchetes em `src/themes/params.scss`.
- **Validação:** `npm run lint` e checagem de templates sem atributos utilitários.

---

### ETAPA 4: Desacoplamento Residual do PrimeVue e Refatoração Estrutural de `InputBase.vue`
- **Planos Abrangidos:**
  - `ui_design/achado_01_acoplamento_residual_classes_primevue_inputbase/plan.md`
  - `usabilidade/desconexao-rotulos-mensagens-inputbase/plan.md` (Parte 1)
  - `ux/truncamento-mensagens-validacao-inconsistente-formularios/plan.md` (Parte 1)
- **Atividades:**
  1. No `src/components/InputBase.vue`:
     - Remover as mais de 40 regras `:deep(.p-*)`, substituindo por seletores semânticos BEM nativos: `:deep(.max-input-native)`, `:deep(.max-select)`, `:deep(input)`, `:deep(textarea)`.
     - Flexibilizar o grid de mensagens para `grid-template-rows: 36px minmax(19px, auto)` e `.message-text { white-space: normal; }`.
     - Criar `src/components/base/inputBaseContext.ts` para prover identificadores e estados (`inputId`, `messageId`, `hasMessage`, `isError`, `isRequired`) via `provide`/`inject`.
     - Exportar essas mesmas propriedades via slot props no `#default="{ inputId, messageId, isError, isRequired }"`.
     - Corrigir o clique no label: remover `pointer-events: none` em `.max-input-label` e adicionar `cursor: pointer`.
  2. Em `MaxButton.vue`: eliminar injeção dinâmica de classes `.p-button-*` e seletores residuais.
- **Validação:** Testes unitários do `InputBase` e `MaxButton` passando; ausência de `.p-*` no `InputBase.vue`.

---

### ETAPA 5: Adoção Universal do Contrato de Acessibilidade nos Componentes de Formulário
- **Planos Abrangidos:** `usabilidade/desconexao-rotulos-mensagens-inputbase/plan.md` (Parte 2)
- **Atividades:**
  1. Refatorar os componentes de formulário para consumir o contexto ou slot props do `InputBase`:
     - `MaxInputText.vue`, `MaxInputNumber.vue`, `MaxInputTextArea.vue`, `MaxInputCep.vue`, `MaxInputCpfCnpj.vue`, `MaxInputDatePicker.vue`, `MaxInputCreditCard.vue`, `MaxInputCreditCardDate.vue`, `MaxInputCreditCardCvv.vue`, `MaxInputPhone.vue`, `MaxInputSearch.vue`, `MaxInputSelect.vue`, `MaxTagSelect.vue`.
  2. Vincular nos `<input>`/`<textarea>` nativos:
     - `:id="inputId"`
     - `:aria-describedby="hasMessage ? messageId : undefined"`
     - `:aria-invalid="isError"`
     - `:aria-required="isRequired"`
- **Validação:** Clicar no label foca o input; inspecionar no DOM o match de `label[for]` com `input[id]`.

---

### ETAPA 6: Ciclo de Vida de Validação de Formulários e Programação Defensiva
- **Planos Abrangidos:**
  - `ux/truncamento-mensagens-validacao-inconsistente-formularios/plan.md` (Parte 2)
  - `testes_estabilidade/fragilidade_props_falta_defensividade/plan.md`
- **Atividades:**
  1. Em `MaxInputCpfCnpj.vue`: condicionar o erro de obrigatoriedade a `hasBeenTouched.value === true`.
  2. Em `MaxInputCep.vue`: remover a trava inalcançável `if (!caution.value) return null`, permitindo a exibição do erro obrigatório no blur.
  3. No `InputBase.vue`: emitir fallback textual amigável ("Valor inválido") quando `done === false` sem mensagem explícita.
  4. Programação defensiva em props:
     - `MaxBadgeButtonsGroup.vue`: adicionar `Array.isArray(props.items) ? props.items : []` antes de `.filter()` e `.find()`.
     - `MaxInputTypeAddress.vue`: verificar `typeof street.value === 'string'` antes de invocar `.split(' ')`.
     - `MaxUserAvatar.vue`: verificar `typeof props.name === 'string'` antes de invocar `.trim()`.
     - `MaxTable.vue` e `MaxTableFields.vue`: garantir `Array.isArray(props.columns)` e `Array.isArray(props.data)`.
     - `MaxChips.vue`: garantir tratamento defensivo para strings e arrays nulos.
- **Validação:** Testes unitários alimentando props com `null` sem lançamento de exceção (*zero White Screen of Death*).

---

### ETAPA 7: Primitiva Unificada de Overlays (`MaxBaseOverlay`) e Eliminação de Dead Clicks e Flickering
- **Planos Abrangidos:**
  - `ui_design/achado_03_violacao_estilos_inline_ausencia_primitiva_overlay/plan.md`
  - `ux/dead-clicks-flickering-posicionamento-overlays/plan.md`
  - `performance/reatividade-posicionamento-desnecessario-overlays-inativos/plan.md`
- **Atividades:**
  1. Refatorar `src/components/base/MaxBaseOverlay.vue` e criar o composable `src/composables/useFloatingPosition.ts`:
     - Adotar padrão *Click-Outside Pass-Through*: eliminar backdrops invisíveis de tela inteira (`position: fixed; inset: 0`) que consumiam o 1º clique do usuário.
     - Fechar via ouvinte passivo de `pointerdown` no `document` fora do contêiner.
     - Posicionamento inteligente com medição prévia e flip vertical para evitar pulos (*flickering*).
     - Ativação condicional de listeners: monitorar `scroll`/`resize` **apenas quando o painel estiver aberto** (`isOpen === true`), liberando a thread em painéis fechados.
  2. Migrar os seletores artesanais para utilizarem `MaxBaseOverlay.vue`:
     - `MaxInputSelect.vue`, `MaxTagSelect.vue`, `MaxInputDatePicker.vue`, `MaxInputPhone.vue`, `MaxInputAutoComplete.vue`, `MaxInputAutoCompleteApi.vue`, `MaxPopover.vue`, `MaxPopoverMenu.vue`, `MaxUserSection.vue`.
  3. Em `MaxPopoverConfirm.vue`: receber referência de elemento alvo (`target?: HTMLElement`) e acompanhar o scroll da tela dinamicamente.
  4. Unificar a escala de Z-Index:
     - `--z-dropdown: 1000; --z-modal: 1200; --z-popover: 1300; --z-tooltip: 1400; --z-toast: 1500;`.
  5. Eliminar estilos inline estáticos: `style="display: none;"` em `MaxInputFile.vue` e `MaxInputFileUpload.vue`.
- **Validação:** Zero dead clicks ao alternar entre campos abertos; rolagem da tela sem listeners desnecessários com painéis fechados.

---

### ETAPA 8: Foco Visível Canônico e Confinamento de Foco (Focus Trap)
- **Planos Abrangidos:**
  - `usabilidade/supressao-outline-fragmentacao-foco-visivel/plan.md`
  - `usabilidade/ausencia-focus-trap-overlays-flutuantes/plan.md`
- **Atividades:**
  1. Em `src/themes/params.scss`: substituir `[noborder] { outline: none !important; }` pelo padrão acessível:
     ```scss
     [noborder] {
         border: none !important;
         &:focus:not(:focus-visible) { outline: none !important; }
         &:focus-visible { outline: var(--max-focus-outline) !important; box-shadow: var(--max-focus-ring) !important; }
     }
     ```
  2. Implementar `:focus-visible` canônico consumindo `var(--max-focus-ring)` em:
     - `MaxListBox.vue` (`.max-listbox-list`)
     - `MaxAccordionItem.vue` (`.max-accordion-item-header`)
     - `MaxTab.vue` (`.max-tab`)
     - `MaxInputCodeToolbar.vue` e `MaxInputMarkdownToolbar.vue`
     - `MaxTable.vue` (células e cabeçalhos ordenáveis)
  3. Expandir `src/helpers/useFocusTrap.ts` para suportar seleção de elemento inicial e restauração do disparador.
  4. Integrar focus trap e restauração de foco em:
     - `MaxInputDatePicker.vue`: atalho `ArrowDown` no input transfere foco para o grid do calendário; `Escape` fecha e restaura foco no input.
     - `MaxInputIconPicker.vue`: ao abrir o drawer, focar automaticamente o campo de busca de ícones; ao fechar, restaurar o foco no botão de disparo.
- **Validação:** Navegação completa por teclado via tecla Tab revelando o anel de foco em todos os componentes; foco não vaza para fora de overlays/drawers abertos.

---

### ETAPA 9: Padrões de Teclado Avançados e Semântica WAI-ARIA
- **Planos Abrangidos:**
  - `usabilidade/ausencia-roving-tabindex-toolbars-acordeoes/plan.md`
  - `usabilidade/controles-interativos-aninhados-semantica-aria/plan.md`
- **Atividades:**
  1. Implementar WAI-ARIA Toolbar com *Roving Tabindex* em `MaxInputCodeToolbar.vue` e `MaxInputMarkdownToolbar.vue`:
     - Apenas 1 tab stop por barra; navegação interna entre ferramentas via `ArrowLeft`, `ArrowRight`, `Home` e `End`.
     - Adicionar `:aria-pressed="isFormatActive"` nos botões de alternância da toolbar de markdown.
  2. Em `MaxAccordion.vue` e `MaxAccordionItem.vue`: navegação contínua entre seções com `ArrowDown` e `ArrowUp`.
  3. Em `MaxChips.vue`: permitir navegar para chips já inseridos com `ArrowLeft` no campo vazio, e deletar com `Backspace` ou `Delete`.
  4. Eliminar controles interativos aninhados (*Nested Interactive Controls*):
     - `MaxPopoverMenu.vue`: remover `role="button"` e `tabindex="0"` da div intermediária `.botao`, delegando a interatividade ao `<MaxButton>` interno.
     - `MaxUserSection.vue`: separar o container de usuário do botão interno de impersonação como botões irmãos no DOM.
  5. Em `MaxTable.vue`: adicionar `tabindex="0"`, `aria-sort="ascending" | "descending" | "none"` e manipuladores `@keydown.enter` e `@keydown.space` nos cabeçalhos ordenáveis `<th>`.
- **Validação:** Leitores de tela anunciam ordenação da tabela; ferramentas de acessibilidade acusam zero erros de botões aninhados.

---

### ETAPA 10: Otimização de Performance e Virtualização de Coleções Volumosas
- **Planos Abrangidos:** `performance/falta-virtualizacao-colecoes-grandes/plan.md`
- **Atividades:**
  1. Em `MaxInputIconPicker.vue`:
     - Integrar [`useVirtualList`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useVirtualList.ts) no drawer de ícones.
     - Montar no DOM apenas as ~15 linhas visíveis na viewport (≤ 120 nós DOM em vez de 5.000 botões simultâneos).
  2. Em `MaxInputSelect.vue`:
     - Eliminar o array reativo `optionRefs.value[index] = el` e callbacks inline `:ref="setOptionRef"`.
     - Implementar navegação de foco por índice numérico e rolagem matemática baseada em `itemHeight * highlightedIndex`.
- **Validação:** Abertura instantânea do drawer de ícones sem travamentos de thread principal (*Long Tasks < 50ms*).

---

### ETAPA 11: Módulo de Upload Resiliente e Otimização do Bundle de Cartão
- **Planos Abrangidos:**
  - `ux/ausencia-feedback-progresso-e-degradacao-erros-upload/plan.md`
  - `performance/inchaco-bundle-payload-svg-duplicado/plan.md`
- **Atividades:**
  1. No módulo de upload (`MaxInputFileUpload.vue`, `MaxInputFileUploadBig.vue`):
     - Adicionar manipulador `xhr.upload.onprogress` emitindo percentual real (0% a 100%) e barra de progresso visual.
     - Extinguir o timer de 3 segundos que deletava arquivos e escondia erros (`files.value = []`). O erro deve permanecer visível com botão de repetição (*retry*).
  2. Em `MaxInputFileProject.vue`: descomentar e implementar a lógica real do manipulador `onDrop(files)`.
  3. Desacoplar animações Lottie externas em `MaxInputFileUploadBig.vue`, utilizando SVGs nativos.
  4. Em `src/assets/credit-card/`:
     - Excluir arquivos idênticos duplicados: `card-american-express.svg`, `card-diners-club.svg` e `card-hiper.svg`.
     - Substituir o arquivo raster anômalo de 82KB `card-jcb.svg` pelo vetor SVG limpo de ~2KB.
     - Em `MaxCreditCard.vue`: mapear os aliases para os mesmos arquivos importados.
- **Validação:** Economia direta de mais de 100KB no bundle; uploads com barra de progresso real e dropzone funcionando.

---

### ETAPA 12: Arquitetura de Modais em Pilha (Modal Stack), v-model:visible e Atalhos Globais
- **Planos Abrangidos:**
  - `ux/destruicao-contexto-singleton-global-modais/plan.md`
  - `ux/sequestro-atalhos-nativos-e-eventos-globais/plan.md`
  - `testes_estabilidade/vazamento_recursos_timers_e_listeners_globais/plan.md` (Parte 1)
- **Atividades:**
  1. Refatorar `src/stores/useModal.Store.ts`:
     - Adicionar `stack: Ref<string[]> = ref([])`.
     - Métodos `push(id)`, `pop()`, `remove(id)`. Manter `show_id` computado apontando para o topo da pilha para total retrocompatibilidade.
  2. Refatorar `MaxModal.vue`:
     - Suportar controle local via `v-model:visible` e prop `:visible="boolean"`.
     - Manter o modal pai montado em background quando um modal filho for aberto por cima.
     - Substituir temporizadores artificiais por `<Transition name="max-modal-fade">`.
     - Apenas o modal no topo da pilha (`isTop`) responde à tecla `Escape`.
  3. Em `MaxTopMenuSearchBar.vue`:
     - **Remover o bloqueio incondicional de `Ctrl+F` / `Cmd+F`!**
     - Adicionar prop `shortcut` (default: `'mod+k'`) para acionamento via `Ctrl+K` / `Cmd+K` com badge visual `<kbd>`.
  4. Em `MaxInputPhone.vue`: substituir `useMagicKeys()` por manipulador nativo `@paste`.
  5. Em `MaxInputFile.vue`: escutar o evento `paste` apenas no elemento local em foco, nunca no `window`.
  6. Em `src/helpers/useScrollLock.ts`: substituir contador por coleção de tokens em `Set<string>` com limpeza automática em `onScopeDispose`.
- **Validação:** Abertura de modal secundário não apaga o formulário do modal primário; `Ctrl+F` nativo do navegador funcionando normalmente.

---

### ETAPA 13: Endurecimento de Contratos TypeScript e Eliminação de Emits Legados
- **Planos Abrangidos:** `testes_estabilidade/violacao_contratos_typescript_emits_e_attrs/plan.md`
- **Atividades:**
  1. Migrar a sintaxe legada `defineEmits(['...'])` para a tipagem genérica canônica `defineEmits<{ ... }>()` em:
     - `MaxInputTypeAddress.vue`, `MaxMaps.vue`, `MaxInputFileUploadButton.vue`, `MaxInputCheckbox.vue`.
  2. Formalizar interfaces de `defineProps` em componentes que faziam bypass via `useAttrs()`:
     - `MaxEmptyDiv.vue` (propriedades `icon`, `iconSize`, `label`).
     - `MaxLoader.vue`: formalizar `defineProps<{ show?: boolean }>()` com coerção adequada e **importar explicitamente `MaxLoaderIcon` no script** (resolvendo componente órfão).
     - `MaxGridCols.vue` e `MaxPageContent.vue`.
  3. Em `MaxTopToolbarSubmenu.vue`: tipar formalmente `items: MaxTopToolbarSubmenuItem[]` e eliminar classes residuais `p-menubar-*`.
- **Validação:** `npm run type-check` (vue-tsc) executando com zero erros de compilação.

---

### ETAPA 14: Implementação Funcional de `MaxAnimateFade` e Cobertura de Testes 1:1
- **Planos Abrangidos:** `testes_estabilidade/lacunas_cobertura_testes_e_suites_rasas/plan.md`
- **Atividades:**
  1. Em `src/components/MaxAnimateFade.vue`:
     - Implementar o componente funcionalmente utilizando `<Transition name="max-animate-fade">` com props `:show`, `:duration` e estilos SCSS encapsulados (deixando de ser uma casca inerte).
  2. Criar **16 novos arquivos de testes unitários dedicados 1:1** em `tests/components/`:
     - `MaxAnimateFade.test.ts`
     - `MaxDoneIcon.test.ts`
     - `MaxEmptyDiv.test.ts`
     - `MaxErrorIcon.test.ts`
     - `MaxGrid.test.ts`
     - `MaxGridCols.test.ts`
     - `MaxLink.test.ts`
     - `MaxLoader.test.ts`
     - `MaxLoaderIcon.test.ts`
     - `MaxPageContent.test.ts`
     - `MaxTab.test.ts` (testar injeção de contexto e WAI-ARIA)
     - `MaxTopToolbarSubmenu.test.ts` (testar recursão e eventos de abertura/fechamento)
     - `MaxTransitionFadeLight.test.ts`
     - `MaxTransitionUp.test.ts`
     - `MaxWaitIcon.test.ts`
     - `TransitionFade.test.ts`
  3. Limpar as suítes agregadoras antigas (`DisplayAndTransitions.test.ts`, `IconsAndLoaders.test.ts`, `LayoutComponents.test.ts`), migrando testes específicos para as suítes 1:1.
- **Validação:** `npm test` executando e passando em todos os 16 novos arquivos com asserções reais de comportamento e classes de animação.

---

### ETAPA 15: Verificação Global de Integridade, Não-Regressão e QA Automatizado
- **Atividades:**
  1. Executar a suíte completa de testes:
     ```bash
     npm test
     ```
  2. Executar a checagem de tipos estrita do TypeScript:
     ```bash
     npm run type-check
     ```
  3. Executar o linter de código e estilo:
     ```bash
     npm run lint
     ```
  4. Executar o build completo da biblioteca para garantir empacotamento sem falhas:
     ```bash
     npm run build
     ```
  5. Validar varredura de integridade:
     - Nenhuma ocorrência de classes `.p-*` remanescentes em `src/components/`.
     - Nenhuma ocorrência de cores Tailwind hardcoded (`#3b82f6`, `#2563eb`).
     - Nenhum estilo estático inline em templates.
     - Nenhum memory leak ou ouvinte global sem cleanup.
- **Critério de Conclusão:** 100% dos testes passando, zero erros de linter, zero erros de tipagem e build concluído com sucesso.

---

## 4. Instruções de Orquestração com Subagentes para o Agente Executor

Ao iniciar a execução deste manual, o Agente Executor deve adotar a seguinte estratégia de subagentes:

1. **Subagente de Infraestrutura & Estilos (Etapas 1, 2 e 3):**
   - Atribuir a um subagente focado em temas, SCSS e higiene de arquivos.
2. **Subagente de Formulários e Acessibilidade (Etapas 4, 5 e 6):**
   - Atribuir a um subagente especialista em Vue Form Architecture para refatorar `InputBase` e a cadeia de inputs.
3. **Subagente de Overlays, Menus e UX (Etapas 7, 8 e 9):**
   - Atribuir a um subagente especialista em UI Headless e A11y (focus trap, click outside pass-through, roving tabindex).
4. **Subagente de Performance e Componentes Avançados (Etapas 10, 11 e 12):**
   - Atribuir a um subagente focado em virtualização (`useVirtualList`), upload resiliente e Modal Stack.
5. **Subagente de Tipagem e Testes Unitários 1:1 (Etapas 13, 14 e 15):**
   - Atribuir a um subagente encarregado de TypeScript estrito, criação dos 16 arquivos `.test.ts` e homologação final no Vitest.

Após cada bloco de etapas, o Agente Executor deve rodar `npm test` e `npm run type-check` para validar a estabilidade progressiva da worktree.
