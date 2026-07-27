# Plano de Migração — MaxInputIconPicker (independência do PrimeVue)

> Objetivo: remover toda dependência de PrimeVue deste componente, preservando 100% da API pública, dos estilos e do comportamento. Este documento é autossuficiente: um agente futuro deve conseguir executar a migração lendo APENAS este arquivo + os fontes referenciados.
>
> Fonte real do componente: `src/components/MaxInputIconPicker.vue` (versão da working tree — usa os endpoints curados `/api/icons/picker`).
> Nível de dificuldade: **alta**.

---

## 1. Componente

- **Nome:** `MaxInputIconPicker`
- **Arquivo:** `src/components/MaxInputIconPicker.vue`
- **Função:** campo de formulário que exibe um "trigger" (ícone atual + label + chevron) dentro de `InputBase`. Ao clicar, abre um painel lateral inferior (Drawer `position="bottom"`, altura `90dvh`) com um campo de busca e uma **grade virtualizada** de ícones curados (8 colunas). Os SVGs são buscados **sob demanda** conforme o scroll. Selecionar um ícone atualiza o `v-model` e fecha o painel.
- **Aliases de exportação:** conferir/registrar em `src/index.ts` (ex.: `MaxInputIconPicker`, `InputIconPicker`, `IconPicker`). NÃO alterar os aliases existentes durante a migração — apenas garantir que continuem apontando para o mesmo arquivo.

---

## 2. Dependências do PrimeVue (a remover)

O componente importa três componentes PrimeVue diretamente:

```ts
import PrimeInputText from 'primevue/inputtext';
import Drawer from 'primevue/drawer';
import VirtualScroller from 'primevue/virtualscroller';
```

Além disso, herda indiretamente PrimeVue via `InputBase.vue` (FloatLabel, IconField, InputIcon, Message) — **essa dependência é resolvida na migração de `InputBase`, que é pré-requisito** (ver seção 10).

### 2.1 `primevue/inputtext` (PrimeInputText)

Uso real (campo de busca dentro do painel):

```html
<div class="picker-search-area">
    <PrimeInputText v-model="search" placeholder="Pesquisar ícones..." fluid />
</div>
```

- Recebe `v-model="search"` (string), `placeholder` e `fluid` (largura 100%).
- Renderiza um `<input class="p-inputtext">`.

### 2.2 `primevue/drawer` (Drawer)

Uso real (painel lateral inferior):

```html
<Drawer
    v-model:visible="visible"
    header="Escolha um ícone"
    position="bottom"
    class="max-icon-picker-drawer"
>
    <!-- área de busca -->
    <!-- estados (loading / vazio) -->
    <!-- VirtualScroller -->
</Drawer>
```

- `v-model:visible` (boolean) controla abertura/fechamento.
- `header` = título exibido no topo.
- `position="bottom"` = desliza a partir da base da viewport.
- `class="max-icon-picker-drawer"` = altura `90dvh` (via SCSS).
- Fornece overlay/máscara, animação de entrada/saída, fechar por botão "X", por clique fora e por tecla `Esc` (comportamentos padrão do Drawer PrimeVue que devem ser preservados).

### 2.3 `primevue/virtualscroller` (VirtualScroller)

Uso real (grade virtualizada de linhas — cada "item" é uma linha de até 8 ícones):

```html
<VirtualScroller
    v-else
    :items="rows"
    :itemSize="40"
    :style="{ height: 'calc(90dvh - 140px)' }"
    class="icon-virtual-list"
    @scroll="onScrollerScroll"
>
    <template #item="{ item, options }">
        <div class="icon-row" :data-row-index="options.index">
            <div
                v-for="icon in (item as IconEntry[])"
                :key="icon.name"
                class="icon-cell"
                :class="{ selected: modelValue === icon.name }"
                @click.stop="selectIcon(icon.name)"
                v-tooltip="icon.name"
                pointer
            >
                <div v-if="svgCache[icon.name]" class="picker-icon-svg" v-html="svgCache[icon.name]" />
                <div v-else class="picker-icon-placeholder" />
            </div>
        </div>
    </template>
</VirtualScroller>
```

