# Plano 31 — `MaxInputIconPicker` (substitui `InputText` + `Drawer` + `VirtualScroller`)

| | |
|---|---|
| **id** | 31 |
| **Arquivo** | `src/components/MaxInputIconPicker.vue` |
| **Primitivas eliminadas** | `InputText`, `Drawer`, `VirtualScroller` |
| **Depende de** | 1 (`MaxBaseInput`), 2 (`MaxBaseOverlay`), 4 (`MaxBaseVirtualScroller`) |
| **Teste existente** | nenhum — **criar do zero** |

Três primitivas de uma vez, sem teste de rede de segurança. Vá devagar.

---

## 1. O `Drawer` do PrimeVue 4

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `visible` | `boolean` | `false` | v-model:visible |
| `position` | `'left'\|'right'\|'top'\|'bottom'\|'full'` | `'left'` | de onde desliza |
| `header` | `string` | — | título |
| `modal` | `boolean` | `true` | máscara de fundo |
| `dismissable` | `boolean` | `true` | clique na máscara fecha |
| `showCloseIcon` | `boolean` | `true` | botão de fechar |
| `closeOnEscape` | `boolean` | `true` | ESC fecha |
| `blockScroll` | `boolean` | `false` | trava o scroll do body |

Eventos: `update:visible`, `show`, `hide`, `after-hide`.
Slots: `header`, `default`, `footer`, `closeicon`.

### O que o Drawer exige que um overlay comum não exige

Um drawer modal é um **diálogo**, e isso traz obrigações:

1. **Focus trap** — Tab não pode escapar para o conteúdo atrás. Ao chegar no último
   elemento focável, Tab volta ao primeiro (e Shift+Tab faz o inverso).
2. **`aria-modal="true"` + `role="dialog"`** + `aria-labelledby` apontando para o título.
3. **Foco inicial** no drawer ao abrir; **devolvido ao gatilho** ao fechar.
4. **`blockScroll`** — `overflow: hidden` no `body` enquanto aberto, restaurado ao fechar
   (guarde o valor anterior; não assuma que era `visible`).
5. **Inertia do fundo** — idealmente `aria-hidden="true"` ou `inert` no conteúdo atrás.

O `MaxBaseOverlay` do [plano 02](02-MaxBaseOverlay.md) **não** cobre isso. Você tem duas
opções — registre a escolha em `notas`:

- **(a)** estender `MaxBaseOverlay` com props `modal`, `blockScroll` e `trapFocus`;
- **(b)** criar `src/components/base/MaxBaseDrawer.vue` separado.

Prefira **(a)** se o overlay já estiver limpo; a lógica de trap é ~30 linhas.

---

## 2. Levantamento obrigatório

```bash
sed -n '1,90p' src/components/MaxInputIconPicker.vue
```

Registre em `notas`:
- de onde vem a lista de ícones (Iconify via `useIconStore`?);
- o VirtualScroller é lista vertical ou grade?
- há campo de busca de ícones?
- qual a `position` do Drawer?
- quais props/eventos o componente expõe?

---

## 3. Implementação

🔒 **`InputBase` permanece o elemento mais externo, intocado:**

```vue
<InputBase v-bind="props" ...>              <!-- NÃO MUDA -->
    <MaxBaseInput ... @click="openDrawer" /> <!-- campo com o ícone selecionado -->
</InputBase>
<!-- o drawer é teleportado para o body, fora do InputBase -->
```

`src/components/InputBase.vue` não é alterado por este item.

Ordem sugerida (uma primitiva por vez, testando entre elas):

1. **`InputText` → `MaxBaseInput`** (trivial; faça primeiro e confirme que nada quebrou);
2. **`VirtualScroller` → `MaxBaseVirtualScroller`** (a lista de ícones);
3. **`Drawer` → overlay modal** (o mais complexo).

### Focus trap (esboço)

```ts
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !panelRef.value) return;

    const nodes = Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
};
```

### Grade de ícones acessível

Se for uma grade de ícones clicáveis, cada um precisa de `aria-label` com o nome do
ícone. Uma grade de 5000 botões sem rótulo é ruído puro para leitor de tela. Use
`role="listbox"` + `role="option"` + `aria-setsize`/`aria-posinset` (ver
[plano 04](04-MaxBaseVirtualScroller.md)).

### Busca

Se houver campo de busca, ele filtra antes da virtualização. Debounce recomendado — a
lista do Iconify é grande.

---

## 4. Teste — `tests/components/MaxInputIconPicker.test.ts` (criar)

1. renderiza o input com o ícone selecionado;
2. clicar abre o drawer;
3. o drawer lista ícones (virtualizados — **poucos nós para muitos itens**);
4. clicar num ícone o seleciona, emite `update:modelValue` e fecha o drawer;
5. busca filtra a lista;
6. `Escape` fecha o drawer;
7. clique na máscara fecha (se `dismissable`);
8. **focus trap**: Tab a partir do último focável volta ao primeiro;
9. foco devolvido ao gatilho ao fechar;
10. `role="dialog"` + `aria-modal="true"`;
11. `blockScroll` restaura o `overflow` original do body ao fechar;
12. cada ícone tem `aria-label`.

> `useIconStore` faz fetch do Iconify — o `tests/setup.ts` já mocka `fetch`. Forneça uma
> lista determinística de ícones no mock em vez de depender da rede.

---

## 5. Checklist

- [ ] Levantamento da seção 2 em `notas`
- [ ] Decisão (a) ou (b) sobre o drawer em `notas`
- [ ] As **três** primitivas removidas; `grep -n "primevue"` → vazio
- [ ] 🔒 `<InputBase>` continua sendo o elemento mais externo, com as mesmas props
- [ ] 🔒 `git diff --stat src/components/InputBase.vue` → vazio (arquivo intocado)
- [ ] Focus trap funcionando (teste 8)
- [ ] `blockScroll` restaura o estado anterior, não assume `visible` (teste 11)
- [ ] Virtualização real (teste 3)
- [ ] `aria-label` em cada ícone
- [ ] `type-check`, `lint`, `test` OK
