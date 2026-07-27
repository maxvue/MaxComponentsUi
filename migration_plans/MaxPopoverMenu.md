# Plano de Migração — MaxPopoverMenu

> Plano autossuficiente. Uma IA futura deve conseguir executar esta migração lendo **apenas**
> este arquivo + `src/components/MaxPopoverMenu.vue` (+ opcionalmente `src/components/MaxButton.vue`
> e `src/components/MaxIcon.vue`, que **não** são alterados aqui).
> **Não** alterar outros componentes. Preservar API pública, estilos e comportamento.

---

## 1. Componente

- **Nome:** `MaxPopoverMenu`
- **Caminho:** `src/components/MaxPopoverMenu.vue`
- **Nível de dificuldade:** `media`
- **Objetivo da migração:** remover a dependência do PrimeVue substituindo o componente
  `Menu` (`primevue/menu`, usado em modo `popup`) por uma implementação própria de lista de
  itens/submenus com:
  - **posicionamento** flutuante do overlay ancorado ao botão (recomendado: **Floating UI**),
  - **navegação por teclado** (setas, Home/End, Enter/Espaço, Escape, Tab),
  - **abertura/fechamento** via método público `toggle(event)` (já exposto),
  - fechamento ao clicar fora / pressionar Escape.
  - Manter intactos `goToRoute`, `useDefaultReset` (de `@maxvue/max-use`) e `getCssSize`
    (helper interno). Estes **não** são PrimeVue e **devem permanecer**.

---

## 2. Dependências do PrimeVue (trechos reais)

O **único** acoplamento ao PrimeVue neste arquivo é o `Menu` (modo popup):

```ts
// script setup
import Menu from 'primevue/menu';
```

```vue
<!-- template -->
<Menu ref="menu" id="overlay_menu" :model="props.items ?? props.model" :popup="true">
    <template #item="{ item }">
        <slot name="item" :data="item">
            <div class="max-popover-menu-item" @click.stop="(event) => item.action ? item.action({ event, data: item.data ?? {} }) : onClick(event, item)" >
                <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                <div class="max-popover-menu-label">{{ item.label }}</div>
            </div>
        </slot>
    </template>
</Menu>
```

```ts
// método público que aciona o overlay do PrimeVue
const menu = ref();

const toggle = (event?: any) => {
    menu.value.toggle(event);
};
```

### API do PrimeVue `Menu` (popup) usada, e o que precisa ser reproduzida

- **Prop `:model`** — array de itens. Cada item PrimeVue (`MenuItem`) pode ter
  `label`, `icon`, `command`, `url`, `items` (submenus), `disabled`, `visible`, `separator`.
  **Atenção:** aqui o modelo é `props.items ?? props.model` e os itens usam campos **próprios**
  (`icon`/`i`, `action`, `route`, `data`/`props`/`params`/`query`), **não** os campos PrimeVue
  (`command`/`url`). O `#item` slot é totalmente customizado — ver seção 4.
- **Prop `:popup="true"`** — o menu é um overlay flutuante posicionado ao lado do elemento
  passado para `toggle(event)` (âncora = `event.currentTarget`). Precisa ser reimplementado
  com posicionamento flutuante e teleport para `body`.
- **Slot `#item="{ item }"`** — render por item. Reproduzir como um `v-for` sobre o modelo.
- **`id="overlay_menu"`** — id do overlay (não é referenciado por CSS interno; pode ser mantido
  no elemento raiz do novo overlay por compatibilidade, mas não é funcionalmente necessário).
- **Método de instância `menu.value.toggle(event)`** — abre/fecha e reposiciona relativo à
  âncora do evento. É o mecanismo que `toggle(event)` (exposto) usa. Precisa de equivalente
  próprio (`toggle`, `show`, `hide`) — ver seção 5.