- `items` = `rows` (array de linhas, cada linha = `IconEntry[]` com até 8 elementos — `COLS = 8`).
- `itemSize` = `40` (altura fixa de cada linha, em px).
- `#item` slot expõe `item` (a linha) e `options.index` (índice da linha).
- `@scroll` dispara `onScrollerScroll(event)` que lê `scrollTop`/`clientHeight` do elemento rolável para computar linhas visíveis e enfileirar SVGs. **Ponto crítico:** a lógica de fetch sob demanda depende do evento de scroll expor um `event.target` (o container rolável) com `scrollTop` e `clientHeight`. O substituto deve fornecer o mesmo (ver seção 5.3).

---

## 3. Dependências internas (preservar)

### 3.1 `InputBase.vue` (`src/components/InputBase.vue`)
- Wrapper obrigatório (convenção do projeto). O trigger fica dentro dele via slot default.
- Recebe `v-bind="props"`, `:done`, `:error`, `:caution` e `@click.stop="openDrawer"`.
- **Não migrar aqui** — é pré-requisito migrado separadamente.

### 3.2 `MaxIcon.vue` (`src/components/MaxIcon.vue`)
- Usado no trigger (ícone atual, chevron) e nos estados de loading (`svg-spinners:ring-resize`).
- Já é interno; **não depende de PrimeVue**. Usa `useIconStore` (`src/stores/useIcon.Store.ts`) para carregar SVGs via Iconify/cache.

### 3.3 `useIconStore` (`src/stores/useIcon.Store.ts`)
- Store Pinia que cacheia SVGs de ícones Iconify (usado por `MaxIcon`, indiretamente). O picker **NÃO** usa este store para a grade — a grade tem seu próprio cache local (`svgCache`) alimentado pelo endpoint `svgUrl`. Manter essa separação.

### 3.4 Endpoints curados (preservar exatamente)
- **Lista:** `GET {listUrl}` e `GET {listUrl}?q={query}` — default `listUrl = '/api/icons/picker'`. Retorna `IconEntry[]` (`{ id, name, search }`).
- **SVG sob demanda:** `POST {svgUrl}` — default `svgUrl = '/api/icons/picker/svg'`. Body `{ names: string[] }` (máx. 200 por request). Retorna `Record<string, string>` (name → svg string).
- Cabeçalhos: lista usa `Accept: application/json`; svg usa `Content-Type: application/json` + `Accept: application/json`.

### 3.5 `@maxvue/max-use` (fonte em `../MaxUse`)
- `hasContent` — usado em validação (`isRequiredDone`, `testIsDone`).
- `watchDebounced` — usado para debounce da busca (400ms).
- Ambos são utilitários puros; **não dependem de PrimeVue**. Manter os imports.

### 3.6 Diretiva `v-tooltip`
- Aplicada em cada `.icon-cell` (`v-tooltip="icon.name"`) para mostrar o nome do ícone no hover.
- Origem atual: diretiva global do PrimeVue (`Tooltip`). Ao remover PrimeVue, substituir pela diretiva `v-tooltip` do **FloatingVue** (`floating-vue`), que expõe a mesma diretiva `v-tooltip` com string simples — mudança transparente no template. Ver seção 5.4.

---

## 4. API pública a preservar (contrato imutável)

### 4.1 `v-model`
```ts
const modelValue = defineModel<string>({ default: '' });
```
- `update:modelValue` emite `string` (nome do ícone, ex.: `mdi:home`).

### 4.2 Props (assinatura exata — NÃO alterar nomes, tipos nem defaults)
```ts
withDefaults(defineProps<{
    color?: string;            // cor aplicada ao ícone selecionado no trigger
    disabled?: boolean;        // desabilita o campo
    float?: boolean;           // ativa estilo FloatLabel
    msg?: string;              // mensagem de feedback (alias)
    message?: string;          // mensagem de feedback
    iconMessage?: string;      // ícone da mensagem
    label?: string;            // rótulo do campo
    done?: boolean;            // estado de conclusão manual
    error?: string | boolean;  // mensagem/estado de erro
    caution?: string | boolean;// mensagem/estado de atenção
    required?: boolean;        // obrigatório
    placeholder?: string;      // placeholder quando nada selecionado
    listUrl?: string;          // URL base lista curada
    svgUrl?: string;           // URL SVGs curados (POST)
}>(), {
    done: undefined,
    required: false,
    caution: undefined,
    disabled: false,
    error: undefined,
    listUrl: '/api/icons/picker',
    svgUrl: '/api/icons/picker/svg'
});
```

