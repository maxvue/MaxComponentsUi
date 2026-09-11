# Plano de Implementação: Prevenção de Vazamento de Recursos, Timers Órfãos e Listeners Globais

## 1. Objetivo da Refatoração

Eliminar completamente os riscos de vazamento de memória (*memory leaks*), mutações de estado em instâncias de componentes já desmontadas do DOM e sequestro invasivo de eventos do navegador. O objetivo é:
1. Rastrear e cancelar proativamente todos os identificadores de timers assíncronos (`setTimeout`) nos componentes de upload (`MaxInputFileUpload`, `MaxInputFileUploadBig`), abas (`MaxTabItem`), mapas (`MaxMaps`) e notificações (`MaxToast`), vinculando a limpeza ao hook `onBeforeUnmount` ou utilizando composables de ciclo de vida seguro (`useTimeoutFn`).
2. Eliminar o sequestro incondicional do atalho nativo de busca do navegador (`Ctrl+F` / `Cmd+F`) em [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue), restaurando o comportamento web padrão e restringindo a captura de atalhos a ativações intencionais.
3. Refatorar o helper singleton [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts) para operar com tokens de propriedade únicos (`Set<symbol | object>`) e limpeza automática no descarte de escopo do Vue (`onScopeDispose`), prevenindo o congelamento irreversível da rolagem do `body` caso um overlay/modal desmonte com erro ou omita `unlock()`.
4. Blindar a diretiva [`src/directives/tooltip.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/directives/tooltip.ts) contra acúmulo de listeners globais de scroll/resize em re-renderizações ou desmontagens atípicas.

---

## 2. Arquivos Afetados

### Componentes e Helpers Vue:
- [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue) — Rastreamento e cancelamento do timer de erro de 3000ms.
- [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue) — Rastreamento e cancelamento do timer de erro de 3000ms.
- [`src/components/MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTabItem.vue) — Cancelamento de timers assíncronos de montagem (`0ms` e `10ms`) no `onBeforeUnmount`.
- [`src/components/MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue) — Cancelamento do timer de 50ms de `isMounted` no `onBeforeUnmount`.
- [`src/components/MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxToast.vue) — Rastreamento e cancelamento do timer de feedback de cópia de toast (2000ms).
- [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue) — Remoção do `event.preventDefault()` preventivo em `Ctrl+F` global.
- [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts) — Gestão resiliente de locks por conjunto de tokens com autolimpeza em `onScopeDispose`.
- [`src/directives/tooltip.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/directives/tooltip.ts) — Limpeza defensiva e idempotente de timers e listeners.

### Arquivos de Teste:
- [`tests/unit/useScrollLock.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/unit/useScrollLock.test.ts) (ou suíte dedicada de helpers)
- [`tests/components/MaxTopMenuSearchBar.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTopMenuSearchBar.test.ts)
- [`tests/components/MaxInputFileUpload.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputFileUpload.test.ts)

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Ciclo de Vida Seguro nos Componentes de Upload
1. Em [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue):
   - Declarar variável de referência para o timer:
     ```typescript
     let errorTimer: ReturnType<typeof setTimeout> | null = null;
     ```
   - No `watch(showError, (val) => { ... })`:
     - Limpar qualquer agendamento pendente anterior: `if (errorTimer) clearTimeout(errorTimer);`
     - Se `val` for verdadeiro, agendar a limpeza guardando o handle:
       ```typescript
       if (val) {
           errorTimer = setTimeout(() => {
               showError.value = false;
               files.value = [];
               errorTimer = null;
           }, 3000);
       }
       ```
   - Adicionar o hook `onBeforeUnmount`:
     ```typescript
     onBeforeUnmount(() => {
         if (errorTimer) {
             clearTimeout(errorTimer);
             errorTimer = null;
         }
     });
     ```
2. Em [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue):
   - Aplicar a mesma lógica de rastreamento com `let errorTimer: ReturnType<typeof setTimeout> | null = null;` e cancelamento no `onBeforeUnmount`.

### Passo 2: Cancelamento de Timers de Montagem em `MaxTabItem.vue`
1. Em [`src/components/MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTabItem.vue):
   - Declarar variáveis para os timers de inicialização:
     ```typescript
     let initTabIdTimer: ReturnType<typeof setTimeout> | null = null;
     let selectTabTimer: ReturnType<typeof setTimeout> | null = null;
     ```
   - No hook `onMounted`:
     ```typescript
     onMounted(() => {
         is_mounted.value = true;
         initTabIdTimer = setTimeout(() => {
             if (!tab_id.value) tab_id.value = props.value ?? tabs_info.add_count_tabs();
             initTabIdTimer = null;
         }, 0);
         selectTabTimer = setTimeout(() => {
             if (toValue(tabs_info?.active_tab) == 0 || toValue(tabs_info?.active_tab) === '' || toValue(tabs_info?.active_tab) === undefined) {
                 tabs_info?.selectTab(tab_id.value);
             }
             selectTabTimer = null;
         }, 10);
     });
     ```
   - Adicionar `onBeforeUnmount`:
     ```typescript
     onBeforeUnmount(() => {
         if (initTabIdTimer) clearTimeout(initTabIdTimer);
         if (selectTabTimer) clearTimeout(selectTabTimer);
     });
     ```

### Passo 3: Cancelamento de Timer em `MaxMaps.vue` e `MaxToast.vue`
1. Em [`src/components/MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue):
   - Guardar o timer de 50ms em `let mountTimer: ReturnType<typeof setTimeout> | null = null;`.
   - Limpar em `onBeforeUnmount(() => { if (mountTimer) clearTimeout(mountTimer); });`.