Nenhum estilo `.p-menu*` do PrimeVue é usado nos `<style>` deste arquivo (verificado: o SCSS
só estiliza `.max-popover-menu`, `.botao`, `.max-popover-menu-item`, `.max-popover-menu-label`).
Portanto os estilos deste componente **não** dependem de classes PrimeVue e podem permanecer
como estão (ver seção 7).

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação nesta migração |
|-------------|--------|-------|---------------------|
| `MaxButton` | `./MaxButton.vue` | Botão padrão do trigger quando o slot `button` não é fornecido. Recebe `v-bind="props"` + `size`/`flex`. | **Preservar** exatamente. Não migrar aqui. |
| `MaxIcon` | `./MaxIcon.vue` | Ícone de cada item (`item.icon ?? item.i`, `size="1.1"`). | **Preservar.** Não migrar aqui. |
| `goToRoute` | `@maxvue/max-use` | Navegação por nome de rota. Assinatura real: `goToRoute(route, data)`. Lança erro se o router não estiver configurado (`setLibraryRouter`). | **Preservar.** É externo, não PrimeVue. |
| `useDefaultReset` | `@maxvue/max-use` | Cria uma `Ref` com auto-reset por debounce. Aqui: `useDefaultReset<boolean>(false, 200)` → flag `executing` que volta a `false` 200ms após mudar (bloqueio anti-duplo-clique). | **Preservar** com o **mesmo** timer de 200ms e valor inicial `false`. |
| `getCssSize` | `../helpers/getCssSize.js` | Converte número/string em CSS size (número → `px`; string só-numérica → `px`; senão mantém). Usado em `size_icon`. | **Preservar** import e uso. |
| `computed`, `ref` | `vue` | `size_icon` computa o tamanho; `menu` é a ref do overlay. | `menu` passa a apontar para a nova implementação (ver seção 5). |

### Notas de comportamento a preservar (do `<script setup>` real)

- `size_icon = computed(() => getCssSize(Number(props.size ?? props.sizeIcon ?? props.iconSize ?? 1.1) + 'rem'))`
  → usado como `width`/`height` do container `.max-popover-menu` e do `.botao`.
  **Observação:** `Number(x) + 'rem'` produz strings como `'1.1rem'`; `getCssSize` recebe uma
  string não puramente numérica e a **retorna inalterada** (ex.: `'1.1rem'`). Reproduzir idêntico.
- `executing = useDefaultReset<boolean>(false, 200)` — flag anti-duplo-clique.
- `onClick(event, item)`:
  1. Se `executing.value` for `true`, **não faz nada** (bloqueio).
  2. Senão, seta `executing.value = true` (auto-reset em 200ms via `useDefaultReset`).
  3. Resolve `data = item.data ?? item.props ?? item.params ?? item.query ?? {}`.
  4. Se `item.route` existir → `goToRoute(item.route, data)` e **retorna** (não chama action).
  5. Senão, se `item.action` existir → `item.action({ event, data })` e **retorna**.
- O handler inline do template chama `item.action({ event, data: item.data ?? {} })` **direto**
  quando o item tem `action`; senão delega a `onClick(event, item)`. **Este comportamento e a
  diferença de `data` (`item.data ?? {}` no inline vs. o fallback amplo no `onClick`) devem ser
  preservados literalmente** — há testes que dependem disso (seção 8).

> `usePopoverStore` foi mencionado no contexto do projeto, mas **este componente NÃO o utiliza**
> (grep confirma que só `MaxPopover`/`MaxTogglePopover` usam a store). **Não introduzir** a store
> aqui — o overlay é local ao componente, controlado por `menu.value.toggle()`.

---

## 4. API pública a preservar

Contrato observável por quem consome a lib — **NÃO pode mudar**.

### Props (todas opcionais, com defaults reais)

| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `label` | `string` | — | Texto do botão (repassado ao `MaxButton` via `v-bind="props"`). |
| `icon` | `string` | — | Ícone do botão. |
| `i` | `string` | — | Alias de `icon`. |
| `items` | `any[]` | — | Itens do menu. |
| `model` | `any[] \| undefined` | — | Alias de `items`. Modelo efetivo = `items ?? model`. |
| `rotate` | `number` | — | Repassado ao botão. |
| `flip` | `'horizontal'\|'vertical'\|'h'\|'v'\|'x'\|'y'\|'xy'` | — | Repassado ao botão. |
| `size` | `string \| number` | — | Tamanho do ícone/botão. |
| `iconSize` | `string \| number` | — | Idem. |
| `sizeIcon` | `string \| number` | — | Idem. |
| `scale` | `string \| number` | — | Repassado ao botão. |
| `width` | `string \| number` | — | Repassado ao botão. |
| `height` | `string \| number` | — | Repassado ao botão. |
| `dark` | `boolean\|string\|number\|undefined` | `0.4` | Repassado ao botão. |
| `light` | `boolean\|string\|number\|undefined` | `undefined` | Repassado ao botão. |
| `checked` | `boolean\|string\|number\|undefined` | — | Repassado ao botão. |
| `plus` | `boolean\|string\|number\|undefined` | — | Repassado ao botão. |

