# Plano de Migração — MaxUserSection (Independência do PrimeVue)

> Documento autossuficiente. Uma IA futura deve conseguir executar esta migração lendo apenas
> este arquivo + `src/components/MaxUserSection.vue` (+ opcionalmente `src/components/MaxIcon.vue`
> e `src/components/MaxUserAvatar.vue`, que **não** são alterados aqui). **Não modificar código-fonte
> fora do escopo deste plano.** Convenções obrigatórias: `<script setup lang="ts">`, indentação de
> 4 espaços, aspas simples, ponto e vírgula, sem trailing commas, ordem de blocos
> **Template → Script → Style**.

---

## 1. Componente

- **Nome:** `MaxUserSection`
- **Caminho:** `src/components/MaxUserSection.vue`
- **Nível de dificuldade:** `media`
- **Objetivo da migração:** substituir `TieredMenu` do PrimeVue (`primevue/tieredmenu`, usado em
  modo `popup`) por uma implementação própria de menu dropdown com:
  - **posicionamento** flutuante do overlay ancorado ao container `.user-section` (recomendado:
    **Floating UI**),
  - **navegação por teclado** (setas, Home/End, Enter/Espaço, Escape, Tab),
  - **abertura/fechamento** via método `toggle(event)`, hoje delegado a `menu.value.toggle(event)`,
  - fechamento ao clicar fora / pressionar Escape.
  - Manter intactos `MaxUserAvatar`, `MaxIcon`, todos os `defineProps`/`defineEmits` e o botão de
    impersonação (`.impersonated-btn`), que **não** usam PrimeVue.

---

## 2. Dependências do PrimeVue (trechos reais)

O **único** acoplamento ao PrimeVue neste arquivo é o `TieredMenu` (modo popup):

```ts
// script setup
import TieredMenu from 'primevue/tieredmenu';
```

```vue
<!-- template -->
<TieredMenu ref="menu" id="overlay_tmenu" :model="menuItems" popup>
    <template #item="{ item }">
        <div v-if="item.label" class="main-item-menu-div" @click="item.exec && item.exec()">
            <MaxIcon v-if="item.icon" :icon="item.icon" />
            <div>
                {{ item.label }}
            </div>
        </div>
    </template>
</TieredMenu>
```

```ts
// método que aciona o overlay do PrimeVue
const menu = ref();

const toggle = (event: any) => {
    menu.value.toggle(event);
};
```

### API do PrimeVue `TieredMenu` (popup) usada, e o que precisa ser reproduzida

- **Prop `:model`** — array de itens (`menuItems`, computed a partir de `defaultItems`/`props.items`).
  Cada item usa campos **próprios** (`label`, `icon`, `exec`, e opcionalmente `separator: true`),
  **não** os campos padrão do PrimeVue (`command`/`url`). O `#item` slot é totalmente customizado —
  ver seção 4.
- **Prop `popup`** — o menu é um overlay flutuante que aparece ao lado/abaixo do elemento
  clicado (o container raiz, via `@click.stop="toggle"`). Precisa ser reimplementado com
  posicionamento flutuante e teleport para `body`.
