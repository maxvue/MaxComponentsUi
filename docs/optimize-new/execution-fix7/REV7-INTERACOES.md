# Relatório de Revisão Adversarial Independente — Lotes 02 e 03 (REV7-INTERACOES)

- **Revisor Adversarial:** `REV7-INTERACOES`
- **Data da Revisão:** 16 de setembro de 2026
- **Status:** **APROVADO NA ÍNTEGRA (100% de conformidade, zero refutações remanescentes)**

---

## 1. Escopo da Revisão Adversarial

Este documento consolida a auditoria técnica, comportamental, arquitetural e de acessibilidade realizada de forma independente pelo agente `REV7-INTERACOES` sobre os Lotes 02 e 03 da campanha de correções Fix 7:

| Lote | Líder | Branch | Commit | Blocos Cobertos | Requisitos Auditados |
|---|---|---|:---:|---|---|
| **Lote 02** (Overlays, Foco e Viewport) | `IMP7-L02` | `fixes/fix7-l02` | `208ff2c0` | `F07`, `R07`, `R09`, `F15` | `F07/E04-02`, `R07/E04-04`, `R09/E04-06`, `R09/E04-07`, `F15/E06-03`, `F15/E08-04` |
| **Lote 03** (Formulários e Semântica Acessível) | `IMP7-L03` | `fixes/fix7-l03` | `ec3045f2` | `R04`, `F14`, `R14` | `R04/E03-02`, `F14/E06-01`, `F14/E06-02`, `R14/E09-01` |

---

## 2. Parecer de Conclusão e Resumo Executivo

Após auditoria estrita do código-fonte, inspeção minuciosa dos commits (`b9ce127a..208ff2c0` e `b9ce127a..ec3045f2`), e execução independente das suítes de testes unitários e de navegador no motor Chromium real (Blink) via Vitest Browser Runner / Playwright:

1. **Lote 02 — APROVADO:** As hipóteses de concorrência em clique duplo, vazamento de listeners, quebra da pilha de foco A → B → A → gatilho, offsets ausentes em zoom de viewport e inconsistências no botão de ícone/tag select foram todas **refutadas empiricamente**.
2. **Lote 03 — APROVADO:** As hipóteses de falha na separação de atributos nas 25 famílias com `InputBase`, violações WCAG de relação estrutural pai-filho no scroller virtual, perda de `aria-activedescendant` durante scroll longo e submissão duplicada no `MaxAuthCard` foram todas **refutadas empiricamente**, comprovadas sob auditoria `axe-core` com zero violações.

---

## 3. Auditoria Detalhada do Lote 02 (Overlays, Foco e Viewport)

### 3.1. Bloco F07 (E04-02): Fechamento Síncrono e Unificação em `useOutsidePointer`
- **Tentativa de Refutação:** Forçar dois eventos síncronos de clique fora ou tecla Escape antes do ciclo reativo `nextTick` para verificar se o overlay inferior fecha prematuramente; verificar retenção indevida de foco em clique-through; verificar comportamento com âncora desconectada e contagem de ouvintes globais.
- **Evidência Comprovada:**
  - `useOutsidePointer.ts` implementa a flag `closing: true` síncrona na entrada do topo da pilha e um guard `hasPendingCloseMicrotask` no despachante unificado. Quando dois cliques ou escapes ocorrem no mesmo ciclo síncrono, apenas a camada superior inicia o fechamento; a camada inferior permanece intacta até que o ciclo reativo consuma a remoção da camada superior.
  - Em clique-through para controles focáveis externos (`button`, `input`), o composable avalia `shouldRestore = lastCloseReason === 'escape' || !isFocusOnExternalControl`, garantindo que o foco permaneça legitimamente no controle externo acionado pelo usuário e não seja roubado de volta para o gatilho original.
  - Se o gatilho/âncora é desconectado do DOM durante scroll ou redimensionamento, a verificação `!trigger.isConnected` aciona o fechamento gracioso do overlay sem erros ou posicionamentos erráticos.
  - A contagem de ouvintes globais foi verificada com `getActiveOutsidePointerListenersCount()`: ao fechar todos os overlays ou desmontar os componentes, todos os ouvintes em `document`, `window` e `window.visualViewport` são rigorosamente desanexados (0 ouvintes órfãos).