> Os defaults extras presentes no `withDefaults` real (`loading: false`, `message: 'Deseja continuar?'`)
> **não** correspondem a props declaradas — são inertes. Mantê-los como estão para não alterar
> nada (ou removê-los é neutro; **recomendação:** manter para minimizar diff).
> **NÃO** remover/renomear nenhuma prop declarada acima.

### Método público exposto

- `toggle(event?: any)` — deve continuar acessível via `ref` do componente e via
  `wrapper.vm.toggle(...)`. Um teste chama `vm.toggle(new MouseEvent('click'))` e espera que
  o overlay reaja (ver seção 8). Em `<script setup>`, expor via `defineExpose({ toggle, onClick })`
  **não** era necessário antes porque os testes usam stubs; mas os testes atuais acessam
  `vm.toggle` e `vm.onClick` diretamente. **Garantir que `toggle` e `onClick` continuem
  acessíveis em `vm`** (em `<script setup>`, isso exige `defineExpose({ toggle, onClick })`,
  pois bindings de setup não são expostos por padrão — ver seção 6, passo 7 e riscos seção 10).

### Método interno testado

- `onClick(event, item)` — acessado em testes como `vm.onClick(...)`. Preservar assinatura e a
  lógica descrita na seção 3.

### Slots

| Slot | Props do slot | Papel |
|------|---------------|-------|
| `button` | — | Substitui o `MaxButton` default do trigger. |
| `item` | `:data="item"` | Render customizado de cada item. **Nome da prop do slot é `data`** (não `item`). Preservar `:data="item"`. |

### Emits

- Nenhum `defineEmits`. Não introduzir emits novos.

### Comportamento de item (contrato de dados)

Cada item pode conter: `label`, `icon`/`i`, `action(({ event, data }))`, `route` (string de rota),
e um dos campos de dados `data`/`props`/`params`/`query`. A resolução de `data` e a precedência
`route` > `action` no `onClick` **fazem parte do contrato** e são testadas.

---

## 5. Estratégia de substituição (posicionamento)

Reimplementar o overlay com **HTML nativo + Floating UI** para posicionamento, mantendo o método
`toggle` compatível.

### 5.1. Estrutura

- **Trigger:** manter `.max-popover-menu` > `.botao` com o slot `button` / `MaxButton` como está.
  Guardar uma ref ao elemento âncora (o `.botao` ou o `event.currentTarget` passado ao `toggle`).
- **Overlay:** um novo elemento (ex.: `<Teleport to="body">` com um `<div class="max-popover-menu-overlay" id="overlay_menu" v-if="open">`),
  contendo a lista `role="menu"` e os itens `role="menuitem"`. Renderizar com `v-for` sobre
  `props.items ?? props.model`, reproduzindo o markup do slot `#item` atual (mesmas classes
  `.max-popover-menu-item` / `.max-popover-menu-label` e o `MaxIcon`).
- **Slot `item`:** manter `<slot name="item" :data="item">…</slot>` com o mesmo default.

### 5.2. Posicionamento — Floating UI (recomendado)

Usar `@floating-ui/dom` (ou `@floating-ui/vue` se já disponível no monorepo — verificar
`package.json`; se não houver, `@floating-ui/dom` é a dependência mínima). PrimeVue já usa
Floating UI internamente, então adotá-lo mantém a paridade de comportamento (flip/shift).

```ts
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
```

- Ao abrir: `computePosition(anchorEl, overlayEl, { placement: 'bottom-start', middleware: [offset(4), flip(), shift({ padding: 8 })] })`
  e aplicar `left`/`top` ao overlay via `position: absolute`.