### 4.3 Emits
```ts
defineEmits<{ 'update:modelValue': [value: string] }>();
```

### 4.4 Atributos herdados via `useAttrs`
- `attrs.errMsg` / `attrs.error_message` / `attrs.error_msg` — mensagem de erro customizada usada em `error_msg` computed. Preservar leitura via `useAttrs()`.

### 4.5 Comportamentos observáveis a preservar
- Trigger mostra o ícone atual (ou `tabler:icons-filled` se vazio), o label (`modelValue || placeholder || 'Escolha um ícone'`) e um chevron.
- `disabled` bloqueia a abertura do painel.
- Ao abrir: reseta `search`, `curatedIcons`, `svgCache`, fila de fetch; então busca a lista curada.
- Busca com debounce de 400ms: `< 2` chars recarrega lista completa; `>= 2` busca `?q=`.
- Estados de UI: loading (spinner), "Nenhum ícone encontrado para {search}" (quando `search.length >= 2` e vazio), spinner quando lista vazia sem loading.
- Grade de 8 colunas, linhas de 40px, SVG sob demanda (batch 200, debounce 150ms, reagenda sobras).
- Pré-carregamento inicial das primeiras ~15 linhas (`Math.ceil(600/40)+2`).
- Selecionar ícone: seta `modelValue`, recalcula `isDone`, fecha painel.
- Lógica de validação `done`/`caution`/`error`/`required` idêntica (`testIsDone`, `caution`, `error_msg`, `isRequiredDone`).

---

## 5. Estratégia de substituição

Manter TODO o `<script setup>` de lógica (fetch, cache, fila, validação, computeds) **sem alteração**, exceto os pontos onde ele interage com os componentes PrimeVue. As substituições são apenas de **camada de apresentação/UI primitives**.

### 5.1 Substituir `PrimeInputText` → `<input>` nativo
- Trocar `<PrimeInputText v-model="search" placeholder="..." fluid />` por um `<input>` HTML puro com `v-model="search"` e classe `p-inputtext` (para herdar o estilo já existente de `InputBase.vue`/tema) ou nova classe `picker-search-input`.
- Sugerido:
  ```html
  <input v-model="search" class="p-inputtext picker-search-input" placeholder="Pesquisar ícones..." type="text" />
  ```
- Manter `width: 100%` no SCSS (equivalente ao `fluid`).

### 5.2 Substituir `Drawer` → `<dialog>`/teleport + CSS (painel inferior nativo)
Duas opções válidas; **recomenda-se Teleport + overlay** por controle total do posicionamento `bottom` e animação:

**Opção recomendada — Teleport para `<body>` + overlay CSS:**
```html
<Teleport to="body">
    <Transition name="max-drawer">
        <div v-if="visible" class="max-drawer-mask" @click.self="visible = false">
            <div class="max-icon-picker-drawer max-drawer-panel" role="dialog" aria-modal="true">
                <div class="max-drawer-header">
                    <span class="max-drawer-title">Escolha um ícone</span>
                    <button type="button" class="max-drawer-close" @click="visible = false" aria-label="Fechar">
                        <MaxIcon i="mdi:close" size="1" :dark="0.5" />
                    </button>
                </div>
                <div class="max-drawer-content">
                    <!-- área de busca, estados, lista virtualizada -->
                </div>
            </div>
        </div>
    </Transition>
</Teleport>
```
- Preservar `class="max-icon-picker-drawer"` no painel para reaproveitar o SCSS existente (altura `90dvh` etc.).
- Fechar: clique no overlay (`@click.self`), botão "X", e tecla `Esc` (adicionar listener `keydown` enquanto `visible`, removido no unmount / ao fechar).
- Bloquear scroll do body enquanto aberto (adicionar/remover classe/`overflow:hidden` em `document.body` no `watch(visible)`).
- Animação `position: bottom`: painel ancorado à base, `transform: translateY(100%)` → `translateY(0)` via `Transition` (`.max-drawer-enter-from`/`leave-to`).

**Opção alternativa — `<dialog>` nativo:** usar `<dialog ref>` com `dialog.showModal()`/`dialog.close()` sincronizados por `watch(visible)`. Fornece overlay (`::backdrop`), `Esc` e foco nativos, mas o posicionamento `bottom` full-width exige reset de estilos default do `<dialog>` (margin/padding/max-width). Escolher esta apenas se o time preferir semântica nativa.