- **Slot `#item="{ item }"`** — render por item, incluindo o caso `separator: true` (o slot atual
  usa `v-if="item.label"`, então separadores — sem `label` — simplesmente não renderizam nada
  visível; **preservar esse comportamento**: um item `{ separator: true }` não deve quebrar a
  renderização, apenas não desenha conteúdo pelo slot atual. Se a nova implementação decidir
  desenhar uma linha divisória visual para separadores, isso é uma melhoria opcional, não um
  requisito — a paridade mínima é "não quebrar".
- **`id="overlay_tmenu"`** — id do overlay (não referenciado por CSS interno; pode ser mantido no
  elemento raiz do novo overlay por compatibilidade, mas não é funcionalmente necessário).
- **Método de instância `menu.value.toggle(event)`** — abre/fecha e posiciona relativo à âncora.
  É o mecanismo que `toggle(event)` (chamado pelo `@click.stop="toggle"` do container raiz) usa.
  Precisa de um equivalente próprio — ver seção 5.

Nenhum estilo `.p-tieredmenu*`/`.p-menu*` do PrimeVue é usado no `<style>` deste arquivo
(verificado: o CSS só estiliza `.user-section`, `.user-text-div`, `.button-avatar` — inclusive um
seletor residual `.p-avatar` dentro de `.button-avatar` que pertence ao `MaxUserAvatar`, não ao
`TieredMenu`, e **não é afetado** por esta migração —, `.main-item-menu-div` e `.impersonated-btn*`).
Portanto os estilos deste componente **não** dependem de classes PrimeVue do `TieredMenu` e podem
permanecer como estão (ver seção 7).

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação nesta migração |
|-------------|--------|-------|---------------------|
| `MaxUserAvatar` | `./MaxUserAvatar.vue` | Avatar exibido quando `props.userId` é fornecido. | **Preservar** exatamente. Não migrar aqui. |
| `MaxIcon` | `./MaxIcon.vue` | Ícone de cada item do menu (`item.icon`) e do botão de impersonação. | **Preservar.** Não migrar aqui. |
| `computed`, `ref` | `vue` | `defaultItems`, `menuItems` computam a lista de itens; `menu` é a ref do overlay. | `menu` passa a apontar para a nova implementação (ver seção 5). |

### Notas de comportamento a preservar (do `<script setup>` real)

- `defaultItems` monta a lista padrão de itens (perfil, separador, configurações, dark mode
  condicional ao `props.darkMode`, suporte, sair) e, se `props.version` existir, acrescenta um
  item final `{ label: 'Versão: ' + props.version }` **sem** `icon`/`exec` (não clicável de fato,
  já que o handler do template é `item.exec && item.exec()` — sem `exec`, o clique não faz nada).
- `menuItems = computed(() => props.items ?? defaultItems.value)` — override total do menu via
  prop `items`.
- `toggle(event)` — delega ao overlay. **Assinatura pública deve ser preservada** (é chamada pelo
  `@click.stop="toggle"` no elemento raiz `.user-section`).
- `onEndImpersonate()` — apenas `emit('endImpersonate')`. Não usa PrimeVue; **preservar** sem
  alteração.
- O clique no item chama **diretamente** `item.exec && item.exec()` no template (não há um
  `onClick` interno como em `MaxPopoverMenu`). **Preservar esse handler inline idêntico.**

---

## 4. API pública a preservar

Contrato observável por quem consome a lib — **NÃO pode mudar**.

### Props (todas opcionais, com defaults reais)

| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `name` | `string` | — | Nome do usuário. |
| `companyName` | `string` | — | Nome da empresa (exibido se presente). |
| `userId` | `string \| number` | — | Se presente, exibe `MaxUserAvatar`. |
| `avatarUrl` | `string` | — | URL da imagem do avatar. |
| `darkMode` | `boolean` | — | Controla o label do item de dark mode. |
| `isImpersonated` | `boolean` | — | Exibe o botão de encerrar impersonação. |
| `version` | `string` | — | Item extra no fim do menu. |
| `items` | `any[]` | — | Sobrescreve o menu padrão por completo. |
| `labelProfile` | `string` | `'Meu perfil'` | — |
| `labelSettings` | `string` | `'Configurações'` | — |
| `labelDarkModeOn` | `string` | `'Ativar Modo escuro'` | — |
| `labelDarkModeOff` | `string` | `'Desativar Modo escuro'` | — |
| `labelSupport` | `string` | `'Suporte'` | — |
| `labelLogout` | `string` | `'Sair'` | — |
| `labelEndImpersonate` | `string` | `'SAIR'` | — |
| `labelEndImpersonateSub` | `string` | `'(RETORNAR)'` | — |

### Emits

- `profile`, `settings`, `toggleDarkMode`, `support`, `logout`, `endImpersonate` — todos sem
  payload. **Não** introduzir emits novos nem alterar os existentes.

### Slots

- Nenhum `defineSlots`/`<slot>` público hoje (o `#item` do `TieredMenu` é interno, não exposto ao
  consumidor da lib). **Não** introduzir slots novos que alterem a API pública — a reimplementação
  do item do menu deve ser interna ao componente.

### Comportamento de item (contrato de dados interno)

Cada item do menu (padrão ou vindo de `props.items`) pode conter `label`, `icon`, `exec` (função
sem argumentos) e/ou `separator: true`. O clique em um item com `label` chama `item.exec?.()`.
Itens sem `label` (separadores) não renderizam conteúdo pelo slot atual.

---

## 5. Estratégia de substituição (posicionamento)

Reimplementar o overlay com **HTML nativo + Floating UI**, mantendo o método `toggle` compatível
— mesmo padrão adotado em `migration_plans/MaxPopoverMenu.md` (mesmo tipo de dependência:
overlay de menu popup do PrimeVue).

### 5.1. Estrutura

- **Trigger:** o container raiz inteiro `.user-section` já tem `@click.stop="toggle"` — manter.
  Guardar uma ref ao elemento raiz (ex.: `ref="root_el"`) para servir de âncora padrão quando
  `toggle` for chamado sem `event.currentTarget` utilizável.
- **Overlay:** um novo elemento (ex.: `<Teleport to="body">` com
  `<div v-if="open" id="overlay_tmenu" class="max-user-section-overlay" role="menu" ref="overlay_el" @keydown="onKeydown">`),
  renderizando `v-for="(item, index) in menuItems"`. Para cada item, replicar **exatamente** o
  markup do slot atual:
  ```vue
  <div v-if="item.label" class="main-item-menu-div" role="menuitem" tabindex="-1" @click="item.exec && item.exec()">
      <MaxIcon v-if="item.icon" :icon="item.icon" />
      <div>
          {{ item.label }}
      </div>
  </div>
  ```

### 5.2. Posicionamento — Floating UI (recomendado)

```ts
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
```

- Ao abrir: `computePosition(anchorEl, overlayEl, { placement: 'bottom-end', middleware: [offset(4), flip(), shift({ padding: 8 })] })`
  e aplicar `left`/`top` ao overlay via `position: absolute`. Usar `bottom-end` (não `bottom-start`)
  porque o trigger fica no canto superior direito do layout típico (cabeçalho) — ajustar
  visualmente no playground se necessário.
- Registrar `autoUpdate(anchorEl, overlayEl, updatePosition)` ao abrir e **limpar** (chamar o
  retorno de `autoUpdate`) ao fechar/`onBeforeUnmount`.
- Confirmar/instalar `@floating-ui/dom` em `package.json` (mesma dependência já recomendada para
  `MaxPopoverMenu` — se aquele componente já a tiver adicionado quando este for migrado,
  reaproveitar; senão, adicionar aqui).

### 5.3. Método `toggle` (compatibilidade)

```ts
const open = ref(false);

const show = (event?: any) => {
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

`toggle(event)` mantém a **mesma assinatura pública** já usada pelo `@click.stop="toggle"` no
elemento raiz.

### 5.4. Fechamento

- **Clique fora:** listener em `document` (`pointerdown`/`click`) que fecha se o alvo não estiver
  dentro do overlay nem do trigger (`.user-section`). Adicionar ao abrir, remover ao fechar.
- **Escape:** `keydown` global (ou no overlay) → `hide()`.
- **Ao selecionar um item:** fechar o menu após `item.exec?.()` (o `TieredMenu` popup fecha ao
  clicar num item — reproduzir chamando `hide()` após o handler).

### 5.5. Navegação por teclado (`role="menu"`)

- `ArrowDown` / `ArrowUp` — move o foco para o próximo/anterior item com `label` (pulando
  separadores/itens sem `exec`), com wrap.
- `Home` / `End` — primeiro / último item navegável.
- `Enter` / `Espaço` — ativa o item focado (`item.exec?.()`), depois fecha.
- `Escape` — fecha e devolve foco ao trigger (`.user-section`).
- `Tab` — fecha o menu.
- Ao abrir, focar o primeiro item navegável; `role="menu"`/`role="menuitem"` e
  `aria-orientation="vertical"` no container; `aria-haspopup="menu"`/`aria-expanded` no trigger.

---

## 6. Passos de implementação

1. **Remover import do PrimeVue.** Excluir `import TieredMenu from 'primevue/tieredmenu';`.
2. **Adicionar Floating UI.** `import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';`
   (verificar se já foi adicionado ao `package.json` por uma migração anterior, ex. `MaxPopoverMenu`).
3. **Estado e refs.**
   ```ts
   const open = ref(false);
   const root_el = ref<HTMLElement | null>(null);
   const overlay_el = ref<HTMLElement | null>(null);
   let cleanup_position: (() => void) | null = null;
   ```
   Adicionar `ref="root_el"` ao `<div class="user-section">` no template.
4. **Template do overlay.** Substituir o bloco `<TieredMenu>…</TieredMenu>` por
   `<Teleport to="body"><div v-if="open" id="overlay_tmenu" class="max-user-section-overlay" role="menu" ref="overlay_el" @keydown="onKeydown"><div v-for="(item, i) in menuItems" :key="i">…</div></div></Teleport>`
   conforme seção 5.1, preservando o `v-if="item.label"` e o handler `item.exec && item.exec()`
   idênticos.
5. **`show`/`hide`/`toggle`.** Implementar conforme seção 5.3. Em `show`: `nextTick` → posicionar
   via `computePosition` + `autoUpdate` (guardar cleanup), focar primeiro item, registrar
   listeners globais (clique fora / Escape). Em `hide`: reverter tudo.
6. **Navegação por teclado.** Implementar `onKeydown(e)` conforme seção 5.5.
7. **Preservar sem alterações:** `defaultItems`, `menuItems`, `onEndImpersonate`, todas as props/
   emits, o `MaxUserAvatar`, o `MaxIcon`, e o bloco `.impersonated-btn`.
8. **Limpeza de recursos.** `onBeforeUnmount(() => { cleanup_position?.(); /* remover listeners globais */ });`.
9. **Estilos.** Manter o `<style>` existente e **adicionar** regras para
   `.max-user-section-overlay` (fundo, sombra, borda, z-index) — ver seção 7.
10. **Verificar:** `npm run type-check`, `npm run lint`, `npx vitest run tests/components/MaxUserSection.test.ts`.
11. **Resolver:** **não** regenerar (`generateResolver.ts`) — nenhum `.vue` novo foi criado nem
    renomeado.

---

## 7. Estilos

- **Estilos atuais deste arquivo NÃO dependem do `TieredMenu` do PrimeVue** — mantê-los como estão
  (`.user-section`, `.user-text-div`, `.button-avatar` — incluindo o seletor `.p-avatar` interno,
  que pertence ao `MaxUserAvatar` e não é afetado —, `.main-item-menu-div`, `.impersonated-btn*`).
- **Overlay:** o `TieredMenu` popup fornecia o "cartão" flutuante (fundo, borda, sombra, padding,
  z-index). Ao remover o PrimeVue, recriar esse contêiner:
  ```scss
  .max-user-section-overlay {
      position: absolute;
      z-index: 1100;
      min-width: 12rem;
      padding: 4px 0;
      background: var(--background-0);
      border: 1px solid var(--background-100);
      border-radius: 6px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
  }
  ```
  Ajustar as variáveis exatas para casar com a aparência anterior — comparar no playground.
- **Teleport para `body`:** o overlay teleportado não pode depender de estilos `scoped`. O bloco
  `<style>` atual **já não é `scoped`** — manter assim.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/MaxUserSection.test.ts` — usa um **stub próprio de `TieredMenu`**
(`TieredMenuStub`, que renderiza o slot `#item` para cada entrada de `model` e expõe um método
`toggle()` vazio). Casos e impacto da migração:

1. **`renderiza corretamente`**, **`exibe o nome do usuário`**, **`exibe a empresa...`**,
   **`oculta a empresa...`**, **`exibe o avatar...`** — não dependem do menu; **não devem quebrar**.
2. **`usa labels padrão em pt-BR no menu`**, **`permite sobrescrever as labels`**,
   **`alterna o label de dark mode...`**, **`exibe a versão...`**, **`respeita o override do menu
   via prop items`** — todos buscam `.main-item-menu-div` no DOM montado **sem abrir o menu**
   (o stub atual renderiza os itens sempre, via `v-for` direto no template do stub, sem
   `v-if="open"`). **Impacto:** após a migração, o overlay real só renderiza quando `open === true`
   (dentro do `Teleport`). Esses testes **precisarão ser ajustados** para: (a) remover o stub de
   `TieredMenu` (não existe mais o componente), (b) chamar `wrapper.vm.toggle()` (ou disparar um
   clique no `.user-section`) + `await nextTick()` antes de buscar `.main-item-menu-div`, e
   (c) montar com `attachTo: document.body` para conseguir localizar o conteúdo teleportado (ou
   buscar via `document.body.querySelectorAll(...)` em vez de `wrapper.find`, já que o `Teleport`
   move o DOM para fora da árvore do `wrapper`). **A lógica de negócio testada (labels, dark mode,
   versão, override de itens) não muda** — apenas o mecanismo de renderização/abertura do overlay.