- Registrar `autoUpdate(anchorEl, overlayEl, updatePosition)` ao abrir e **limpar** (chamar o
  retorno de `autoUpdate`) ao fechar/`onBeforeUnmount` — evita vazamento de listeners.
- **Alternativa sem dependência nova:** cálculo manual via `getBoundingClientRect()` do anchor +
  `position: fixed`. Menos robusto (sem flip/shift automáticos). Preferir Floating UI.

### 5.3. Método `toggle` / `show` / `hide` (compatibilidade)

```ts
const open = ref(false);

const show = (event?: any) => {
    if (event?.currentTarget) anchorEl.value = event.currentTarget as HTMLElement;
    open.value = true;
    // nextTick → posicionar + focar primeiro item
};

const hide = () => {
    open.value = false;
    // limpar autoUpdate, remover listeners globais
};

const toggle = (event?: any) => {
    open.value ? hide() : show(event);
};
```

`toggle(event)` mantém a **mesma assinatura pública** de antes (`menu.value.toggle(event)` →
agora `toggle(event)` local). A âncora é `event.currentTarget` quando fornecido; senão, cai no
`.botao` via ref.

### 5.4. Fechamento

- **Clique fora:** listener em `document` (`pointerdown`/`click`) que fecha se o alvo não estiver
  dentro do overlay nem do trigger. Adicionar ao abrir, remover ao fechar.
- **Escape:** `keydown` global (ou no overlay) → `hide()` e devolver foco ao trigger.
- **Ao selecionar um item:** fechar o menu após executar a ação/rota (o PrimeVue popup fecha ao
  clicar num item — reproduzir chamando `hide()` após o handler). Verificar visualmente que o
  comportamento anterior fechava ao clicar; se algum consumidor dependia de manter aberto, isso
  é edge case — o padrão PrimeVue popup **fecha** ao selecionar.

### 5.5. Navegação por teclado (`role="menu"`)

Implementar em um `keydown` no container do overlay:

- `ArrowDown` / `ArrowUp` — move o foco para o próximo/anterior `menuitem` (com wrap), pulando
  itens desabilitados/separadores.
- `Home` / `End` — primeiro / último item.
- `Enter` / `Espaço` — ativa o item focado (mesma lógica do clique: chama `item.action` ou
  `onClick`), depois fecha.
- `Escape` — fecha e devolve foco ao trigger.
- `Tab` — fecha o menu (comportamento típico de menu popup) e deixa o foco seguir.
- Ao abrir, focar o **primeiro** item; gerenciar `tabindex="-1"` nos itens e `tabindex="0"` no
  item ativo (roving tabindex) **ou** focar via `.focus()` diretamente.
- **Acessibilidade:** `role="menu"` no container, `role="menuitem"` em cada item,
  `aria-orientation="vertical"`. No trigger, opcionalmente `aria-haspopup="menu"` e
  `aria-expanded`.

### 5.6. Submenus (`item.items`)

O modelo PrimeVue suporta `items` aninhados. A implementação atual **não** renderiza submenus no
slot custom (o slot só mostra `label`+ícone), então na prática os menus usados são planos. Ainda
assim, para paridade com "lista de itens/submenus":

- Se algum `item.items` existir, renderizar um subgrupo (nested `role="menu"`) — abertura via
  `ArrowRight`/hover, fechamento via `ArrowLeft`. **Se** os consumidores atuais não usam submenus
  (confirmar por grep nos apps consumidores), pode-se implementar o suporte de forma mínima
  (renderizar como grupo/label de seção) sem navegação lateral completa, documentando a limitação.
  **Recomendação:** implementar o caso plano de forma robusta (que é o usado) e o submenu como
  extensão opcional, sem quebrar a API.

---

## 6. Passos de implementação

1. **Remover import do PrimeVue.** Excluir:
   ```ts
   import Menu from 'primevue/menu';
   ```

2. **Adicionar Floating UI.** Import no `<script setup>`:
   ```ts
   import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
   ```
   Conferir/instalar `@floating-ui/dom` em `package.json` (dependência de runtime da lib). Se o
   monorepo já expõe `@floating-ui/vue`, pode-se usá-lo; caso contrário, `@floating-ui/dom` é o
   mínimo.