> Em ambos os casos, o `v-model:visible` interno vira controle direto de `visible.value` (já é um `ref` local). NÃO expor `visible` na API pública (não fazia parte do contrato).

### 5.3 Substituir `VirtualScroller` → virtualização sem PrimeVue

Preferência conforme skill do projeto (seção 9): usar **`vue-virtual-scroller`** (`RecycleScroller`), pois todos os itens têm **altura fixa idêntica (40px)** — cenário ideal para `RecycleScroller` (altíssima performance). O `@tanstack/vue-virtual` citado na descrição da tarefa é aceitável como equivalente; abaixo detalho ambos.

**Modelo de dados mantido:** `rows` = `IconEntry[][]` (linhas de 8). Cada item virtualizado = **uma linha**.

**Opção A (recomendada) — `RecycleScroller` do `vue-virtual-scroller`:**
```html
<RecycleScroller
    ref="scroller"
    class="icon-virtual-list"
    :items="rowsWithId"
    :item-size="40"
    key-field="_rowKey"
    :style="{ height: 'calc(90dvh - 140px)' }"
    @scroll.native="onScrollerScroll"
>
    <template #default="{ item }">
        <div class="icon-row">
            <div v-for="icon in item.cells" :key="icon.name" ... >...</div>
        </div>
    </template>
</RecycleScroller>
```
- `RecycleScroller` exige `key-field`: criar `rowsWithId = computed(() => rows.value.map((cells, i) => ({ _rowKey: i, cells })))`.
- O slot `#default` expõe `{ item, index }` (não `options.index`) — ajustar template (usar `index` se necessário; o `data-row-index` é apenas cosmético e pode ser removido ou setado com `index`).
- **Evento de scroll:** `RecycleScroller` emite scroll no seu container interno `.vue-recycle-scroller`. Usar `@scroll.native` ou adicionar listener no elemento rolável via `ref`. Garantir que `onScrollerScroll` receba um `event.target` com `scrollTop`/`clientHeight` (o `.vue-recycle-scroller` os fornece). Validar em runtime; se o `event.target` não for o elemento rolável, capturar o elemento via `scroller.value.$el` e ler dele.
- Importar CSS: `import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';` (ou replicar o mínimo necessário no SCSS scoped).
- Registro: importar `RecycleScroller` localmente no componente (`import { RecycleScroller } from 'vue-virtual-scroller';`). Adicionar `vue-virtual-scroller` a `dependencies` do `package.json`.

**Opção B — `@tanstack/vue-virtual`:**
- `useVirtualizer({ count: rows.value.length, getScrollElement: () => parentRef.value, estimateSize: () => 40, overscan: 2 })`.
- Renderizar um container com `height: totalSize` e posicionar cada linha absolutamente via `translateY(virtualRow.start)`.
- Fornece controle total do container rolável (`parentRef`), tornando o `onScrollerScroll` trivial (ler `parentRef.value.scrollTop`/`clientHeight`) — vantagem para a lógica de fetch sob demanda. Desvantagem: mais código de posicionamento manual.
- Adicionar `@tanstack/vue-virtual` a `dependencies`.

> **Decisão:** usar **Opção A (RecycleScroller)** por alinhamento com a skill do projeto e itens de tamanho fixo; documentar Opção B como fallback caso o acesso ao elemento rolável no `@scroll` seja problemático.

### 5.4 Substituir diretiva `v-tooltip` (PrimeVue) → `v-tooltip` (FloatingVue)
- Registrar globalmente FloatingVue no `install()` da lib (ou importar a diretiva localmente) — ver skill floating-vue (seção 9). A sintaxe `v-tooltip="icon.name"` (string simples) é idêntica, então **o template não muda**.
- Verificar em `tests/setup.ts`: hoje há stub de `v-tooltip` (`v-maska`/`v-tooltip` stubbed). Manter o stub para testes (não precisa de FloatingVue real no teste).

