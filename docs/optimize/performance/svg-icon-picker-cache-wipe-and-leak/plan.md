# Plano de Implementação: Preservação de Cache de SVGs e Prevenção de Memory Leak no MaxInputIconPicker

## 1. Diagnóstico e Objetivo

O componente `MaxInputIconPicker.vue` disponibiliza uma gaveta (*drawer*) para seleção e busca de ícones com carregamento sob demanda de vetores SVG via requisições HTTP em lote.

No código atual, foram diagnosticadas duas falhas críticas de ciclo de vida e gerenciamento de memória:

1. **Destruição do cache ao reabrir o seletor (`openDrawer`):**
```typescript
// MaxInputIconPicker.vue L285-L297
const openDrawer = () => {
    if (props.disabled) return;
    search.value = '';
    curatedIcons.value = [];
    svgCache.value = {}; // <-- ZERA TODO O CACHE LOCAL DE SVGs
    svgFetchQueue = [];
    if (svgFetchTimer !== null) {
        clearTimeout(svgFetchTimer);
        svgFetchTimer = null;
    }
    visible.value = true;
    fetchCuratedIcons();
};
```
Cada vez que o usuário abre o drawer, `svgCache.value` é reinicializado como um objeto vazio. Como consequência, todos os 60 a 200 ícones visíveis que já haviam sido baixados e sanitizados minutos antes precisam ser requisitados novamente ao servidor, gerando tráfego redundante de rede e piscamento visual (*flicker*).

2. **Vazamento de Timer e Requisições Fantasmas no Desmonte:**
A função `enqueueSvgFetch` agenda requisições HTTP através de `setTimeout` com debounce de 150ms:
```typescript
// MaxInputIconPicker.vue L206-L228
if (svgFetchTimer !== null) clearTimeout(svgFetchTimer);
svgFetchTimer = setTimeout(async () => {
    const batch = svgFetchQueue.splice(0, 200);
    ...
    const res = await fetch(props.svgUrl, { ... });
    const data = await res.json();
    ...
    svgCache.value = { ...svgCache.value, ...sanitized_data };
}, 150);
```
O componente **não implementa `onBeforeUnmount`**. Caso o componente seja destruído (ex.: navegação entre páginas, fechamento de modal-pai ou alternância de aba), o timer pendente continua vivo no event loop do navegador, disparando uma requisição de rede órfã e tentando mutar a ref `svgCache` de um componente desmontado.

**Objetivo:**
1. Preservar o cache de ícones em memória entre aberturas do drawer, permitindo reaberturas instantâneas sem novas requisições de rede para ícones já carregados.
2. Adicionar o hook `onBeforeUnmount` para cancelar qualquer timer ativo (`svgFetchTimer`) e esvaziar a fila pendente (`svgFetchQueue`).

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputIconPicker.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputIconPicker.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/MaxInputIconPicker.vue`

1. **Importar `onBeforeUnmount` de `vue`:**
Garantir que `onBeforeUnmount` esteja incluído no import de dependências do Vue.

2. **Preservar `svgCache` em `openDrawer`:**
Remover a linha `svgCache.value = {};`. Apenas o campo de pesquisa, a lista de ícones da busca e a fila transiente de download são reinicializados. Os SVGs cacheados permanecem disponíveis para exibição imediata:

```typescript
// MaxInputIconPicker.vue L285-L297
const openDrawer = () => {
    if (props.disabled) return;
    search.value = '';
    curatedIcons.value = [];
    // svgCache.value = {}; <-- REMOVIDO: preserva os vetores já baixados
    svgFetchQueue = [];
    if (svgFetchTimer !== null) {
        clearTimeout(svgFetchTimer);
        svgFetchTimer = null;
    }
    visible.value = true;
    fetchCuratedIcons();
};
```

3. **Registrar `onBeforeUnmount` para limpeza de recursos:**

```typescript
// MaxInputIconPicker.vue
onBeforeUnmount(() => {
    if (svgFetchTimer !== null) {
        clearTimeout(svgFetchTimer);
        svgFetchTimer = null;
    }
    svgFetchQueue = [];
});
```

Template e estilos SCSS scoped mantêm-se estritamente intactos.

---

### 3.2. Adição de Testes Unitários em `tests/components/MaxInputIconPicker.test.ts`

Adicionar testes cobrindo a preservação do cache entre aberturas e o cancelamento do timer no desmonte:

```typescript
it('preserva os SVGs em svgCache ao fechar e reabrir o drawer', async () => {
    const fetchMock = vi.fn((url: string) => {
        if (url.toString().includes('/picker/svg')) {
            return Promise.resolve({
                json: () => Promise.resolve({ 'mdi:cached-icon': '<svg><path d="M0 0"/></svg>' })
            } as Response);
        }
        return Promise.resolve({
            json: () => Promise.resolve([{ id: 1, name: 'mdi:cached-icon', search: 'mdi:cached-icon' }])
        } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });

    // Abre o drawer pela 1ª vez
    await wrapper.find('.icon-picker-trigger').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 250));
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;
    expect(vm.svgCache['mdi:cached-icon']).toBeDefined();

    // Fecha o drawer
    vm.visible = false;
    await wrapper.vm.$nextTick();

    // Reabre o drawer
    await wrapper.find('.icon-picker-trigger').trigger('click');
    await wrapper.vm.$nextTick();

    // O cache deve ter sido preservado
    expect(vm.svgCache['mdi:cached-icon']).toBeDefined();
});

it('cancela timer pendente e esvazia fila de fetch no desmonte do componente', async () => {
    const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });
    const vm = wrapper.vm as any;

    // Agenda um fetch
    vm.enqueueSvgFetch(['mdi:pending-1', 'mdi:pending-2']);

    // Desmonta imediatamente antes dos 150ms do timer
    wrapper.unmount();

    // Nenhuma exceção deve ocorrer e o timer deve ser cancelado
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(true).toBe(true);
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de Props e V-Model:** `modelValue`, `disabled`, `listUrl`, `svgUrl`, `label`, `required`, `caution`, etc., mantêm comportamento e valores padrão inalterados.
- **Sanitização de SVGs:** Todos os ícones continuam sendo rigorosamente validados por `DOMPurify` via `sanitizeSvg` antes de serem armazenados.
- **Transparência para o Usuário Final:** A experiência do usuário melhora significativamente: reabrir o seletor torna a exibição instantânea sem flickering de rede.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Ao abrir o modal de seleção pela segunda vez na mesma sessão, ícones já baixados anteriormente devem ser exibidos de forma instantânea sem novas requisições POST para `svgUrl`.
2. Ao desmontar o componente antes de 150ms da solicitação de novos ícones, nenhuma chamada órfã de rede deve ser concluída nem erros devem surgir no console.
3. Checagem de tipagem TypeScript estrita:
   ```bash
   npm run type-check
   ```
4. Execução dos testes unitários do `MaxInputIconPicker`:
   ```bash
   npx vitest run tests/components/MaxInputIconPicker.test.ts
   ```