3. **Estado e refs.** Adicionar:
   ```ts
   const open = ref(false);
   const anchor_el = ref<HTMLElement | null>(null);   // reaproveitar o ref `btn_el` do template
   const overlay_el = ref<HTMLElement | null>(null);
   const active_index = ref(-1);
   let cleanup_position: (() => void) | null = null;
   ```
   > O template já tem `ref="btn_el"` no container raiz — reutilizar como âncora padrão.

4. **Template do overlay.** Substituir o bloco `<Menu>…</Menu>` por um `<Teleport to="body">`
   com um `<div v-if="open" id="overlay_menu" class="max-popover-menu-overlay" role="menu" ref="overlay_el" @keydown="onKeydown">`
   contendo `v-for="(item, index) in (props.items ?? props.model)"`. Dentro de cada item,
   **replicar exatamente** o markup do slot atual:
   ```vue
   <slot name="item" :data="item">
       <div class="max-popover-menu-item" role="menuitem" tabindex="-1"
           @click.stop="(event) => item.action ? item.action({ event, data: item.data ?? {} }) : onClick(event, item)">
           <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
           <div class="max-popover-menu-label">{{ item.label }}</div>
       </div>
   </slot>
   ```
   Manter o handler inline **idêntico** (mesma diferença de `data`) e o nome do slot (`item`) com
   a prop `:data="item"`.

5. **`show`/`hide`/`toggle`.** Implementar conforme seção 5.3. Em `show`, após `open.value = true`,
   usar `nextTick` para: (a) posicionar via `computePosition` + iniciar `autoUpdate`
   (guardar cleanup em `cleanup_position`), (b) focar o primeiro item habilitado, (c) registrar
   listeners globais (clique fora / Escape). Em `hide`: `open.value = false`, chamar
   `cleanup_position?.()`, remover listeners globais, `active_index.value = -1`.

6. **Navegação por teclado.** Implementar `onKeydown(e)` conforme seção 5.5 (setas, Home/End,
   Enter/Espaço, Escape, Tab), atualizando `active_index` e chamando `.focus()` nos itens
   (usar `overlay_el.value?.querySelectorAll('[role=menuitem]')`).

7. **Expor métodos públicos.** Como é `<script setup>`, **adicionar**:
   ```ts
   defineExpose({ toggle, onClick });
   ```
   Isso garante `wrapper.vm.toggle(...)` e `wrapper.vm.onClick(...)` nos testes. (No código
   original, `menu.value.toggle` era do PrimeVue e `vm.toggle`/`vm.onClick` funcionavam via a
   ref do stub; ao internalizar, é necessário expor. Ver riscos seção 10.)

8. **Preservar sem alterações:** `size_icon` (computed com `getCssSize`), `executing`
   (`useDefaultReset<boolean>(false, 200)`), toda a lógica de `onClick`, `props`/`withDefaults`,
   o `MaxButton` no slot `button`, e o container `.max-popover-menu` / `.botao`.

9. **Limpeza de recursos.** Adicionar `onBeforeUnmount(() => { cleanup_position?.(); /* remover listeners globais */ });`.

10. **Estilos.** Manter o `<style lang="scss">` existente e **adicionar** regras para
    `.max-popover-menu-overlay` (fundo, sombra, borda, z-index) — ver seção 7. Ordem dos blocos:
    Template → Script → Style. 4 espaços, aspas simples, ponto e vírgula, sem trailing comma.

11. **Verificar:** `npm run type-check`, `npm run lint`,
    `npx vitest run tests/components/MaxPopoverMenu.test.ts`.

12. **Resolver:** **não** regenerar (`generateResolver.ts`) — nenhum `.vue` novo foi criado nem
    renomeado.

---

## 7. Estilos