### 3.2. Bloco R07 (E04-04): Unificação de Listeners em `MaxPopover` e Encadeamento de Pilha
- **Tentativa de Refutação:** Verificar se `MaxPopover.vue` mantinha listeners manuais concorrentes em `document` competindo com outros overlays; testar regressão no confinamento de foco e na cadeia Escape A → B → A → gatilho para Popover, IconPicker e Markdown no Chromium real.
- **Evidência Comprovada:**
  - Os ouvintes manuais `onDocPointerDown` e `onDocClick` registrados diretamente no `document` foram inteiramente eliminados do SFC `src/components/MaxPopover.vue` e substituídos pelo registro único via `useOutsidePointer`.
  - No motor Chromium real (`tests/browser/MaxFocusStack.browser.ts`), foi comprovada a cadeia completa de três fluxos especializados:
    1. **Popover Aninhado:** Abertura do Popover A → Abertura do Diálogo B → Confinamento Tab cíclico em B → Escape fecha B e restaura foco ao botão em A → Escape fecha A e restaura foco ao gatilho raiz.
    2. **IconPicker:** Abertura do Drawer A → Abertura do Diálogo de Confirmação B → Escape fecha B e restaura foco no botão interno de A → Escape fecha A e restaura foco no gatilho original.
    3. **Markdown:** Abertura do Editor A → Abertura do Diálogo de Inserção de Link B → Escape fecha B e devolve foco ao botão de toolbar em A → Escape fecha A e devolve foco ao gatilho original.
  - A contagem de `getActiveFocusTrapsCount()` oscilou perfeitamente entre 0 → 1 → 2 → 1 → 0 sem desvios.

### 3.3. Bloco R09 (E04-06, E04-07): `visualViewport`, Safe-Area, Clamp e Z-Index Semântico
- **Tentativa de Refutação:** Verificar se o clamp ignorava `visualViewport.offsetLeft` e `offsetTop`; testar se overlays transbordavam em larguras estreitas (280px, 320px) ou orientação horizontal (568x320); verificar se restavam `z-index` literais hardcoded (ex: 9999).
- **Evidência Comprovada:**
  - `src/composables/useActiveOverlayPosition.ts` e `src/components/MaxPopover.vue` incorporam `vvOffsetLeft = vv?.offsetLeft ?? 0` e `vvOffsetTop = vv?.offsetTop ?? 0` nos limites de clamp `minTop`, `maxBottom`, `minLeft` e `maxRight`.
  - Testes unitários comprovaram a retenção exata das coordenadas sob safe-area e offset de visual viewport (`left: 74px`, `top: 98px`).
  - No Chromium real (`tests/browser/layersMobileClamp.browser.ts`):
    - Viewport estreito (280px): Popover respeita o limite físico com `rect.width <= 280` e `rect.left >= 0`.
    - Landscape (568x320): `MaxPopoverConfirm` restringe altura para `<= 320px` e largura para `<= 568px`, mantendo botões acessíveis e scroll interno.
    - Zoom de 200%: integridade de visualização e z-index preservada.
    - Hit-testing (`document.elementFromPoint(150, 150)`): hierarquia de sobreposição respeitada rigorosamente segundo as variáveis CSS semânticas (`--max-z-index-sticky`, `--max-z-index-dropdown`, `--max-z-index-popover`, `--max-z-index-modal`).
  - Em `src/components/MaxTagSelect.vue`, o antigo valor literal `z-index: 9999` foi substituído pelo token canônico `z-index: var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000));`.

### 3.4. Bloco F15 (E06-03, E08-04): Nome Contextual de `MaxIconButton` e `MaxTagSelect isButton`
- **Tentativa de Refutação:** Procurar botões renderizados sem nome acessível ou emitindo `undefined`; verificar no Chromium real se o modo `isButton` de `MaxTagSelect` permitia foco no wrapper, se as teclas Enter e Espaço funcionavam sem atalhos, se havia duplicidade na emissão de eventos e se o estado `disabled` era violado.
- **Evidência Comprovada:**
  - Em `MaxIconButton.vue`, o cálculo de `ariaLabelComputed` cobre exaustivamente rótulos explícitos (`ariaLabel`, `label`, `title`, `tooltip`), dispõe de tabela determinística de fallbacks por ícone ("Fechar", "Expandir opções", "Buscar", "Excluir", "Editar", etc.) e emite alerta em console de desenvolvimento caso nenhum nome seja configurado. Nenhum botão é renderizado com `undefined`.
  - No Chromium real (`tests/browser/MaxTagSelect.browser.ts`):
    - O wrapper `.max-select` recebe `tabindex="-1"` inibindo foco indevido de container.
    - O botão `<button class="max-icon-button">` recebe foco nativo direto com `tabindex="0"`, `aria-haspopup="listbox"` e `aria-expanded="false"`.
    - Teclas `Enter` e `Espaço` acionam confiavelmente a abertura do overlay e atualizam `aria-expanded="true"`.
    - Tecla `Escape` fecha o overlay e restaura o foco ativamente no botão `<button>`.
    - Seleção de opção emite estritamente **uma única vez** `update:modelValue` (`emitUpdateCount === 1`) e `change` (`emitChangeCount === 1`).
    - Estado `disabled=true` configura `disabled`, `aria-disabled="true"`, `tabindex="-1"` e inativa completamente cliques e teclas Enter/Espaço.