### 5.5 Lógica preservada integralmente (copiar sem mudança)
- `enqueueSvgFetch`, `fetchCuratedIcons`, `preloadInitialSvgs`, `onScrollerScroll` (ajustar apenas a obtenção do elemento rolável se necessário), `toRows`, `rows`, `flatIcons`, `openDrawer`, `selectIcon`, `testIsDone`, `caution`, `error_msg`, `isRequiredDone`, watchers de `search` e `modelValue`, constantes `COLS=8`, itemSize `40`, batch `200`, debounces `150`/`400`.

---

## 6. Passos de implementação (ordem)

1. **Pré-requisito:** confirmar que `InputBase.vue` já foi migrado (sem PrimeVue). Se não, PARAR e migrar `InputBase` primeiro (ver seção 10).
2. Adicionar dependências ao `package.json`: `vue-virtual-scroller` (e `floating-vue` se ainda não presente na lib). Rodar `npm install` (requer `../MaxUse` presente).
3. No `<script setup>` de `MaxInputIconPicker.vue`, remover os 3 imports PrimeVue e adicionar:
   ```ts
   import { RecycleScroller } from 'vue-virtual-scroller';
   import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
   ```
4. Adicionar `rowsWithId` computed (envelope `{ _rowKey, cells }`) para o `key-field` do RecycleScroller.
5. Template — substituir campo de busca: `PrimeInputText` → `<input class="p-inputtext picker-search-input" v-model="search" ...>`.
6. Template — substituir `<Drawer>` por `<Teleport to="body">` + overlay + painel (seção 5.2), preservando `class="max-icon-picker-drawer"`, header "Escolha um ícone" e o conteúdo interno (busca, estados, lista).
7. Template — substituir `<VirtualScroller>` por `<RecycleScroller>` (seção 5.3), ajustando slot para `#default="{ item, index }"` e iterando `item.cells`.
8. Adicionar controle de `Esc` e bloqueio de scroll do body em `watch(visible, ...)`; limpar listeners em `onUnmounted`.
9. Ajustar `onScrollerScroll` para obter o elemento rolável de forma robusta (via `event.target` ou `ref` do scroller) — validar que `scrollTop`/`clientHeight` são lidos corretamente.
10. Garantir que `v-tooltip="icon.name"` continua funcionando (FloatingVue global ou import local); manter stub nos testes.
11. Migrar/estender os estilos (seção 7): converter os seletores que dependiam do `.p-drawer` do PrimeVue para as novas classes (`.max-drawer-mask`, `.max-drawer-panel`, `.max-drawer-header`, transições).
12. Rodar `npm run type-check`, `npm run lint`, `npm run test` (e o teste do componente, se existir). Validar manualmente no `npm run dev:playground`.
13. Se o arquivo foi apenas editado (não renomeado/criado), **não** é necessário rodar `generateResolver.ts`. Rodar apenas se algum novo `.vue` for adicionado.

---

## 7. Estilos

- **Preservar integralmente** o bloco `<style lang="scss">` atual (classes `.max-input-icon-picker`, `.icon-picker-trigger`, `.trigger-label`, `.max-icon-picker-drawer`, `.picker-search-area`, `.picker-state-area`, `.icon-virtual-list`, `.icon-row`, `.icon-cell`, `.picker-icon-svg`, `.picker-icon-placeholder`). Todas usam variáveis do tema Max (`--background-*`, `--max-primary-*`) e devem continuar iguais.
- **`.max-icon-picker-drawer`** hoje só define `height: 90dvh`. No modelo Teleport, aplicar essa classe ao painel (`.max-drawer-panel.max-icon-picker-drawer`) e ADICIONAR os estilos que o PrimeVue fornecia (que somem ao remover `.p-drawer`):
  - Overlay/máscara: `.max-drawer-mask { position: fixed; inset: 0; z-index: 1100; background: rgb(0 0 0 / 40%); display: flex; align-items: flex-end; }`
  - Painel: `position` na base, `width: 100%`, `background: var(--background-0)` (conferir cor de superfície do tema), `border-top-left-radius`/`right-radius`, sombra.
  - Header: `.max-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }` + `.max-drawer-title` (peso/tamanho semelhante ao header do PrimeVue) + `.max-drawer-close` (botão sem borda, `cursor: pointer`).
  - Conteúdo: `.max-drawer-content { padding: 0 16px 16px; }` (o cálculo `calc(90dvh - 140px)` de `.picker-state-area`/lista assume ~140px de header+busca; manter esse padding coerente).
  - Transição (`position: bottom`):
    ```scss
    .max-drawer-enter-active, .max-drawer-leave-active { transition: opacity 0.2s ease; }
    .max-drawer-enter-from, .max-drawer-leave-to { opacity: 0; }
    .max-drawer-enter-active .max-drawer-panel, .max-drawer-leave-active .max-drawer-panel { transition: transform 0.25s ease; }
    .max-drawer-enter-from .max-drawer-panel, .max-drawer-leave-to .max-drawer-panel { transform: translateY(100%); }
    ```