- **Estilos atuais deste arquivo NÃO dependem de PrimeVue** — mantê-los como estão:
  ```scss
  .max-popover-menu { max-height: 40px; max-width: 40px; .botao { display: grid; grid-template-columns: 1fr; place-items: center; gap: 8px; cursor: pointer; } }
  .max-popover-menu-item { display: grid; grid-template-columns: auto 1fr; place-items: center start; gap: 8px; height: 2rem; cursor: pointer; padding: 0 8px; }
  .max-popover-menu-label { /* usada no template; herda estilos globais */ }
  ```
- **Overlay:** o PrimeVue `Menu` popup fornecia o "cartão" flutuante (fundo, borda, sombra,
  padding, z-index, aparecendo acima de tudo). Ao remover o PrimeVue, é preciso recriar esse
  contêiner. Adicionar (usando variáveis do tema Max):
  ```scss
  .max-popover-menu-overlay {
      position: absolute;
      z-index: 1100;
      min-width: 12rem;
      padding: 4px 0;
      background: var(--background-0);
      border: 1px solid var(--background-100);
      border-radius: 6px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 12%);

      .max-popover-menu-item:hover,
      .max-popover-menu-item:focus,
      .max-popover-menu-item:focus-visible {
          background: var(--background-50);
          outline: none;
      }
  }
  ```
  > Ajustar as variáveis exatas (`--background-0/50/100`) para casar com a aparência do menu
  > PrimeVue anterior — comparar no playground. As variáveis estão disponíveis via `MaxStyle`.
- **Teleport para `body`:** como o overlay é teleportado, os estilos **não podem ser `scoped`**
  (o bloco atual **já é não-scoped** — manter assim). Classes globais `.max-popover-menu-*`
  continuam aplicando ao conteúdo teleportado.
- **`v-tooltip`:** o template usa `v-tooltip="null"` (diretiva do floating-vue / stub em teste).
  Não é PrimeVue; **manter**. Nos testes é stubado globalmente.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/MaxPopoverMenu.test.ts` — **usa stubs para `Menu`, `MaxButton`, `MaxIcon`**.
Casos e impacto da migração:

1. **`renderiza corretamente`** — stub de `Menu` renderiza o slot `#item` com `:item="model[0]"`
   e o teste procura `.max-popover-menu-label` = `'Item 1'`.
   > **Impacto:** após a migração **não há mais componente `Menu`** para stubar. O markup do item
   > passa a ser renderizado pelo próprio componente (`v-for`). O teste **precisará ser ajustado**:
   > remover o stub de `Menu` e garantir que o overlay renderize (o item pode estar atrás de
   > `v-if="open"` + `Teleport`). **Duas opções:**
   > - (a) Abrir o menu no teste (`vm.toggle()` + `await nextTick()`) e buscar o item no
   >   `document.body` (Teleport) — usar `attachTo: document.body` no `mount`.
   > - (b) Renderizar a lista sempre (sem `v-if`), controlando visibilidade por CSS. **Não
   >   recomendado** (muda semântica). Preferir (a).
   > Como o slot `#item` deixa de existir como slot **de outro componente** e passa a ser um
   > `v-for` interno + `<slot name="item">`, o markup default (`.max-popover-menu-label`) continua
   > presente quando aberto.

2. **`expõe e chama método toggle`** — stub de `Menu` com `methods: { toggle }`, chama
   `vm.toggle(...)` e espera o toggle do stub.
   > **Impacto:** não há mais `menu.value.toggle`. `vm.toggle` passa a ser o método interno
   > (exposto via `defineExpose`). Ajustar o teste para verificar o efeito de `toggle` (ex.:
   > `open` alterna / overlay aparece/desaparece) em vez do stub. Manter a **assinatura**
   > `toggle(event)`.

3. **`onClick chama goToRoute se o item tiver route`** — `vm.onClick(event, { route, data })`
   espera `goToRoute('home.index', { id: 1 })`. **Deve continuar passando sem alteração de lógica**
   (garantir `onClick` exposto via `defineExpose`). `goToRoute` está mockado no topo do arquivo.

4. **`onClick chama action se o item não tiver route`** — `vm.onClick(event, { action, data })`
   espera `action` chamada. **Preservar.**

5. **`onClick bloqueia chamadas duplicadas`** — depende de `executing = useDefaultReset(false, 200)`.
   Primeira chamada executa; segunda imediata é ignorada. **Preservar timer 200ms e a flag.**

