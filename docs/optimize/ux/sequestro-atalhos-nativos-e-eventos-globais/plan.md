# Plano de Implementação: Eliminação de Sequestro de Atalhos Nativos e Isolamento de Eventos Globais

## 1. Objetivo da Refatoração

Eliminar completamente o sequestro agressivo de atalhos nativos do navegador (`Ctrl+F` / `Cmd+F`) e o vazamento de ouvintes globais em `window`/`document` sem escopo. A refatoração reestabelece a ergonomia e acessibilidade da web (W3C UAAG), adota o atalho canônico de dashboards modernos (`Ctrl+K` / `Cmd+K` configurável), garante compatibilidade multiplataforma (macOS, Windows, Linux) e por mouse em inputs de telefone, e isola a escuta de eventos de colagem (`paste`) estritamente aos contêineres de upload ativos.

---

## 2. Arquivos Afetados

| Arquivo | Papel na Refatoração |
|---|---|
| [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue) | Substituição de `Ctrl+F` por `Ctrl+K` / `Cmd+K`, inclusão de props de atalho e badge `<kbd>`, escopo de eventos. |
| [`src/components/MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue) | Eliminação de `useMagicKeys()` (`ctrl+v`), adoção de manipulador nativo `@paste` agnóstico a SO e mouse. |
| [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue) | Remoção de `useEventListener(window, 'paste')`, contenção do evento de colagem ao elemento contêiner focado. |
| [`tests/components/MaxTopMenuSearchBar.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTopMenuSearchBar.test.ts) | Testes unitários para atalho `Ctrl+K`/`Cmd+K`, não-interceptação de `Ctrl+F`, e prop `shortcut`. |
| [`tests/components/MaxInputPhone.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputPhone.test.ts) | Testes de colagem via evento `paste` com dados de clipboard simulados (Cmd+V / mouse paste). |
| [`tests/components/MaxInputFile.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputFile.test.ts) | Testes de colagem em container focado vs colagem externa ignorada. |

---

## 3. Passo a Passo Detalhado da Implementação

### 3.1. `MaxTopMenuSearchBar.vue`: Migração de Atalho e Desbloqueio do `Ctrl+F`

1. **Adicionar Novas Props**:
   - `shortcut?: boolean | string` (default: `'mod+k'`): Permite customizar a combinação ou desativar completamente com `:shortcut="false"`.
   - `showShortcutBadge?: boolean` (default: `true`): Exibe a affordance visual discreta no campo de pesquisa em desktop.
2. **Remover Sequestro de `Ctrl+F` / `Cmd+F`**:
   - Eliminar `keys['Control+F']` e `whenever(isCtrlF, ...)`.
   - Eliminar `if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault()` em `handleSearchKeydown`. O navegador volta a responder com sua busca in-page nativa.
3. **Implementar Ouvinte Inteligente para `Ctrl+K` / `Cmd+K`**:
   - Criar detector multiplataforma para a tecla modificadora `mod`:
     ```ts
     const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
     const shortcutLabel = computed(() => isMac ? '⌘K' : 'Ctrl+K');
     ```
   - No listener de teclado global:
     - Validar se `props.shortcut === false` (se desabilitado, retornar imediatamente).
     - Verificar se o atalho acionado corresponde ao padrão `mod+k`:
       ```ts
       const isMod = isMac ? event.metaKey : event.ctrlKey;
       if (isMod && event.key.toLowerCase() === 'k') {
           // Não intercepta se o usuário já estiver digitando em outro input/textarea editável,
           // a menos que seja especificamente o próprio campo de busca
           event.preventDefault();
           if (isMobile.value) openSearch();
           else input_search_ref.value?.setFocus?.();
       }
       ```
