# Plano 02 — `MaxBaseOverlay` (primitiva de sobreposição)

| | |
|---|---|
| **id** | 2 |
| **Arquivo a criar** | `src/components/base/MaxBaseOverlay.vue` |
| **Primitiva eliminada** | (nenhuma diretamente — é infraestrutura) |
| **Depende de** | — |
| **Destrava** | ids 23, 26, 28, 29, 30, 31 (Select, AutoComplete, DatePicker, ColorPicker, Menu, IconPicker) |

Seis componentes precisam abrir um painel flutuante ancorado a um gatilho. O PrimeVue
resolve isso com uma mistura de `OverlayEventBus`, `ConnectedOverlayScrollHandler`,
`ZIndexUtils` e `DomHandler.absolutePosition`. Reimplementar essa lógica seis vezes
seria insustentável — daí esta primitiva única.

---

## 1. O que o overlay do PrimeVue faz (comportamentos a replicar)

Extraído do `BaseOverlay` / `Portal` do PrimeVue 4:

| Comportamento | Detalhe |
|---|---|
| **Teleport** | painel renderiza em `document.body` (prop `appendTo`, default `'body'`) |
| **Posicionamento** | alinha ao elemento-gatilho; largura mínima = largura do gatilho |
| **Flip vertical** | se não couber abaixo, abre acima |
| **Clamp horizontal** | se ultrapassar a viewport à direita, encosta na borda |
| **Reposicionamento** | recalcula em `scroll` e `resize` |
| **z-index** | empilhamento gerenciado; overlays novos ficam acima dos antigos |
| **Click-outside** | clique fora do painel **e** fora do gatilho fecha |
| **ESC** | fecha o overlay e devolve o foco ao gatilho |
| **Scroll lock** | opcional (usado por modal/drawer, não por dropdown) |
| **Transição** | fade + translate curto na entrada/saída |
| **ARIA** | gatilho recebe `aria-expanded`, `aria-controls`, `aria-haspopup` |

---

## 2. O que já existe neste repositório

**Antes de escrever qualquer linha, leia estes dois arquivos** — eles já resolvem parte
do problema **sem PrimeVue**:

- `src/components/MaxPopover.vue` — overlay já PrimeVue-free
- `src/stores/usePopoverStore.ts` — controle de abertura/fechamento

**Decisão obrigatória a tomar e registrar em `notas`:**

- **(a)** `MaxPopover` já cobre o necessário → use-o como base e **não crie**
  `MaxBaseOverlay`; ajuste o `status.yaml` marcando o id 2 como Concluído com a nota
  *"resolvido por reuso de MaxPopover"*.
- **(b)** `MaxPopover` é acoplado demais ao caso de uso dele → extraia a lógica comum
  para `MaxBaseOverlay` e **refatore `MaxPopover` para consumi-la** (evita duas
  implementações divergentes de posicionamento).

Prefira **(a)** se for viável. Duplicar lógica de posicionamento é a origem clássica de
bugs de UI inconsistentes.

---

## 3. Implementação (caso a opção (b) seja escolhida)

### API

```ts
interface Props {
    /** controla visibilidade (v-model:visible) */
    visible?: boolean;
    /** elemento-gatilho ao qual o painel se ancora */
    target?: HTMLElement | null;
    /** destino do teleport */
    appendTo?: string | HTMLElement;
    /** alinhamento horizontal em relação ao gatilho */
    align?: 'left' | 'right';
    /** força largura mínima igual à do gatilho */
    matchTargetWidth?: boolean;
    /** fecha ao clicar fora */
    dismissable?: boolean;
    /** fecha com ESC */
    closeOnEscape?: boolean;
    /** distância em px entre gatilho e painel */
    offset?: number;
}
```

Eventos: `update:visible`, `show`, `hide`, `before-show`, `before-hide`.
Slot: `default` (conteúdo do painel).

### Posicionamento

```ts
const position = () => {
    if (!props.target || !panelRef.value) return;

    const t = props.target.getBoundingClientRect();
    const p = panelRef.value.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // flip vertical: abre acima se não couber abaixo
    const spaceBelow = vh - t.bottom;
    const openUp = spaceBelow < p.height && t.top > spaceBelow;
    const top = openUp ? t.top - p.height - props.offset : t.bottom + props.offset;

    // clamp horizontal
    let left = props.align === 'right' ? t.right - p.width : t.left;
    left = Math.max(8, Math.min(left, vw - p.width - 8));

    style.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        minWidth: props.matchTargetWidth ? `${t.width}px` : undefined,
        zIndex: String(nextZIndex())
    };
};
```

> **Use `position: fixed` com valores de `getBoundingClientRect()`** (que já são
> relativos à viewport). Misturar `absolute` com coordenadas de viewport é o erro mais
> comum aqui e produz painéis deslocados dentro de containers com scroll.

### z-index

Um contador de módulo simples, começando acima do tema:

```ts
let zIndexCounter = 1000;
const nextZIndex = () => ++zIndexCounter;
```

### Listeners (montar/desmontar com disciplina)

Ao abrir: `scroll` (com `capture: true`, para pegar containers internos), `resize`,
`click` no document, `keydown` para ESC.
Ao fechar: **remova todos**. Vazamento de listener aqui degrada a app inteira.

Use `onBeforeUnmount` como rede de segurança.

### Acessibilidade

- painel: `role="dialog"` ou `role="listbox"` conforme o consumidor (prop `role`);
- ao abrir, mova o foco para o painel; ao fechar, **devolva ao gatilho**;
- ESC fecha e devolve o foco;
- o consumidor é responsável por `aria-expanded`/`aria-controls` no gatilho — documente
  isso no topo do arquivo.

---

## 4. Teste — `tests/components/base/MaxBaseOverlay.test.ts` (criar)

1. `visible: false` → painel não está no DOM;
2. `visible: true` → painel é teleportado para `document.body`;
3. emite `show` / `before-show` ao abrir e `hide` / `before-hide` ao fechar;
4. clique fora fecha (com `dismissable: true`) e emite `update:visible` com `false`;
5. clique **dentro** do painel **não** fecha;
6. clique no **gatilho** não fecha via click-outside (senão o toggle nunca abre);
7. `Escape` fecha e o foco volta ao gatilho;
8. `closeOnEscape: false` → ESC não fecha;
9. `matchTargetWidth` aplica `min-width` igual à largura do gatilho;
10. **listeners são removidos ao desmontar** — espione
    `document.removeEventListener` e confirme a simetria com `addEventListener`.

> **happy-dom não faz layout**: `getBoundingClientRect()` retorna zeros. Faça mock do
> método no elemento-gatilho para testar flip e clamp de forma determinística.

---

## 5. Checklist de conclusão

- [ ] Decisão (a) ou (b) registrada em `notas` do `status.yaml`
- [ ] Se (b): `MaxPopover.vue` refatorado para consumir a primitiva
- [ ] Sem vazamento de listeners (teste 10 passa)
- [ ] Foco devolvido ao gatilho no fechamento
- [ ] `npm run type-check`, `npm run lint`, `npm run test` passam
- [ ] Primitiva **não** exportada em `src/index.ts`
