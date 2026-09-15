# Relatório de Refutação Independente — REV-R07 (Bloco R07/F09/E04-04)

## Metadados do Subagente
- **Subagente:** `REV-R07` (Grupo B de Refutação Independente)
- **ID da Plataforma (Conversation ID):** `e1bc7370-91b2-4d5d-b0ef-e63f9a8ddd9f`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário de Início:** `2026-09-15T07:14:58-03:00`
- **Horário de Término:** `2026-09-15T07:27:00-03:00`
- **Worktree Isolado:** `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`
- **Implementador Auditado:** `IMP-R07` (`e2a73a31-e08b-4bf5-b084-250a2b74d7bd`)
- **Veredito Formal:** **ACEITO**

---

## 1. Escopo Auditado e Metodologia Adversarial

A auditoria teve como objetivo testar de forma adversarial os requisitos estipulados para o Bloco R07 em `docs/optimize-new/instructions_to_implementation_fix4.md` e inspecionar o código entregue por `IMP-R07` em:
- `src/helpers/useFocusTrap.ts`
- `src/components/MaxInputIconPicker.vue`
- `src/components/MaxInputMarkdown.vue`
- `src/components/MaxPopover.vue`
- `tests/helpers/useFocusTrap.test.ts`
- `tests/browser/MaxFocusStack.browser.ts`

### Hipóteses de Refutação Investigadas:
1. **Falta de isolamento em pilhas aninhadas profundas (A -> B -> C):** Se um terceiro nível modal for ativado, o Escape poderia acidentalmente fechar mais de uma camada ou acionar handlers de camadas inferiores.
2. **Perda de controle ou foco fantasma em desmontagens fora de ordem:** Se uma camada intermediária `B` for destruída ou desmontada abruptamente enquanto a camada superior `C` estiver em foco, o foco poderia ser roubado ou a herança de retorno para a camada `A` (ou gatilho raiz) poderia quebrar.
3. **Vazamento e persistência de listeners no `document` / `window`:** Após desativações múltiplas ou fora de ordem, poderiam sobrar listeners `keydown` órfãos ouvindo teclas e gerando vazamentos de memória.
4. **Fuga de foco com Tabulação e nós inacessíveis:** Elementos com atributo `inert`, `aria-hidden="true"`, `hidden` ou estilizados com `display: none`/`visibility: hidden` poderiam receber foco durante o ciclo de Tab/Shift+Tab.
5. **Comportamento em Navegador Real (Chromium):** Se a orquestração de foco funciona em ambiente de browser real com dispatch nativo de eventos de teclado.

---

## 2. Testes Adversariais Executados e Evidências

### 2.1. Teste Adversarial 1: Stack Triplo A -> B -> C com Escape Sequencial
- **Cenário:** Raiz da página abre Camada A; Camada A abre Camada B; Camada B abre Camada C. Três instâncias ativas no `trapStack`.
- **Estresse:** Disparos sequenciais da tecla Escape.
- **Resultado Observado:**
  - 1º Escape: Fecha estritamente Camada C (topo). Camadas B e A não recebem o evento. O foco é restaurado com precisão para o botão em B que abriu C. Pilha reduz para 2 traps.
  - 2º Escape: Fecha estritamente Camada B (novo topo). Camada A permanece intacta. O foco retorna ao botão em A que abriu B. Pilha reduz para 1 trap.
  - 3º Escape: Fecha Camada A. O foco retorna ao gatilho raiz da página. Pilha reduz para 0 traps.
- **Status:** Aprovado sem desvios.

### 2.2. Teste Adversarial 2: Desmontagem Fora de Ordem (B intermediário desmontado com C aberto)
- **Cenário:** Camadas A -> B -> C abertas. B é desmontado do DOM (`containerB.remove()` e `trapB.deactivate()`) enquanto C continua aberto e ativo.
- **Estresse:** Verificar se o foco é roubado de C e se C herda a restauração para A quando C for fechado.
- **Resultado Observado:**
  - Durante o unmount de B: o foco **não foi roubado** de C. C permaneceu com foco no elemento folha e topo ativo da pilha (`getActiveFocusTrapsCount() === 2`).
  - Ao desativar C: C detectou que seu elemento gatilho anterior (que pertencia a B) foi desconectado e utilizou a herança configurada na lógica de `deactivate()`, restaurando o foco diretamente para o botão de origem em A (`btn-a-origin`).
  - Ao desativar A: O foco retornou para a raiz (`origin-trigger`), finalizando com 0 traps.
- **Status:** Aprovado.

