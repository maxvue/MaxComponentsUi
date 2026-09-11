# Vazamento de Memória por Timers Assíncronos Não Rastreados e Listeners Globais sem Ciclo de Vida Resiliente

## Severidade: Alta

## Componentes Impactados
- [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue)
- [`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue)
- [`MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTabItem.vue)
- [`MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue)
- [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxToast.vue)
- [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue)
- [`src/directives/tooltip.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/directives/tooltip.ts)
- [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts)

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Mutações em Componentes Desmontados**: Disparos de timers assíncronos que executam mutações de estado reativo (ex.: `showError.value = false; files.value = [];`) em instâncias de componentes que já foram desmontadas do DOM (por exemplo, quando o usuário fecha um modal de upload ou troca de rota no meio de uma operação com erro).
2. **Sequestro Invasivo de Atalhos Nativos**: A barra de busca [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue) registra um listener em `document` que intercepta e cancela incondicionalmente o atalho nativo `Ctrl+F` / `Cmd+F` do navegador em toda a aplicação, impedindo os usuários de buscar texto na página web padrão.
3. **Travamento Residual de Scroll da Janela**: O helper singleton [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts) gerencia o lock do `body` através de um contador global de escopo de módulo (`lock_count`). Se um overlay ou modal desmontar abruptamente ou lançar erro durante o ciclo de transição sem invocar `unlock()`, o `body` da página permanece permanentemente congelado com `overflow: hidden`, exigindo recarregamento da página (F5).

### Causa Raiz Profunda
- **Abandono de identificadores de timers (`fire-and-forget`)**: Vários componentes disparam `setTimeout` diretamente dentro de watchers ou hooks de montagem sem guardar o identificador retornado (`ReturnType<typeof setTimeout>`). Consequentemente, não há como cancelar o agendamento em `onBeforeUnmount` ou `onUnmounted`.
- **Falta de isolamento de efeitos colaterais de teclado**: Em vez de gerenciar o atalho `Ctrl+F` apenas quando a barra de pesquisa ou seu atalho de contexto estiverem em foco/ativos, o componente [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue) intercepta os eventos de teclado de todo o `document` e executa `event.preventDefault()` preventivo mesmo se a busca não for relevante para o contexto atual do usuário.
- **Acoplamento em estado de módulo global sem guarda de ciclo de vida**: Em `useScrollLock.ts`, a variável `lock_count` é global e cega para a identidade das instâncias ativas. Se um componente chamar `lock()` duas vezes e `unlock()` uma vez (ou for destruído antes do teardown de um watcher), a integridade de rolagem de toda a aplicação cliente é corrompida.

---

## Evidência Técnica

### 1. Timers de erro com delay longo de 3000ms órfãos de ciclo de vida
Em [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue#L185-L190):
```typescript
watch(showError, (val) => {
    if (val) setTimeout(() => {
        showError.value = false;
        files.value = [];
    }, 3000);
});
```
O retorno do `setTimeout` é descartado. Durante os 3 segundos de espera, se o componente for desmontado, o callback executa mutações em `showError` e `files`, gerando vazamento de memória e potenciais avisos no runtime do Vue.

O mesmo padrão repete-se de forma idêntica em [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue#L83-L86):
```typescript
watch(showError, (val) => {
    if (val) setTimeout(() => { showError.value = false; }, 3000);
});
```

### 2. Timers desgovernados em montagem de abas (MaxTabItem)
Em [`src/components/MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTabItem.vue#L78-L89):
```typescript
onMounted(() => {
    is_mounted.value = true;

    setTimeout(() => {
        if (!tab_id.value) tab_id.value = props.value ?? tabs_info.add_count_tabs();
    }, 0);
    setTimeout(() => {
        if (toValue(tabs_info?.active_tab) == 0 || toValue(tabs_info?.active_tab) === '' || toValue(tabs_info?.active_tab) === undefined) tabs_info?.selectTab(tab_id.value);
    }, 10);
});
```
Nenhum dos dois timers é armazenado em variáveis nem limpo em `onBeforeUnmount`. Em telas dinâmicas que recarregam ou alternam abas em alta frequência, timers residuais chamam `tabs_info.selectTab(tab_id.value)` desordenadamente.

### 3. Interceptação global invasiva de teclado em MaxTopMenuSearchBar
Em [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopMenuSearchBar.vue#L121-L128):
```typescript
/** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */
const handleSearchKeydown = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();
    if (event.key === 'Escape' && is_open.value) closeSearch();
};

onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleSearchKeydown));
```
O listener no `document` bloqueia o atalho `Ctrl+F` / `Cmd+F` em toda a janela do navegador, sequestrando a usabilidade nativa do usuário mesmo quando a busca não está aberta.

### 4. Vulnerabilidade de estado cumulativo no useScrollLock
Em [`src/helpers/useScrollLock.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useScrollLock.ts#L19-L47):
```typescript
let lock_count = 0;
let previous_overflow = '';

export const useScrollLock = (): ScrollLock => {
    const lock = () => {
        if (typeof document === 'undefined') return;
        if (lock_count === 0) {
            previous_overflow = document.body.style.overflow;
            document.documentElement.classList.add('max-scroll-locked');
        }
        lock_count += 1;
        document.body.style.overflow = 'hidden';
    };

    const unlock = () => {
        if (typeof document === 'undefined' || lock_count === 0) return;
        lock_count -= 1;
        if (lock_count === 0) {
            document.body.style.overflow = previous_overflow;
            document.documentElement.classList.remove('max-scroll-locked');
        }
    };

    return { lock, unlock };
};
```
Se qualquer componente consumidor invocar `lock()` e, por erro de ciclo de vida ou desmontagem prematura (ex.: falha de render de slot filho), não invocar `unlock()`, `lock_count` nunca mais volta a 0, deixando a rolagem da janela permanentemente bloqueada.

---

## Impacto na Estabilidade e Manutenibilidade do Ecossistema

1. **Vazamento de Memória (Memory Leaks)**: Retenção de árvores de componentes Vue na memória pelo motor V8 devido a referências fechadas em timers do loop de eventos.
2. **Instabilidade Comportamental**: Disparo tardio de mutações que alteram dados reativos após o componente não ser mais relevante na tela.
3. **Quebra de Acessibilidade e Usabilidade Web**: O sequestro do atalho `Ctrl+F` fere as heurísticas de usabilidade da Nielsen e padrões de acessibilidade W3C, impedindo deficientes visuais e operadores de realizar busca in-page.
4. **Resiliência Fragilizada**: Qualquer exceção não capturada em um modal ou drawer trava a usabilidade de rolagem de todo o sistema do cliente.