6. **`chama item.action diretamente no template ao clicar`** — stub de `Menu` renderiza o slot;
   clique em `.max-popover-menu-item` chama `action` com `{ data: { foo: 'bar' } }` (via handler
   inline `item.data ?? {}`). **Preservar o handler inline idêntico.** Ajustar o teste para abrir
   o overlay (ver caso 1) já que não há mais stub de `Menu`.

7. **`chama onClick no template caso item não possua action própria`** — item com `route` mas sem
   `action`; clique dispara `goToRoute('some.route', { biz: 'baz' })`. **Preservar.** Idem ajuste
   de abertura do overlay.

> **Resumo dos ajustes de teste inevitáveis:** substituir os stubs de `Menu` por abertura real do
> overlay (`vm.toggle()` + `nextTick` + busca no `body` via `attachTo`). A **lógica de negócio
> testada (`onClick`, `goToRoute`, `action`, bloqueio duplicado) NÃO muda** — apenas o mecanismo
> de renderização do overlay. Manter as asserções de comportamento.

### Novos testes recomendados (navegação por teclado / posicionamento)

- Abrir com `toggle`, `ArrowDown` move foco ao 1º/2º item; `Enter` ativa; `Escape` fecha.
- Clique fora fecha o overlay.
- Nenhum resíduo de `primevue/*` no arquivo (grep).

### Comandos

```bash
npx vitest run tests/components/MaxPopoverMenu.test.ts
npm run type-check
npm run lint
```

### Checklist manual (`npm run dev:playground`)

- [ ] Clicar no botão abre o menu ancorado ao botão; clicar de novo fecha.
- [ ] Menu reposiciona (flip/shift) perto das bordas da viewport.
- [ ] Setas/Home/End navegam; Enter/Espaço ativam; Escape fecha e devolve foco ao trigger.
- [ ] Clique fora fecha.
- [ ] Item com `route` navega (`goToRoute`); item com `action` executa; item sem ambos não faz nada.
- [ ] Duplo-clique rápido no mesmo item não dispara a ação duas vezes (bloqueio 200ms).
- [ ] Slots `button` e `item` customizados continuam funcionando.
- [ ] Aparência do overlay (fundo/sombra/borda/hover) equivalente à versão PrimeVue.

---

## 9. Skills necessárias

Skills em `.claude/skills` pertinentes a **este** componente (nível `media`, overlay + teclado):

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-popovers-confirmations-best-practices` | **Principal.** É o skill DEFAULT do ecossistema para popovers, menus de ação de linha/tabela e `MaxPopoverMenu` especificamente. Cobre padrões de itens de menu, triggers e eventos. |
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da lib (estrutura de SFC, aliases em `src/index.ts`, testes com Vitest/test-utils, quando rodar `generateResolver.ts`). |
| `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices` | Posicionamento de elementos flutuantes / floating-vue; útil para o `v-tooltip="null"` existente e para entender padrões de overlay/placement (mesmo optando por Floating UI direto). |
| `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices` | Navegação por teclado, foco/`useActiveElement`, gestão de `keydown` — núcleo da reimplementação do menu acessível. |
| `.claude/skills/vue-router-best-practices` | `goToRoute` faz `router.push` por nome/rota; garante uso correto de navegação programática e edge cases (router não configurado). |
| `.claude/skills/vue-typescript-best-practices` | Tipagem de `defineProps`/`defineExpose`, refs a elementos, handlers de evento. |
| `.claude/skills/vue-unocss-styling-best-practices` | Reproduzir a aparência do overlay com variáveis do tema Max / classes utilitárias. |
| `.claude/skills/vue-vitest-testing-best-practices` | Ajustar os testes (Teleport + `attachTo`, `nextTick`, fake timers para o bloqueio de 200ms, `findComponent`). |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Garantir 4 espaços, aspas simples, ponto e vírgula, sem trailing comma; SCSS válido. |

Skills **não** necessárias (e por quê): `vue-inputs-masks-validation-*` (não é input de
formulário), `vue-virtual-scroller-*` (lista pequena, sem virtualização), `vue-dayjs-*`,
`vue-uppy-*`, `vue-pdf-*`, `vue-chartjs-*` (fora de escopo), `vue-pinia-*` (este componente
**não** usa `usePopoverStore` nem qualquer store).

---

## 10. Riscos e pontos de atenção

- **Exposição de métodos em `<script setup>`.** Ao internalizar o overlay, `vm.toggle` e
  `vm.onClick` só ficarão acessíveis nos testes se houver `defineExpose({ toggle, onClick })`.
  Esquecer isso quebra os casos 2, 3, 4 e 5. **Adicionar `defineExpose`.**

- **Testes dependem de stubs de `Menu`.** Três casos (1, 6, 7) renderizam o item via stub do
  `Menu` que injeta o slot `#item`. Sem o `Menu`, esses testes precisam abrir o overlay real
  (`vm.toggle()` + `nextTick`) e buscar o item no `document.body` (Teleport → usar
  `attachTo: document.body`). **A lógica não muda; só o mecanismo de renderização.** Não alterar
  as asserções de comportamento — apenas o setup de montagem.

