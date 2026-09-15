# Relatório de Implementação — IMP-R07 (Bloco R07/F09/E04-04)

## Metadados do Subagente
- **Subagente:** `IMP-R07` (Grupo A de Implementação)
- **ID da Plataforma (Conversation ID):** `e2a73a31-e08b-4bf5-b084-250a2b74d7bd`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário de Início:** `2026-09-15T06:27:09-03:00`
- **Horário de Término:** `2026-09-15T07:13:00-03:00`
- **Worktree Isolado:** `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`
- **Status:** CONCLUÍDO COM SUCESSO

---

## 1. Escopo e Objetivos do Bloco R07

Conforme definido em `docs/optimize-new/instructions_to_implementation_fix4.md` (Etapa 3 - R07) e `docs/optimize-new/instructions_to_implementation_fix3.md` (Etapa 4 - R07):

1. **Centralização Canônica de Foco e Teclas (Escape/Tab):**
   - Centralizar o controle de Escape e Tab no gerenciador canônico de foco/overlay no topo da pilha (`useFocusTrap.ts`).
   - Garantir que apenas a camada ativa no topo da pilha (`topTrap = trapStack[trapStack.length - 1]`) intercepte e responda a Escape e eventos de Tabulação.
2. **Remoção de Listeners e Processamentos Duplicados:**
   - Em `MaxInputIconPicker.vue`: remover listeners manuais redundantes de Escape (`@keydown.esc="closeDrawer"` no backdrop), handlers locais duplicados no drawer (`@keydown="trap.onKeydown"`) e ativações/desativações concorrentes fora do watcher canônico.
   - Em `MaxInputMarkdown.vue`: remover listener manual local `@keydown="onImageModalKeydown"` e a função local `onImageModalKeydown` que interceptava Escape antes do gerenciador de topo.
   - Em `MaxPopover.vue`: remover listener manual de `keydown` registrado diretamente no `document` (`document.addEventListener('keydown', onEscape)`), remover `@keydown="trap.onKeydown"` do template e integrar `onEscape: () => hide()` no `useFocusTrap` canônico.
3. **Cadeia de Foco e Integridade da Pilha (A → B → A → Gatilho Inicial):**
   - Garantir que a abertura em cascata preserve a cadeia de retorno:
     - Gatilho inicial abre Camada A → foco entra em A.
     - Elemento em A abre Camada B → foco entra em B.
     - Escape fecha Camada B → foco e controle retornam com precisão ao elemento em A que abriu B.
     - Escape fecha Camada A → foco e controle retornam ao gatilho inicial.
     - Ao final, zero traps ativos e zero listeners no `document`.
4. **Preservação de Foco em Desmontagens / Unmount Fora de Ordem:**
   - Quando uma camada intermediária/inferior é desmontada ou desativada enquanto uma camada superior continua aberta, o foco **não pode ser roubado** da camada superior.
   - A camada superior herda o alvo de retorno da camada desmontada, garantindo que quando a camada superior eventualmente fechar, o foco retorne com segurança ao gatilho original da cadeia.
5. **Navegação Cíclica Determinística de Tab/Shift+Tab:**
   - Confinamento estrito e cíclico de foco dentro do container modal ativo, respeitando elementos com atributo `inert`, `hidden`, `display: none` ou `visibility: hidden`.
6. **Validação em Browser Real (Chromium):**
   - Provar encadeamento em Chromium real com teclado nativo, Tab, Shift+Tab, Escape, nested stack e unmount.

---

## 2. Arquivos Modificados e Criados

### 2.1. `src/helpers/useFocusTrap.ts` (Modificado)
- **Detecção de `inert`:** Adicionada verificação de `curr.hasAttribute?.('inert')` em `isVisible` para garantir que elementos contidos em ancestrais `inert` nunca recebam foco.
- **Controle Determinístico de Tabulação:** Implementada navegação explícita e cíclica para `Tab` (avanço cíclico) e `Shift+Tab` (recuo cíclico) entre os itens focáveis do container, prevenindo qualquer vazamento de foco para fora do trap.
- **Gestão Resiliente da Pilha de Foco em `deactivate()`:**
  - Se a entrada sendo desativada for o topo da pilha (`isTop`): restaura o foco para `entry.previous` (se conectado); caso o elemento anterior tenha sido desconectado, realiza fallback seguro para o topo remanescente na pilha.
  - Se a entrada sendo desativada **não** for o topo da pilha (ex.: unmount de camada inferior enquanto camada superior está visível): **não rouba o foco** da camada superior e transfere a referência de retorno (`previous`) para a camada superior imediata.
- **Funções de Introspecção da Pilha:** Exportadas `getActiveFocusTrapsCount(): number` e `clearFocusTrapStack(): void` para validação arquitetural e sanitização determinística de testes.

### 2.2. `src/components/MaxInputIconPicker.vue` (Modificado)
- Removido `@keydown.esc="closeDrawer"` do backdrop no template.
- Removido `@keydown="isTop ? trap.onKeydown($event) : undefined"` do elemento do drawer.
- Removidas chamadas redundantes `trap.activate()` de `openDrawer` e `trap.deactivate()` de `closeDrawer`, centralizando o ciclo de vida do trap no `watch(visible)`.

### 2.3. `src/components/MaxInputMarkdown.vue` (Modificado)
- Removido `@keydown="onImageModalKeydown"` do modal lightbox de visualização de imagem.
- Removida a função `onImageModalKeydown`, permitindo que `imageTrap = useFocusTrap(imageModalRef, { onEscape: () => closeImage() })` gerencie Escape e Tab centralizadamente no topo da pilha.