2. Em [`src/components/MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxToast.vue):
   - Guardar o timer de reset do `copiedToastId` em `let copyResetTimer: ReturnType<typeof setTimeout> | null = null;`.
   - Limpar no `onBeforeUnmount(() => { if (copyResetTimer) clearTimeout(copyResetTimer); });`.

### Passo 4: Desbloqueio do Atalho Nativo `Ctrl+F` em `MaxTopMenuSearchBar.vue`
1. Em [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue):
   - Remover a interceptação global incondicional `if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();`.
   - Se o objetivo do componente for opcionalmente capturar `Ctrl+F` para focar a barra de busca, condicionar isso a uma propriedade explícita (ex.: `:enableShortcut="true"`) e, quando acionado, **abrir a barra de busca imediatamente** antes de prevenir o evento padrão (`openSearch(); event.preventDefault();`), em vez de neutralizar o evento deixando o usuário sem ação.
   - Preservar o listener de `Escape` para fechar a busca quando esta estiver aberta (`if (event.key === 'Escape' && is_open.value) closeSearch();`).

### Passo 5: Refatoração Resiliente do `useScrollLock.ts`
1. Em [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts):
   - Substituir o contador numérico `lock_count` por um conjunto de instâncias proprietárias:
     ```typescript
     const activeLockOwners = new Set<symbol | object | string>();
     let previous_overflow = '';
     ```
   - Dentro de `useScrollLock(owner?: object | string)`:
     - Gerar um token único para a chamada se não fornecido: `const instanceToken = owner ?? Symbol('scroll-lock-instance');`
     - Rastrear se a instância local possui lock ativo (`let isInstanceLocked = false;`).
     - A função `lock()` deve ser idempotente para a mesma instância:
       ```typescript
       const lock = () => {
           if (typeof document === 'undefined') return;
           if (isInstanceLocked) return; // Evita incremento duplicado da mesma instância
           if (activeLockOwners.size === 0) {
               previous_overflow = document.body.style.overflow;
               document.documentElement.classList.add('max-scroll-locked');
           }
           activeLockOwners.add(instanceToken);
           isInstanceLocked = true;
           document.body.style.overflow = 'hidden';
       };
       ```
     - A função `unlock()`:
       ```typescript
       const unlock = () => {
           if (typeof document === 'undefined' || !isInstanceLocked) return;
           activeLockOwners.delete(instanceToken);
           isInstanceLocked = false;
           if (activeLockOwners.size === 0) {
               document.body.style.overflow = previous_overflow;
               document.documentElement.classList.remove('max-scroll-locked');
           }
       };
       ```
     - Adicionar salvaguarda automática via `onScopeDispose` (quando executado em contexto de componente Vue ativo):
       ```typescript
       if (getCurrentScope()) {
           onScopeDispose(() => {
               if (isInstanceLocked) unlock();
           });
       }
       ```
     - Exportar método utilitário `forceReset()` para casos críticos de reset e testes automatizados.

### Passo 6: Higienização de Listeners em `src/directives/tooltip.ts`
1. Em [`src/directives/tooltip.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/directives/tooltip.ts):
   - Garantir que `destroyTooltip` seja chamado sempre que o elemento for desmontado ou desabilitado.
   - Certificar de que `window.removeEventListener('scroll', listener, true)` respeite o mesmo flag `capture: true` usado no `addEventListener`.

---

## 4. Padrões de Estabilidade e Convenções do GEMINI.md

1. **Gestão Rigorosa de Efeitos Colaterais**: Todo listener global adicionado em `window` ou `document` deve possuir remoção correspondente e garantida no ciclo de desmontagem do Vue.
2. **Resiliência a Falhas de Consumidores**: Utilitários globais não devem depender de chamadas perfeitas de código externo para manter a integridade da página do usuário.
3. **Padrões de Código**: 4 espaços de indentação, TypeScript estrito, imports explícitos.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Teste de Desmontagem de Upload**:
   - Montar `MaxInputFileUpload`, simular erro que aciona `showError = true`, desmontar o componente antes de 3000ms (`wrapper.unmount()`), e avançar os timers virtuais (`vi.advanceTimersByTime(3000)`). Não deve ocorrer nenhum aviso de mutação reativa pós-desmontagem.
2. **Teste de Resiliência do `useScrollLock`**:
   - Chamar `lock()` duas vezes na mesma instância: o `activeLockOwners.size` deve permanecer `1`.
   - Montar dois componentes independentes com `useScrollLock`:
     - O primeiro chama `lock()` -> `overflow: hidden`.
     - O segundo chama `lock()` -> continua `hidden`.
     - O primeiro desmonta sem chamar `unlock()` -> o scroll permanece travado pelo segundo.
     - O segundo desmonta -> o scroll é restaurado perfeitamente para o valor original.
3. **Teste de Não-Bloqueio de Teclado**:
   - Montar `MaxTopMenuSearchBar`. Disparar evento `keydown` com `key: 'f'`, `ctrlKey: true`. Verificar que `event.defaultPrevented` é `false` quando a barra está fechada/inativa.
4. **Verificação da Suíte**:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```
   Todos devem passar sem erros.

---

## 6. Mitigação de Riscos de Regressão

1. **Compatibilidade de Modais e Drawers**:
   - Todos os componentes existentes que já chamam `const { lock, unlock } = useScrollLock()` mantêm a exata mesma assinatura de API, garantindo compatibilidade reversa transparente com benefícios imediatos de segurança.
2. **Tempo de Exibição de Erros de Upload**:
   - Usuários normais continuam visualizando a mensagem de erro durante os mesmos 3000ms estipulados no design system.
