# Plano 04 — `MaxBaseVirtualScroller` (substitui `primevue/virtualscroller`)

| | |
|---|---|
| **id** | 4 |
| **Arquivo a criar** | `src/components/base/MaxBaseVirtualScroller.vue` |
| **Primitiva eliminada** | `VirtualScroller` |
| **Depende de** | — |
| **Destrava** | id 31 (`MaxInputIconPicker`) |

> **Atalho decisivo:** `@tanstack/vue-virtual@^3.13.26` **já está** em
> `dependencies` no `package.json`. Não implemente virtualização do zero — é uma das
> áreas mais sutis de UI (medição, scroll anchoring, itens de altura variável) e a
> biblioteca já está paga e instalada.

---

## 1. O `VirtualScroller` do PrimeVue

### Props relevantes

| Prop | Tipo | Efeito |
|---|---|---|
| `items` | `any[]` | coleção completa |
| `itemSize` | `number \| number[]` | altura (ou [altura, largura]) de cada item |
| `scrollHeight` | `string` | altura do container |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | eixo |
| `numToleratedItems` | `number` | itens extras renderizados fora da viewport |
| `lazy` | `boolean` | dispara `lazy-load` ao rolar |
| `showLoader` | `boolean` | exibe carregador |

### Slots

- `item` — `{ item, options: { index, count, first, last, even, odd } }`
- `content` — controle total do container
- `loader` — placeholder de carregamento

### Eventos

`scroll`, `scroll-index-change`, `lazy-load`.

---

## 2. Uso neste repositório

**Um único consumidor:** `MaxInputIconPicker.vue` (linha 84), que lista os ícones do
Iconify numa grade dentro de um Drawer.

**Antes de implementar, leia `MaxInputIconPicker.vue`** e registre em `notas`:
- é lista vertical ou grade 2D?
- os itens têm altura fixa? (para ícones, quase certamente sim)
- quais props e slots são de fato usados?

Se apenas `items`, `itemSize` e o slot `item` forem usados — o cenário mais provável —
implemente **só isso**. Paridade de API significa cobrir o que o consumidor usa, não
reproduzir a superfície inteira de uma biblioteca de terceiros que ninguém chama.

---

## 3. Implementação com `@tanstack/vue-virtual`

```vue
<template>
    <div ref="parentRef" class="max-virtual-scroller" :style="{ height: scrollHeight, overflow: 'auto' }">
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
            <div
                v-for="virtualRow in virtualizer.getVirtualItems()"
                :key="virtualRow.key"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                }"
            >
                <slot
                    name="item"
                    :item="items[virtualRow.index]"
                    :options="{
                        index: virtualRow.index,
                        count: items.length,
                        first: virtualRow.index === 0,
                        last: virtualRow.index === items.length - 1,
                        even: virtualRow.index % 2 === 0,
                        odd: virtualRow.index % 2 !== 0
                    }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    const props = withDefaults(
        defineProps<{
            items?: any[];
            itemSize?: number;
            scrollHeight?: string;
            numToleratedItems?: number;
        }>(),
        { items: () => [], itemSize: 40, scrollHeight: '200px', numToleratedItems: 5 }
    );

    const emit = defineEmits<{ scroll: [event: Event]; 'scroll-index-change': [payload: { first: number; last: number }] }>();

    const parentRef = ref<HTMLElement | null>(null);

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: props.items.length,
            getScrollElement: () => parentRef.value,
            estimateSize: () => props.itemSize,
            overscan: props.numToleratedItems
        }))
    );

    defineExpose({ scrollToIndex: (i: number) => virtualizer.value.scrollToIndex(i) });
</script>
```

> Ajuste a assinatura conforme a versão instalada:
> ```bash
> node -p "require('./node_modules/@tanstack/vue-virtual/package.json').version"
> ```
> A API do `useVirtualizer` mudou entre as minor versions da v3 — **leia o `.d.ts`
> instalado**, não confie na memória.

### Acessibilidade

O container precisa de `role="listbox"` (ou o papel adequado ao consumidor) e cada item
de `role="option"`. Como só há um item renderizado por posição virtual, informe o total
real com `aria-setsize` e a posição com `aria-posinset` — senão leitores de tela anunciam
"item 3 de 12" numa lista de 5000.

---

## 4. Teste — `tests/components/base/MaxBaseVirtualScroller.test.ts` (criar)

1. renderiza o container com a `scrollHeight` informada;
2. com 1000 itens, **muito menos que 1000** nós são renderizados (o ponto inteiro
   da virtualização) — asserte `renderedCount < 100`;
3. o slot `item` recebe o item correto e os `options` corretos;
4. `options.first` é `true` só no índice 0;
5. lista vazia não quebra;
6. mudar `items` reativamente atualiza a renderização;
7. `scrollToIndex` exposto e chamável.

> **happy-dom não faz layout.** O `@tanstack/vue-virtual` depende de medições reais.
> Faça mock de `getBoundingClientRect` e das propriedades `clientHeight`/`scrollHeight`
> do elemento pai; se ainda assim o virtualizador não render nada em ambiente de teste,
> **registre isso em `notas`** e teste a lógica de cálculo isoladamente em vez de
> fingir uma asserção que passa por acidente.

---

## 5. Checklist de conclusão

- [ ] Uso real em `MaxInputIconPicker` documentado em `notas` antes de implementar
- [ ] Versão do `@tanstack/vue-virtual` conferida no `.d.ts` instalado
- [ ] Teste 2 (virtualização real) passa — é o que distingue virtualizar de só renderizar
- [ ] ARIA com `aria-setsize`/`aria-posinset`
- [ ] Não exportado em `src/index.ts`