- **`.picker-search-input`**: garantir `width: 100%` (substitui `fluid`). O estilo base `.p-inputtext { height: 36px; ... }` já existe em `InputBase.vue` (global) e será reaproveitado ao manter a classe `p-inputtext`. Se `InputBase` migrado renomear essa classe, ajustar aqui.
- **RecycleScroller:** se optar por não importar o CSS do pacote, replicar no SCSS o mínimo: `.vue-recycle-scroller { overflow-y: auto; } .vue-recycle-scroller__item-wrapper { position: relative; } .vue-recycle-scroller__item-view { position: absolute; width: 100%; }`. A classe `.icon-virtual-list` (já existente, `width: 100%`) continua aplicável ao scroller.
- Seguir convenções: `<style lang="scss">`, 4 espaços, variáveis do tema (sem hex/cores cruas — ver skill UnoCSS seção 9), aspas simples no script, ponto e vírgula, ordem Template → Script → Style.

---

## 8. Testes / verificação

- **Existência de teste:** verificar `tests/components/MaxInputIconPicker.test.ts`. Se existir, mantê-lo verde; se não, considerar criar (usar skill Vitest, seção 9).
- **Mocks já globais** (`tests/setup.ts`): `fetch`, `localStorage`, `getComputedStyle`, `indexedDB`, `virtual:uno.css`, PrimeVue + Pinia globais, stub de `v-tooltip` e `v-maska`. Mockar `fetch` para responder:
  - `GET /api/icons/picker` → `IconEntry[]`.
  - `POST /api/icons/picker/svg` → `Record<string,string>`.
- **Casos de teste a cobrir (comportamento preservado):**
  1. Render do trigger: mostra `tabler:icons-filled` + `'Escolha um ícone'` quando `modelValue` vazio; mostra o nome quando preenchido.
  2. `disabled` impede `openDrawer` (painel não abre; `visible` permanece false).
  3. Clicar no trigger abre o painel (`visible === true`) e dispara `fetchCuratedIcons` (fetch chamado com a `listUrl`).
  4. Digitar `>= 2` chars na busca dispara `fetch` com `?q=` após o debounce (usar fake timers para os 400ms).
  5. Estado "Nenhum ícone encontrado para {search}" quando lista vazia e `search.length >= 2`.
  6. Selecionar um ícone emite `update:modelValue` com o nome e fecha o painel (`visible === false`).
  7. `enqueueSvgFetch` faz POST em batch (máx 200) para `svgUrl`; `svgCache` é populado e o `.picker-icon-svg` renderiza o `v-html`.
  8. Validação: `required` sem valor → `caution`/erro "Campo obrigatório"; com valor → `done`.
- **Virtualização em happy-dom:** `RecycleScroller`/VirtualScroller dependem de medidas de layout que happy-dom não calcula. Se os testes atuais montavam o VirtualScroller, revisar: pode ser necessário stubar o `RecycleScroller` (componente global stub) e testar a lógica (`rows`, `enqueueSvgFetch`, `onScrollerScroll` chamado com um `event` sintético contendo `{ target: { scrollTop, clientHeight } }`) de forma isolada.
- **Comandos:**
  ```bash
  npm run type-check
  npm run lint
  npx vitest run tests/components/MaxInputIconPicker.test.ts
  npm run test
  ```
- **Verificação manual:** `npm run dev:playground` — abrir painel, rolar a grade e confirmar carregamento de SVGs sob demanda, busca, seleção, fechar por overlay/Esc.

---

## 9. Skills necessárias (caminho + justificativa)