- **Teleport + estilos não-scoped.** O overlay vai para `body`; manter o `<style>` **não-scoped**
  (já é). Se algum dia tornarem scoped, o overlay perde o estilo. Documentar.

- **Posicionamento sem PrimeVue.** O `Menu` popup do PrimeVue trazia flip/shift/z-index/portal de
  graça. Reproduzir com Floating UI (`flip`, `shift`, `offset`) + `autoUpdate` e **limpar** o
  `autoUpdate` no fechamento/unmount (vazamento de listeners é o risco clássico). Se optar por
  cálculo manual, atenção a scroll/resize (precisa de listeners próprios).

- **Nova dependência `@floating-ui/dom`.** Confirmar se já existe no `package.json` (PrimeVue a usa
  transitivamente, mas não deve ser importada como dependência direta). Adicionar como dependência
  de runtime da lib. Alternativa sem dep nova é possível, porém inferior.

- **`data` divergente entre handler inline e `onClick`.** O handler inline usa
  `item.data ?? {}`; o `onClick` usa `item.data ?? item.props ?? item.params ?? item.query ?? {}`.
  Um teste verifica exatamente `{ foo: 'bar' }` vindo do inline. **Preservar as duas expressões
  literalmente**; não "unificar".

- **Precedência `route` > `action` em `onClick`.** Se um item tiver ambos, `route` vence (retorna
  antes). Testado. Não inverter.

- **Bloqueio anti-duplo-clique (`useDefaultReset(false, 200)`).** Depende do `watchDebounced` do
  `@vueuse/core` interno ao composable. Manter valor inicial `false` e timer `200`. Testes com
  chamadas síncronas verificam o bloqueio imediato (a segunda chamada é ignorada porque
  `executing.value` já é `true`).

- **`goToRoute` pode lançar.** Se `setLibraryRouter` não foi chamado, `goToRoute` **lança**
  (`Router não configurado`). Nos testes está mockado. Em produção, é responsabilidade do app
  consumidor configurar o router — não tratar aqui (comportamento preexistente).

- **Fechar ao selecionar.** O PrimeVue popup fecha ao clicar num item. Reproduzir chamando
  `hide()` após o handler. Verificar se algum consumidor esperava manter aberto (improvável) —
  o padrão é fechar.

- **Submenus (`item.items`).** O slot custom atual não renderiza aninhamento; confirmar por grep
  nos apps consumidores se submenus são usados. Se não, implementar o caso plano robusto e o
  submenu como extensão opcional, documentando a limitação — sem alterar a API pública.

- **`v-tooltip="null"`.** Diretiva do floating-vue (stubada em teste). Não é PrimeVue; manter.
  Não confundir com dependência a migrar.

- **`id="overlay_menu"` duplicado.** O id era fixo no `Menu`; se dois `MaxPopoverMenu` existirem
  na mesma página, dois `#overlay_menu` colidem. Já era assim no original. **Recomendação:**
  usar um id único (`useId()`/contador) no novo overlay, mantendo o comportamento; ou manter
  `overlay_menu` por compatibilidade estrita (nenhum CSS/JS interno depende do id).