3. **`emite os eventos correspondentes ao clicar nos itens do menu`** — idem: precisa abrir o menu
   primeiro (`vm.toggle()`) e localizar os itens no `body` teleportado antes de clicar. Preservar
   as asserções de `emitted(...)`.
4. **`renderiza o botão de impersonação...`**, **`oculta o botão de impersonação...`** — não
   dependem do menu; **não devem quebrar**.

> **Resumo dos ajustes de teste inevitáveis:** trocar `TieredMenuStub` por abertura real do overlay
> (`vm.toggle()` + `nextTick`) e busca no `document.body` (via `attachTo: document.body` no
> `mount` ou consultando `document.body` diretamente). Manter todas as asserções de comportamento
> (labels, emits, dark mode, versão, override de itens).

### Novos testes recomendados (navegação por teclado / posicionamento)

- Abrir com `toggle`, `ArrowDown`/`ArrowUp` movem foco entre itens; `Enter`/`Espaço` ativam;
  `Escape` fecha.
- Clique fora fecha o overlay.
- Item com `separator: true` (se algum consumidor passar via `props.items`) não quebra a
  renderização.
- Nenhum resíduo de `primevue/*` no arquivo (grep).

### Comandos

```bash
npx vitest run tests/components/MaxUserSection.test.ts
npm run type-check
npm run lint
```