4. **Affordance Visual (`<kbd class="search-shortcut-badge">`)**:
   - Inserir slot ou elemento `<kbd>` no slot default/direito de `MaxInputText` no modo desktop:
     ```html
     <template #default>
         <kbd v-if="props.showShortcutBadge && props.shortcut !== false" class="search-shortcut-badge">
             {{ shortcutLabel }}
         </kbd>
     </template>
     ```
   - Estilização semântica SCSS:
     ```scss
     .search-shortcut-badge {
         display: inline-flex;
         align-items: center;
         justify-content: center;
         padding: 0.125rem 0.375rem;
         font-family: inherit;
         font-size: 0.6875rem;
         font-weight: 600;
         color: var(--background-600);
         background: var(--background-100);
         border: 1px solid var(--background-300);
         border-radius: 4px;
         pointer-events: none;
         user-select: none;
     }
     ```

### 3.2. `MaxInputPhone.vue`: Desacoplamento de Plataforma e Colagem Universal

1. **Eliminar `useMagicKeys()` para `ctrl` e `v`**:
   - Remover as linhas `const { ctrl, v } = useMagicKeys()` e `watch(() => [ctrl.value, v.value], ...)`.
2. **Implementar Manipulador Nativo `@paste="handlePaste"`**:
   - Adicionar o listener `@paste="handlePaste"` diretamente no elemento `<input>` interno (ou repassar via slot de `InputBase`).
   - Lógica do método `handlePaste`:
     ```ts
     const handlePaste = (event: ClipboardEvent) => {
         const pastedText = event.clipboardData?.getData('text') ?? '';
         if (!pastedText) return;

         event.preventDefault();
         const cleanDigits = pastedText.replace(/\D/g, '');
         if (!cleanDigits) return;

         // Ativa temporariamente noMask para permitir atribuição limpa dos dígitos
         noMask.value = true;

         // Trata DDI internacional ou formatação nacional
         let resolvedPhone = cleanDigits;
         for (let i = 3; i >= 1; i--) {
             const ddiCandidate = parseInt(cleanDigits.substring(0, i));
             const found = country_ddi_flags.find((f) => f.ddi === ddiCandidate);
             if (found) {
                 country.value = found;
                 resolvedPhone = cleanDigits.substring(i);
                 break;
             }
         }

         if (resolvedPhone.startsWith('0')) resolvedPhone = resolvedPhone.substring(1);
         phone.value = resolvedPhone;
     };
     ```
3. **Garantir Suporte a Mouse e Atalhos de Qualquer Sistema Operacional**:
   - O evento `ClipboardEvent` é disparado uniformemente por `Cmd+V`, `Ctrl+V`, `Shift+Insert` e "Botão Direito -> Colar", sem depender de estados voláteis de polling de teclado.

### 3.3. `MaxInputFile.vue`: Confinamento de Escopo e Foco em Colagem

1. **Remover Ouvinte em `window`**:
   - Deletar `useEventListener(window, 'paste', handlePaste)`.
2. **Vincular Colagem ao Contêiner do Componente**:
   - Adicionar `tabindex="0"` no elemento contêiner `dropZoneRef` para permitir foco acessível via teclado.
   - Registrar ouvinte restrito ao contêiner:
     ```ts
     useEventListener(dropZoneRef, 'paste', handlePaste);
     ```
   - Ou, caso deseje suportar colagem quando o documento tiver o componente focado:
     ```ts
     const handlePaste = (event: ClipboardEvent) => {
         // Se o evento originou em outro input, textarea ou editor contenteditable fora deste componente, ignora
         const activeEl = document.activeElement;
         const isSelfFocused = dropZoneRef.value?.contains(activeEl) || dropZoneRef.value === activeEl;
         if (!isSelfFocused) return;

         // Extrai arquivos da área de transferência...
         // Só executa event.preventDefault() se arquivos válidos forem encontrados
     };
     ```
3. **Prevenção de Colisão Multi-instância**:
   - Quando duas ou mais instâncias de `MaxInputFile` estiverem na mesma tela (ex.: "Frente" e "Verso"), apenas a instância que possuir o foco atual ou clique prévio recebe o arquivo colado.

---

## 4. Regras de Usabilidade e Padrões do GEMINI.md