---

## 4. Auditoria Detalhada do Lote 03 (Formulários e Semântica Acessível)

### 4.1. Bloco R04 (E03-02): Matriz Chromium de 25 Famílias com `InputBase`
- **Tentativa de Refutação:** Verificar se a matriz cobria menos de 25 famílias ou incluía indevidamente `MaxInputBirthday`; testar se o clique no rótulo não focava o campo; verificar se controles externos com atributo `form` eram ignorados na submissão de `FormData`; testar perda de `autocomplete`, `required` ou `disabled`.
- **Evidência Comprovada:**
  - A matriz em `tests/browser/inputBaseMatrix.browser.ts` valida com rigor as 25 famílias canônicas: `MaxInputText`, `MaxInputTextArea`, `MaxInputNumber`, `MaxInputPhone`, `MaxInputPhoneMail`, `MaxInputDatePicker`, `MaxInputSearch`, `MaxInputCpfCnpj`, `MaxInputCep`, `MaxInputCreditCard`, `MaxInputCreditCardDate`, `MaxInputCreditCardCvv`, `MaxInputCoordinateDecimalLat`, `MaxInputCoordinateDecimalLng`, `MaxInputSelect`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxChips`, `MaxTagSelect`, `MaxColorPicker`, `MaxInputIconPicker`, `MaxInputOTP`, `MaxInputSwitch`, `MaxInputTextList`, `MaxInputToggle`.
  - `MaxInputBirthday` está explicitamente isolado da matriz geral de inputs e possui teste próprio para seus 3 segmentos de botões.
  - Clique real em `<label for="...">` no motor Chromium transfere o foco diretamente para o `<input>` ou `<textarea>` associado.
  - Controles posicionados fisicamente fora da tag `<form>`, mas portando o atributo `form="id-do-form"`, são capturados fielmente na criação do `FormData(form)` nativo.
  - Submissão agregada de múltiplos campos nativos em `FormData` opera perfeitamente.
  - Atributos `autocomplete`, `required` / `aria-required` e `disabled` são propagados diretamente para o elemento interativo nativo.

### 4.2. Bloco F14 (E06-01, E06-02): Contrato de Acessibilidade no Scroller Virtual e ListBox
- **Tentativa de Refutação:** Executar motor `axe-core` procurando falhas de relação estrutural ARIA em `role="listbox"`; testar se a navegação por teclado cobria todas as teclas padrão; verificar se durante scroll longo o `aria-activedescendant` apontava nós destruídos/desmontados do DOM.
- **Evidência Comprovada:**
  - Inclusão de `role="presentation"` na div intermediária do TanStack Virtual em `src/components/base/MaxBaseVirtualScroller.vue`, eliminando a quebra na hierarquia pai-filho entre `listbox` e `option`.
  - `src/components/MaxListBox.vue` recebeu `effectiveListboxLabel` garantindo fallback seguro para evitar widgets anônimos.
  - Criação da suíte `tests/browser/MaxBaseVirtualScroller.browser.ts` no Chromium real:
    - Auditoria automatizada com biblioteca `axe-core`: **0 violações** encontradas no `MaxBaseVirtualScroller` e no `MaxListBox`.
    - Navegação completa por teclado com as teclas `ArrowDown`, `ArrowUp`, `Home`, `End`, `Enter` e `Espaço` com atualização precisa da seleção e foco.
    - **Blindagem em scroll virtual:** Quando o usuário navega para o item 0 e rola bruscamente 2.000px, o nó do item 0 é desmontado pelo TanStack. O scroller detecta a ausência do nó e limpa `aria-activedescendant` para `null`. Ao rolar de volta para o topo, o nó é remontado e `aria-activedescendant` volta a apontá-lo com integridade absoluta.

### 4.3. Bloco R14 (E09-01): Submissão Nativa Única em `MaxAuthCard`
- **Tentativa de Refutação:** Verificar se o botão de submit continuava invocando handlers duplicados simultaneamente pelo click do botão e submit do form; verificar se restava a flag paliativa `isHandlingSubmitInTick`; testar suporte a Enter e autofill.
- **Evidência Comprovada:**
  - Remoção completa de `:action="onSubmit"` e `:action="handleDynamicSubmit"` nas instâncias de `MaxButton` com `type="submit"` em `src/components/MaxAuthCard.vue`.
  - Eliminação definitiva da flag paliativa de coalescência `isHandlingSubmitInTick`.
  - A submissão é tratada exclusivamente pelo evento nativo `@submit.prevent="handleFormSubmit"` da tag `<form>`, suportando nativamente a tecla Enter, autofill de credenciais e disparo único do evento `submit` com a carga de dados.
  - Mantida live region assertiva única (`role="alert"`, `aria-live="assertive"`) para comunicação de erros em leitores de tela.
  - Mantida exposição programática `onSubmit: handleFormSubmit` no `defineExpose` para retrocompatibilidade.

---

## 5. Auditoria de Higiene do Git Diff (BASE_SHA `b9ce127a`)

Uma auditoria textual e estrutural sobre `b9ce127a..208ff2c0` (L02) e `b9ce127a..ec3045f2` (L03) confirmou:
- **Zero** instâncias de `.skip()`, `.todo()`, `.only()`, `fit()` ou `fdescribe()`.
- **Zero** mocks proibidos ou simulações artificiais de browser.
- **Zero** `setTimeout` ou dilatações artificiais de timeout para mascarar instabilidades assíncronas.
- **Zero** asserções tautológicas (todas as asserções validam elementos reais do DOM, estados do Pinia, emissões de eventos ou códigos de retorno).

---

## 6. Resultados das Suítes de Teste Independentes

### 6.1. Testes do Lote 02 (Executados em `wt-fix7-l02`)

```bash
# 1. Testes Unitários Direcionados (11 arquivos)
npx vitest run tests/helpers/useOutsidePointer.test.ts tests/helpers/useFocusTrap.test.ts tests/composables/useActiveOverlayPosition.test.ts tests/components/base/MaxBaseOverlay.test.ts tests/components/modalSpecializedStack.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputSelectOverlay.test.ts tests/components/MaxIconButton.test.ts tests/unit/MaxIconButton.spec.ts tests/components/MaxTagSelect.test.ts tests/unit/MaxTagSelect.spec.ts
# Resultado: 11 passed (11 files), 208 passed (208 tests) — Exit Code 0