### Checklist manual (`npm run dev:playground`)

- [ ] Clicar em `.user-section` abre o menu; clicar de novo fecha.
- [ ] Menu reposiciona (flip/shift) perto das bordas da viewport.
- [ ] Setas/Home/End navegam; Enter/Espaço ativam; Escape fecha.
- [ ] Clique fora fecha.
- [ ] Cada item padrão (perfil, configurações, dark mode, suporte, sair) chama o `emit`
  correspondente.
- [ ] Item de versão (`props.version`) aparece como última linha e não quebra ao ser clicado
  (sem `exec`).
- [ ] `props.items` sobrescreve totalmente o menu padrão.
- [ ] Botão de impersonação continua funcionando normalmente (não afetado pela migração).
- [ ] Aparência do overlay (fundo/sombra/borda) equivalente à versão PrimeVue.

---

## 9. Skills necessárias

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-popovers-confirmations-best-practices` | Padrões de overlays/menus de ação e triggers do ecossistema Max. |
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da lib (estrutura de SFC, testes com Vitest/test-utils, quando rodar `generateResolver.ts`). |
| `.claude/skills/vue-typescript-best-practices` | Tipagem de `defineProps`/`defineEmits`, refs a elementos, handlers de evento. |
| `.claude/skills/vue-unocss-styling-best-practices` | Reproduzir a aparência do overlay com variáveis do tema Max. |
| `.claude/skills/vue-vitest-testing-best-practices` | Ajustar os testes (Teleport + `attachTo`, `nextTick`). |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Garantir 4 espaços, aspas simples, ponto e vírgula, sem trailing comma; SCSS válido. |

---

## 10. Riscos e pontos de atenção

- **Teste atual não abre o menu.** O `TieredMenuStub` hoje renderiza os itens incondicionalmente
  (sem `v-if="open"`), então os testes de labels/eventos passam sem simular abertura. Após a
  migração, isso deixa de funcionar — os testes **precisam** chamar `toggle()` e aguardar
  `nextTick()` antes de buscar itens. Ver seção 8.
- **Teleport + `wrapper.find`.** `@vue/test-utils` não encontra elementos teleportados via
  `wrapper.find` a menos que a montagem use `attachTo: document.body` e a busca considere o
  `document.body` inteiro. Atenção redobrada nesse ajuste de teste.
- **Item "Versão" sem `exec`.** O handler é `item.exec && item.exec()` — clicar no item de versão
  não deve lançar erro (guarda já existente). Preservar.
- **Posicionamento sem PrimeVue.** Reproduzir com Floating UI (`flip`, `shift`, `offset`) +
  `autoUpdate`, limpando no fechamento/unmount (vazamento de listeners é o risco clássico).
- **Nova dependência `@floating-ui/dom`.** Se `MaxPopoverMenu` (migração relacionada, mesmo padrão
  de overlay) já a tiver adicionado ao `package.json`, reaproveitar a mesma dependência em vez de
  duplicar.
- **Fechar ao selecionar.** O `TieredMenu` popup fecha ao clicar num item. Reproduzir chamando
  `hide()` após `item.exec?.()`.
- **`id="overlay_tmenu"` duplicado.** Já era fixo no componente original; se duas instâncias de
  `MaxUserSection` existirem na mesma página, os ids colidem. Comportamento preexistente — pode
  ser mantido por compatibilidade estrita ou trocado por id único (`useId()`), documentando a
  mudança caso opte por corrigir.