1. **Respeito aos Atalhos Nativos do Agente de Usuário**:
   - Proibição terminante de chamar `event.preventDefault()` em `Ctrl+F` ou `Cmd+F`.
   - Adoção de convenções universais de design system (`Ctrl+K` / `Cmd+K`) com opt-out explícito.
2. **Estilização Canônica no Padrão do Repositório**:
   - Bloco `<style lang="scss" scoped>` aninhado.
   - Uso de variáveis do tema: `--background-100`, `--background-300`, `--background-600`, `--max-primary-500`.
   - Zero classes utilitárias inline ou atributos UnoCSS Attributify no template.
3. **Acessibilidade (a11y)**:
   - O elemento `<kbd>` comunica a tecla de atalho de forma semântica para leitores de tela e tecnologias assistivas.
   - Contêineres de dropzone que recebem colagem contam com `tabindex="0"` e indicador visual discreto de `:focus-visible`.

---

## 5. Critérios de Aceite e Testes Vitest Necessários

### Critérios de Aceite
- [ ] Pressionar `Ctrl+F` ou `Cmd+F` em qualquer tela com `MaxTopMenuSearchBar` montado não chama `event.preventDefault()`, permitindo a busca nativa do navegador.
- [ ] Pressionar `Ctrl+K` (Windows/Linux) ou `Cmd+K` (macOS) posiciona o foco no input da barra de busca desktop ou abre o painel mobile.
- [ ] Passar `:shortcut="false"` desativa completamente qualquer captura de atalho de teclado na barra de busca.
- [ ] A tag `<kbd class="search-shortcut-badge">` exibe `Ctrl+K` ou `⌘K` de acordo com a plataforma detectada.
- [ ] Colar número formatado ou com DDI (ex.: `+55 (11) 98765-4321`) em `MaxInputPhone` via `Cmd+V` ou menu de contexto preenche o campo sem truncar dígitos e ajusta o DDI se identificado.
- [ ] Colar uma imagem na área de transferência enquanto o foco estiver em um input de texto comum **não** aciona o `MaxInputFile`.
- [ ] Colar uma imagem com o container do `MaxInputFile` em foco anexa o arquivo corretamente e executa `event.preventDefault()`.

### Bateria de Testes Vitest a Implementar / Atualizar
1. `tests/components/MaxTopMenuSearchBar.test.ts`:
   - `test('nao intercepta nem cancela Ctrl+F/Cmd+F nativo')`
   - `test('foca o input desktop ao disparar evento de teclado Ctrl+K / Cmd+K')`
   - `test('abre painel mobile ao disparar atalho mod+k quando screen="mobile"')`
   - `test('ignora atalhos de teclado quando shortcut=false')`
   - `test('renderiza badge <kbd> correspondente ao SO detectado')`
2. `tests/components/MaxInputPhone.test.ts`:
   - `test('processa colagem de telefone com DDI via evento nativo paste')`
   - `test('mantem digitos completos ao colar via evento paste sem dependencia de useMagicKeys')`
3. `tests/components/MaxInputFile.test.ts`:
   - `test('ignora evento paste disparado quando foco esta em elemento externo')`
   - `test('processa arquivo colado quando foco esta no container dropZone')`

---

## 6. Mitigação de Riscos de Regressão

- **Risco de Quebra em Aplicações Consumidoras que Esperavam `Ctrl+F`**: Os usuários podem ter memorizado `Ctrl+F` para focar a barra de pesquisa do sistema.
  - *Mitigação*: A badge `<kbd>` explicita `Ctrl+K` imediatamente na UI. O atalho é documentado nas release notes como evolução de conformidade de UX.
- **Risco de Falha em Navegadores Antigos sem `event.clipboardData`**:
  - *Mitigação*: Verificação defensiva de nulidade `if (!event.clipboardData) return;` com fallback gracioso para digitação manual.
- **Risco de Perda de Foco em `MaxInputText` ao Renderizar `<kbd>`**:
  - *Mitigação*: `<kbd>` configurado com `pointer-events: none` e `user-select: none`, assegurando que cliques na badge deleguem foco ao `<input>` subjacente.