- **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-virtual-scroller-best-practices/SKILL.md`**
  Justificativa: substituição direta do `VirtualScroller` do PrimeVue. A skill orienta a escolha entre `RecycleScroller` (itens de tamanho fixo — nosso caso, 40px) e `DynamicScroller`, e padrões de integração/performance. Base para a seção 5.3 (Opção A).

- **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-floating-vue-tooltips-popovers-best-practices/SKILL.md`**
  Justificativa: a grade usa `v-tooltip="icon.name"` (tooltip simples de texto no hover). Ao remover a diretiva `v-tooltip` do PrimeVue, esta skill cobre o uso da diretiva `v-tooltip` do FloatingVue como substituto transparente (seção 5.4).

- **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md`**
  Justificativa: convenções obrigatórias da lib (SFC `<script setup lang="ts">`, 4 espaços, ordem dos blocos, uso de `InputBase`, testes com Vitest/@vue/test-utils, quando rodar `generateResolver.ts`).

- **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-unocss-styling-best-practices/SKILL.md`**
  Justificativa: os estilos novos (overlay/drawer, transições) devem usar variáveis do tema Max (sem hex crus) e utilitários do `presetMaxUno`; a skill cobre atalhos e conformidade com o tema Aura/Max.

- **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-vitest-testing-best-practices/SKILL.md`**
  Justificativa: escrever/ajustar os testes (mock de `fetch`, fake timers para debounce, isolamento de store/composables, stub do scroller em happy-dom).

---

## 10. Riscos e pontos de atenção

- **Ordenação — `InputBase` primeiro (bloqueante):** `MaxInputIconPicker` usa `<InputBase>` como wrapper, que ainda importa PrimeVue (FloatLabel, IconField, InputIcon, Message). Este componente só fica 100% independente **depois** que `InputBase` for migrado. Executar a migração de `InputBase` ANTES. Se o campo de busca reutilizar a classe `.p-inputtext` definida em `InputBase.vue`, confirmar que ela permanece após a migração de `InputBase` (ou migrar a definição junto).
- **Fetch sob demanda x elemento rolável:** a lógica `onScrollerScroll` depende de `event.target.scrollTop`/`clientHeight` do container que rola. `RecycleScroller` pode não expor esse elemento diretamente no `@scroll`; validar e, se preciso, ler via `ref` do scroller (`$el`) ou migrar para `@tanstack/vue-virtual` (Opção B), onde o `parentRef` é controlado por nós. Regressão silenciosa aqui = SVGs param de carregar ao rolar.
- **Virtualização em happy-dom:** medidas de layout não existem no ambiente de teste; testes que dependiam do VirtualScroller renderizando linhas podem quebrar. Preferir stub do scroller e testar a lógica isoladamente (seção 8).
- **Comportamentos do Drawer que somem:** ao trocar por Teleport, reimplementar manualmente: overlay/máscara, fechar por clique-fora, fechar por `Esc`, bloqueio de scroll do body, foco/trap (acessibilidade), `z-index` correto (acima de outros overlays/MaxPopover — atentar ao override de `z-index` do `.p-inputicon` mencionado em `InputBase.vue`). Faltar qualquer um é regressão de UX.
- **`position="bottom"` + `90dvh`:** garantir ancoragem à base e animação `translateY`. O `calc(90dvh - 140px)` da lista/estados pressupõe ~140px de header+busca; se o novo header tiver altura diferente, ajustar o `calc` para não cortar/estourar a lista.
- **Estilos com prefixo `.p-`:** qualquer regra que dependia de classes internas do PrimeVue (`.p-drawer`, `.p-drawer-content`, `.p-inputtext` do drawer) deixa de existir; recriar o necessário com as novas classes. Não deixar seletores órfãos.
- **`v-html` do SVG:** os SVGs vêm de endpoint curado/confiável (`/api/icons/picker/svg`). Manter a confiança na origem; não introduzir sanitização que altere o comportamento atual (contrato preservado), mas registrar como ponto de atenção de segurança se a origem deixar de ser confiável.
- **`fluid` → `width:100%`:** garantir que o input de busca ocupe 100% como antes; sem isso, o layout do painel muda.
- **Dependências novas no bundle:** `vue-virtual-scroller` (e possivelmente `floating-vue`) passam a ser dependências da lib. Confirmar que não são bundladas indevidamente nas entradas erradas (a lib tem multi-entry; CSS só é injetado em `index.es.js`). Conferir tree-shaking/peer deps.
- **Não rodar `generateResolver.ts`** a menos que um novo `.vue` seja criado — aqui apenas editamos o existente.