### 2.3. Teste Adversarial 3: Cadeia de 4 Níveis (A -> B -> C -> D) com Unmount Múltiplo Intermediário
- **Cenário:** Pilha com A, B, C e D. Camadas intermediárias C e B são destruídas sucessivamente.
- **Resultado Observado:** D permaneceu no topo e preservou o foco. Ao fechar D, o foco foi herdado diretamente para a Camada A.
- **Status:** Aprovado.

### 2.4. Teste Adversarial 4: Verificação Estrita de Listeners Globais (Zero Listeners Órfãos)
- **Cenário:** Spies em `document.addEventListener` e `document.removeEventListener` para o evento `'keydown'`.
- **Resultado Observado:**
  - Ao ativar o Trap 1: 1 listener registrado (`document.addEventListener('keydown', onGlobalKeydown, true)`).
  - Ao ativar o Trap 2: Contagem de listeners em `document` permanece em 1 (reaproveitamento do dispatcher global).
  - Ao desativar o Trap 2: Listener global **não** é removido prematuramente, pois o Trap 1 ainda está na pilha.
  - Ao desativar o Trap 1: Listener global é desregistrado exatamente 1 vez (`detachGlobal()`).
  - Total de traps ativos: 0; Total de listeners residuais de keydown: 0.
- **Status:** Aprovado.

### 2.5. Teste Adversarial 5: Isolamento de Tabulação Cíclica contra `inert` e `aria-hidden`
- **Cenário:** Elementos focáveis intercalados com nós contendo `inert`, `aria-hidden="true"`, `hidden` e `display: none`.
- **Resultado Observado:**
  - Ao pressionar Tab no primeiro item visível, os nós dentro de `inert` e `aria-hidden` foram totalmente ignorados pelo seletor e pelo predicado `isVisible`.
  - O foco avançou diretamente para o próximo botão válido e ciclou de volta para o primeiro no final do container.
- **Status:** Aprovado.

### 2.6. Teste Adversarial 6: Confinamento Estrito em Browser Real (Chromium)
- **Comando:**
  ```bash
  npm run test:browser
  ```
- **Resultado:**
  ```
  ✓ |chromium| tests/browser/MaxTableFields.browser.ts (4 tests) 235ms
  ✓ |chromium| tests/browser/MaxFocusStack.browser.ts (2 tests) 268ms
  ✓ |chromium| tests/browser/MaxToast.browser.ts (5 tests) 301ms
  ✓ |chromium| tests/browser/MaxInputTextList.browser.ts (1 test) 419ms

  Test Files  5 passed (5)
       Tests  13 passed (13)
  ```
- **Suíte Unitária do Helper:**
  ```bash
  npx vitest run tests/helpers/useFocusTrap.test.ts
  ```
  ```
  ✓ tests/helpers/useFocusTrap.test.ts (9 tests) 26ms
  Test Files  1 passed (1)
       Tests  9 passed (9)
  ```
- **Componentes Focais:**
  ```bash
  npx vitest run tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts tests/components/MaxPopover.test.ts
  ```
  ```
  Test Files  3 passed (3)
       Tests  63 passed (63)
  ```

---

## 3. Análise da Causa Raiz e Desacoplamento de Handlers Duplicados

A auditoria confirmou que todos os processamentos duplicados foram removidos das fontes indicadas:
1. **`MaxInputIconPicker.vue`:**
   - O listener duplicado `@keydown.esc="closeDrawer"` no backdrop foi removido.
   - O handler `@keydown="isTop ? trap.onKeydown($event) : undefined"` no drawer foi removido.
   - As chamadas manuais `trap.activate()` / `trap.deactivate()` foram eliminadas, delegando a sincronização exclusivamente ao watcher de `visible`.
2. **`MaxInputMarkdown.vue`:**
   - Removido `@keydown="onImageModalKeydown"` e a função `onImageModalKeydown`.
   - O modal de lightbox de imagem agora delega a interceptação de Escape e Tab ao `imageTrap = useFocusTrap(imageModalRef, { onEscape: () => closeImage() })`.
3. **`MaxPopover.vue`:**
   - Removido `@keydown="trap.onKeydown"` no dialog.
   - Removido o listener manual de documento `document.addEventListener('keydown', onEscape)` e `document.removeEventListener('keydown', onEscape)` de `watch(isOpen)` e `onBeforeUnmount`.
   - Integrado `useFocusTrap(el, { onEscape: () => hide() })`, operando 100% via topo da pilha.

---

## 4. Veredito Final

A implementação do Bloco R07 atende com rigor técnico aos requisitos de centralização canônica de foco, gestão da pilha em overlays aninhados, suporte a desativações fora de ordem sem roubo de foco, e sanitização completa de event listeners globais.

**Veredito:** **ACEITO**