# 2. Testes em Motor Chromium Real (4 arquivos)
npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts tests/browser/layersMobileClamp.browser.ts tests/browser/MaxTagSelect.browser.ts tests/browser/MaxTagSelect.adversarial.browser.ts
# Resultado: 4 passed (4 files), 17 passed (17 tests) — Exit Code 0

# 3. Tipagem e Linter
npm run type-check && npm run lint
# Resultado: vue-tsc (0 erros), eslint + stylelint (0 erros, 0 avisos) — Exit Code 0
```

### 6.2. Testes do Lote 03 (Executados em `wt-fix7-l03`)

```bash
# 1. Testes Unitários Direcionados (7 arquivos)
npx vitest run tests/architecture/inputBaseAccessibility.test.ts tests/components/InputBase.accessibility.test.ts tests/components/inputBaseAttributesSeparation.test.ts tests/components/inputSharedValidationMatrix.test.ts tests/components/MaxListBox.test.ts tests/components/base/MaxBaseVirtualScroller.test.ts tests/components/MaxAuthCard.test.ts
# Resultado: 7 passed (7 files), 324 passed (324 tests) — Exit Code 0

# 2. Testes em Motor Chromium Real (2 arquivos)
npx vitest run --config vitest.browser.config.ts tests/browser/inputBaseMatrix.browser.ts tests/browser/MaxBaseVirtualScroller.browser.ts
# Resultado: 2 passed (2 files), 10 passed (10 tests) — Exit Code 0

# 3. Tipagem e Linter
npm run type-check && npm run lint
# Resultado: vue-tsc (0 erros), eslint + stylelint (0 erros, 0 avisos) — Exit Code 0
```

---

## 7. Conclusão e Recomendação

Os Lotes **02** e **03** atingiram excelência técnica, semântica e operacional, satisfazendo plenamente todas as exigências das diretrizes canônicas, dos critérios de aceitação e dos padrões de acessibilidade WCAG 2.1 AA. 

**Recomendação do Revisor Adversarial:** APROVAÇÃO TOTAL e autorização para continuidade da esteira de integração e merge na orquestração da campanha Fix 7.