### 2.4. `src/components/MaxPopover.vue` (Modificado)
- Instanciado `useFocusTrap(el, { onEscape: () => hide() })` com callback de escape canônico.
- Removido `@keydown="trap.onKeydown"` do elemento dialog no template.
- Removida a função local `onEscape`.
- Removidos os listeners manuais `document.addEventListener('keydown', onEscape)` e `document.removeEventListener('keydown', onEscape)` do `watch(isOpen)` e do `onBeforeUnmount`, eliminando listeners órfãos e concorrência no documento.

### 2.5. `tests/helpers/useFocusTrap.test.ts` (Novo)
- Suíte completa com 9 testes comportamentais:
  1. Move o foco para o primeiro elemento focável ao ativar.
  2. Foca container com `tabindex="-1"` se não houver elementos focáveis.
  3. Ignora elementos ocultos por `hidden`, `display: none`, `visibility: hidden`, `aria-hidden="true"` e `inert`.
  4. Tab e Shift+Tab confinam o foco ciclicamente dentro do container.
  5. Tab com foco fora do container resgata o foco para dentro do trap.
  6. Escape dispara apenas no topo da pilha (`topmost trap`), sem afetar camadas inferiores.
  7. Cadeia encadeada de foco A → B → A → gatilho inicial restaura cada nível com precisão.
  8. Unmount de camada inferior enquanto camada superior está aberta preserva o foco do topo e redireciona retorno para o gatilho.
  9. Fallback seguro quando o elemento anterior foi desconectado do DOM.

### 2.6. `tests/browser/MaxFocusStack.browser.ts` (Novo)
- Suíte executada em **Chromium real** via `@vitest/browser-playwright`:
  1. Cadeia completa A → B → A → gatilho inicial com componentes reais (`MaxPopover` contendo botões e abertura de Camada B), navegando via teclas de teclado reais (`Enter`, `Tab`, `Shift+Tab`, `Escape`), provando que cada camada retém o foco e restaura exatamente ao controle de origem.
  2. Desmontagem (unmount) de camada intermediária enquanto camada superior está aberta, comprovando ausência de roubo de foco, conservação da herança do gatilho e encerramento com contagem zero de traps e listeners residuais.

---

## 3. Comandos Executados e Evidências de Validação

### 3.1. Testes Unitários e Comportamentais dos Componentes Focais
```bash
npx vitest run tests/helpers/useFocusTrap.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts tests/components/MaxPopover.test.ts
```
**Resultado:**
```
 ✓ tests/helpers/useFocusTrap.test.ts (9 tests) 28ms
 ✓ tests/components/MaxInputMarkdown.test.ts (28 tests) 147ms
 ✓ tests/components/MaxPopover.test.ts (24 tests) 160ms
 ✓ tests/components/MaxInputIconPicker.test.ts (11 tests) 2559ms

 Test Files  4 passed (4)
      Tests  72 passed (72)
   Duration  4.06s
```

### 3.2. Testes em Navegador Real (Chromium)
```bash
npm run test:browser
```
**Resultado:**
```
 ✓ |chromium| tests/browser/MaxTableFields.browser.ts (4 tests) 243ms
 ✓ |chromium| tests/browser/MaxFocusStack.browser.ts (2 tests) 269ms
 ✓ |chromium| tests/browser/MaxToast.browser.ts (5 tests) 296ms
 ✓ |chromium| tests/browser/MaxInputTextList.browser.ts (1 test) 435ms

 Test Files  5 passed (5)
      Tests  13 passed (13)
   Duration  3.48s
```

### 3.3. Checagem de Tipos TypeScript (`vue-tsc`)
```bash
npm run type-check
```
**Resultado:** Código de saída `0`, sem erros de tipagem no código-fonte.

### 3.4. ESLint e Stylelint
```bash
npx eslint src/helpers/useFocusTrap.ts src/components/MaxInputIconPicker.vue src/components/MaxInputMarkdown.vue src/components/MaxPopover.vue tests/helpers/useFocusTrap.test.ts tests/browser/MaxFocusStack.browser.ts
npx stylelint src/components/MaxInputIconPicker.vue src/components/MaxInputMarkdown.vue src/components/MaxPopover.vue
```
**Resultado:** Código de saída `0`, zero erros e zero warnings de lint e estilo.

---

## 4. Análise de Riscos e Rollback

### Riscos Identificados
- **Comportamento em formulários complexos com overlays aninhados:** A centralização no topo da pilha garante que Escape feche apenas o modal mais recente, prevenindo que diálogos pai fechem acidentalmente junto com popovers filhos.
- **Restauração de foco quando o elemento gatilho é destruído:** Tratado com verificação estrita de `isConnected` e fallback gracioso, evitando erros de tentativa de foco em nós desconectados.

### Plano de Rollback
Caso seja necessário reverter exclusivamente as alterações do Bloco R07:
```bash
git checkout HEAD -- src/helpers/useFocusTrap.ts src/components/MaxInputIconPicker.vue src/components/MaxInputMarkdown.vue src/components/MaxPopover.vue
rm -f tests/helpers/useFocusTrap.test.ts tests/browser/MaxFocusStack.browser.ts
```
Não foram adicionadas dependências de runtime nem alterados esquemas de dados.
