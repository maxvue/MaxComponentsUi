# Plano de Migração — MaxUserAvatar

> Plano autossuficiente. Uma IA futura deve conseguir executá-lo lendo apenas este
> arquivo e o código-fonte referenciado. **Não** alterar código durante a leitura do plano.
> Objetivo: remover a dependência do `Avatar` do PrimeVue no `MaxUserAvatar`, preservando
> API pública, estilos e comportamento (imagem / iniciais / integração com `useConfirmStore`).

---

## 1. Componente

- **Nome:** `MaxUserAvatar`
- **Caminho:** `src/components/MaxUserAvatar.vue`
- **Nível de dificuldade:** `baixa`
- **Export/alias** (`src/index.ts`, linha 104):
  ```ts
  export { default as MaxUserAvatar } from './components/MaxUserAvatar.vue';
  ```
  Único export nomeado. **Não** há outros aliases em `src/index.ts`. Preservar exatamente esta linha.
- **Manifesto** (`src/components-manifest.json`): já contém `MaxUserAvatar` e os aliases
  `max_user_avatar`, `max-user-avatar`, `UserAvatar`, `user_avatar`, `user-avatar` (linhas 70,
  475-480). **Nenhum novo `.vue` será criado**, logo **não** é necessário rodar
  `generateResolver.ts` e o manifesto **não** deve mudar.
- **Resumo da migração:** trocar as duas tags `<Avatar>` do PrimeVue por um único elemento
  nativo (`<div>` contêiner com `<img>` para imagem ou texto para iniciais), estilizado para
  reproduzir a aparência circular do avatar. Manter a diretiva `v-tooltip`, o modo `remove` com
  overlay `×` e a integração com `useConfirmStore`.

---

## 2. Dependências do PrimeVue (trechos reais)

### 2.1 Import direto

`src/components/MaxUserAvatar.vue`, linha 14:

```ts
import Avatar from 'primevue/avatar';
```

Esta é a **única** dependência de import PrimeVue do componente e é o que deve ser eliminado.

### 2.2 Uso no template (linhas 2-3)

Ramo com imagem:

```html
<Avatar :image="props.imageUrl" shape="circle" v-if="props.imageUrl" :class="{ removable: remove }" @click="onAvatarClick" v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null" />
```

Ramo com iniciais (fallback):

```html
<Avatar :label="name?.substring(0, 2).toUpperCase() ?? '' " style="background-color: #ece9fc; color: #2a1261;" shape="circle" pointer v-else :class="{ removable: remove }" @click="onAvatarClick" v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null" />
```

O que o `Avatar` do PrimeVue faz e precisa ser reproduzido:

- Renderiza um elemento com a classe base **`.p-avatar`** (e `.p-component`). O `<style>` deste
  próprio componente depende dessa classe: `.p-avatar.removable` (linhas 60-84) define o overlay
  `×`. Portanto o novo elemento **deve** manter a classe `p-avatar` (ver seção 5/7).
- `shape="circle"` → borda arredondada total (`border-radius: 50%`). No PrimeVue isso vem do tema;
  ao migrar precisamos garantir `border-radius: 50%` via CSS próprio.
- `:image` → renderiza uma `<img>` interna com o `src` da imagem, cobrindo o círculo.
- `:label` → renderiza o texto (iniciais) centralizado.
- `pointer` (no ramo de iniciais) → prop do PrimeVue Avatar que apenas indica cursor; a lógica de
  `cursor: pointer` real relevante já vem de `.removable` quando `remove` está ativo. `pointer`
  pode ser descartado sem impacto observável (não é testado; ver seção 4/10).
- Tamanho padrão do Avatar do PrimeVue: quadrado ~2rem (32px) com fonte proporcional. Reproduzir
  um tamanho fixo padrão (ver seção 7) para fidelidade visual.

### 2.3 Diretiva `v-tooltip` (dependência PrimeVue **transversal**, NÃO deste componente)

`v-tooltip.top` é usado nas duas tags. A diretiva `tooltip` é registrada **globalmente** em
`src/index.ts`:

```ts
import Tooltip from 'primevue/tooltip';        // linha 113
app.directive('tooltip', Tooltip);             // linha 135 (dentro de install())
```

**Escopo:** a migração de `v-tooltip` NÃO faz parte deste plano — ela pertence à migração do
`install()`/`src/index.ts`. Aqui, **manter** `v-tooltip.top="..."` exatamente como está. O teste
(`aplica v-tooltip condicionalmente...`) injeta uma diretiva `tooltip` mockada, então a diretiva
precisa continuar aplicada no elemento raiz do avatar com o mesmo valor (ver seção 4.5 e 8).

---

## 3. Dependências internas

Devem ser preservadas exatamente:

- **`useConfirmStore`** — `src/stores/useConfirm.Store.ts` (Pinia, id `'confirm.popover'`). Não
  depende do PrimeVue; **não** reimplementar, manter o import:
  ```ts
  import { useConfirmStore } from '../stores/useConfirm.Store';
  ```
  Campos usados por `onAvatarClick` (todos existem no store — conferido em
  `useConfirm.Store.ts`): `x`, `y`, `width`, `height`, `message`, `messageIcon`, `rejectProps`,
  `acceptProps`, `show`.
  - Assinatura de `rejectProps`/`acceptProps` no store:
    `{ label: string; icon?: string; action?: (event?: any) => void }`. O componente atribui
    objetos com `label`, `icon` e `action` — compatível.
  - O popover de confirmação em si é renderizado por outro componente que consome o mesmo store
    (ex.: `MaxPopoverConfirm.vue` / `MaxIconConfirm.vue`). **Fora do escopo** deste plano: não
    tocar nesses arquivos. O contrato aqui é apenas gravar os campos no store e ligar `show = true`.
- **Vue** — nenhum import explícito de `vue` é feito hoje (o componente usa apenas `defineProps`,
  `withDefaults`, `defineEmits`, que são macros de compilador). Manter assim.

Nenhuma dependência de `@maxvue/max-use` neste componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para o consumidor. Nada abaixo pode mudar.

### 4.1 Props (`defineProps` + `withDefaults`, linhas 19-38)

| Prop | Tipo | Default | Uso |
|------|------|---------|-----|
| `imageUrl` | `string?` | — | URL da imagem; se presente, renderiza `<img>`. |
| `name` | `string?` | — | Gera iniciais (2 primeiros chars, uppercase) e tooltip. |
| `showTooltip` | `boolean?` | `true` | Liga/desliga o valor passado à diretiva `v-tooltip`. |
| `routeImage` | `string \| null \| undefined` | — | **Não usado** no template/script hoje; manter na assinatura. |
| `requestImageData` | `string \| null \| undefined` | — | **Não usado** hoje; manter na assinatura. |
| `remove` | `boolean?` | — | Ativa modo de remoção (overlay `×` + confirmação ao clicar). |
| `labelRemove` | `string?` | — | Mensagem/label na confirmação de remoção. |

> Observação: `withDefaults` hoje declara também `route: null` (linha 37), mas **não existe** prop
> `route` no tipo. É um default órfão/no-op (herança de código antigo). **Preservar como está**
> para não alterar comportamento — a migração de Avatar não deve mexer nisso. `showTooltip: true`
> é o default relevante e deve permanecer.

Manter todos os JSDoc por prop (comentários em português já presentes, linhas 20-33).

### 4.2 Emits (linha 40)

```ts
const emit = defineEmits<{ remove: [] }>();
```

- `remove` — emitido apenas via `acceptProps.action` (quando o usuário confirma a remoção no
  popover do `useConfirmStore`). Preservar exatamente.

### 4.3 v-model / Slots

- **Sem** `v-model`. **Sem** slots. Nada a preservar aqui.

### 4.4 Comentário de bloco (linhas 6-11)

Bloco de doc acima do `<script>` descrevendo o componente. Preservar (ou reposicionar dentro do
`<script setup>` como comentário) — não é obrigatório funcionalmente, mas mantê-lo é boa prática.

### 4.5 Comportamento observável (crítico — coberto por testes)

Reproduzir a lógica EXATA de `src/components/MaxUserAvatar.vue`:

1. **Renderização condicional:**
   - Se `props.imageUrl` truthy → variante imagem (`<img>` com `src=imageUrl`).
   - Senão → variante iniciais: texto = `name?.substring(0, 2).toUpperCase() ?? ''`.
     (Ex.: `'Maria'` → `'MA'`; `'joão silva'` → `'JO'`.)
2. **Classe `removable`** aplicada quando `remove` é truthy (`:class="{ removable: remove }"`).
3. **`v-tooltip.top`** com valor:
   `showTooltip ? (remove ? (labelRemove ?? name) : name) : null`.
   - `showTooltip === false` → `null`.
   - `showTooltip === true` e sem `remove` → `name`.
   - `showTooltip === true` e `remove` → `labelRemove ?? name`.
4. **`@click="onAvatarClick"`** em ambas as variantes.
5. **`onAvatarClick(event)`** (linhas 42-55) — comportamento byte-a-byte:
   - `if (!props.remove) return;` (clique é no-op quando não está em modo remoção).
   - Lê `getBoundingClientRect()` de `event.currentTarget` e grava `x`, `y`, `height`, `width` no
     store.
   - `message = labelRemove ?? 'Remover responsável?'`.
   - `messageIcon = 'mingcute:user-remove-fill'`.
   - `rejectProps = { label: 'Voltar', icon: 'weui:back-filled', action: () => {} }`.
   - `acceptProps = { label: 'Remover', icon: 'trash', action: () => emit('remove') }`.
   - `show = true`.

> **Importante para os testes** (`tests/components/MaxUserAvatar.test.ts`): eles usam um **stub**
> `Avatar` que expõe `data-label` (do prop `label`) e `data-image` (do prop `image`). Após a
> migração o stub NÃO se aplicará mais (não haverá componente `Avatar`). **Os testes precisarão
> ser adaptados** — ver seção 8 para o mapeamento exato dos seletores. O `data-testid`/atributos
> propostos na seção 7 substituem `data-label`/`data-image`.

---

## 5. Estratégia de substituição

Substituição **100% por HTML nativo + CSS** (nível `baixa`). Nenhuma biblioteca headless
necessária.

- Trocar as duas tags `<Avatar>` por um **único** elemento raiz `<div class="p-avatar" ...>`,
  usando renderização condicional interna para imagem vs. iniciais:
  - Variante imagem: `<img :src="props.imageUrl" ... />` dentro do div.
  - Variante iniciais: o texto das iniciais como conteúdo do div (com `background-color: #ece9fc`
    e `color: #2a1261`, exatamente como o `style` inline atual do ramo de iniciais).
- **Manter a classe `p-avatar`** no elemento raiz para reaproveitar o `<style>` existente
  (`.p-avatar.removable` → overlay `×`). Reduz risco visual a quase zero.
- Adicionar regras próprias para o que antes vinha do tema PrimeVue: forma circular, tamanho,
  centralização das iniciais, cobertura da imagem (ver seção 7).
- Manter `v-tooltip.top` e `@click="onAvatarClick"` e `:class="{ removable: remove }"` no elemento
  raiz — em **ambas** as variantes (ou no div único que envolve as duas), com o **mesmo valor** da
  diretiva, para o teste de tooltip continuar válido.
- Remover o import `import Avatar from 'primevue/avatar';`.
- Descartar a prop `pointer` (era só do Avatar do PrimeVue; sem efeito observável relevante).

### Decisão de estrutura (recomendada)

Usar **um único elemento raiz** com `v-tooltip`, `:class`, `@click` aplicados uma vez, e dentro
dele um `v-if/v-else` para `<img>` vs. iniciais. Isso é mais limpo que duplicar a diretiva e
mantém um único ponto de clique. Alternativa (menos recomendada): manter dois elementos raiz
`v-if/v-else` espelhando o layout atual. Ambas preservam o comportamento; a de raiz única é
preferível.

---

## 6. Passos de implementação (ordenados)

1. **Template** — substituir todo o bloco `<template>` (linhas 1-4) por um elemento nativo. Modelo
   sugerido (raiz única):

   ```html
   <template>
       <div
           class="p-avatar max-user-avatar"
           :class="{ removable: remove }"
           @click="onAvatarClick"
           v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null"
       >
           <img v-if="props.imageUrl" class="max-user-avatar__image" :src="props.imageUrl" :alt="name ?? ''" />
           <span v-else class="max-user-avatar__initials">{{ name?.substring(0, 2).toUpperCase() ?? '' }}</span>
       </div>
   </template>
   ```

   - Manter `v-tooltip.top` com o valor **idêntico** ao atual.
   - Manter `:class="{ removable: remove }"` e `@click="onAvatarClick"`.
   - As iniciais devem sair de `name?.substring(0, 2).toUpperCase() ?? ''` (mesma expressão de hoje)
     para os testes de `'MA'` / `'JO'` continuarem válidos.

2. **Script** — remover a linha `import Avatar from 'primevue/avatar';` (linha 14). **Não** alterar
   mais nada no `<script setup>`: `useConfirmStore`, `props`, `emit`, `onAvatarClick` permanecem
   byte-a-byte iguais. Manter o comentário de bloco de doc.

3. **Style** — no `<style lang="scss">`:
   - Manter `.p-avatar.removable` (overlay `×`) inalterado.
   - Adicionar as regras de forma/tamanho/centralização e cobertura de imagem para substituir o
     tema PrimeVue (ver seção 7).

4. **Convenções** — garantir `<script setup lang="ts">`, indentação de 4 espaços, aspas simples,
   ponto e vírgula, sem vírgula final, ordem Template → Script → Style (o arquivo já segue a ordem;
   note que o bloco de doc `/** ... */` fica entre `</template>` e `<script>` — pode permanecer ou
   ser movido para dentro do `<script setup>`).

5. **Manifesto/resolver** — nenhum novo `.vue`; **não** rodar `generateResolver.ts`.

6. **Adaptar testes** — ver seção 8 (o stub `Avatar` deixa de existir; atualizar seletores).

7. **Type-check, lint e testes:**
   ```bash
   npm run type-check
   npm run lint
   npx vitest run tests/components/MaxUserAvatar.test.ts
   ```

---

## 7. Estilos

O `<style lang="scss">` atual (linhas 59-85) só cobre o overlay `.removable`. A forma circular, o
tamanho e a cor das iniciais vinham do **tema PrimeVue** (não há SCSS local para isso hoje). Ao
remover o Avatar, precisamos reproduzir:

- **Forma/tamanho** (padrão do Avatar PrimeVue ≈ 2rem):
  ```scss
  .p-avatar.max-user-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      overflow: hidden;
      font-size: 0.875rem;
      line-height: 1;
      user-select: none;
  }
  ```
- **Imagem cobrindo o círculo:**
  ```scss
  .max-user-avatar__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
  }
  ```
- **Iniciais** (reproduzir o `style` inline atual do ramo de iniciais — `#ece9fc` / `#2a1261`):
  ```scss
  .max-user-avatar__initials {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      background-color: #ece9fc;
      color: #2a1261;
      font-weight: 600;
  }
  ```
  > As cores `#ece9fc` (fundo) e `#2a1261` (texto) devem ser mantidas **exatamente** (vinham do
  > `style` inline nas linhas 3). Alternativa: manter o `style` inline no `<span>` das iniciais em
  > vez de mover para SCSS — ambos aceitáveis; mover para SCSS é mais limpo.
- **Overlay `×` (manter, já existe — linhas 60-84):** a regra atual usa `.p-avatar.removable::after`
  com `border-radius: 50%`, `content: '×'`, hover → `opacity: 1`, `cursor: pointer`. Como o novo
  elemento mantém `.p-avatar` + `.removable`, essa regra continua valendo **sem alteração**. O
  `position: relative` e `cursor: pointer` já estão nela.

Variáveis do tema Max: nenhuma é usada aqui (as cores são hex literais herdadas do código atual).
Não introduzir variáveis novas para não mudar a aparência.

UnoCSS: nenhuma classe utilitária UnoCSS usada. Nada a fazer.

> Nota: manter a classe `p-avatar` neste passo garante fidelidade. Uma futura renomeação para uma
> classe própria (ex.: só `.max-user-avatar`) exigiria migrar junto a regra `.p-avatar.removable`;
> fazer isso apenas em uma etapa dedicada de "des-namespacing", nunca isoladamente aqui.

---

## 8. Testes / verificação

### 8.1 Estado atual dos testes

`tests/components/MaxUserAvatar.test.ts` hoje faz mount com um **stub** `Avatar`:

```ts
stubs: {
    Avatar: {
        template: '<div class="p-avatar" :data-label="label" :data-image="image"><slot /></div>',
        props: ['image', 'label', 'shape']
    }
}
```

Casos existentes:
1. `renderiza corretamente` — `wrapper.exists()`.
2. `exibe imagem quando imageUrl é fornecido` — lê `.p-avatar` → `data-image`.
3. `exibe iniciais quando imageUrl não é fornecido` — `.p-avatar` → `data-label === 'MA'`.
4. `gera iniciais com 2 caracteres maiúsculos` — `data-label === 'JO'`.
5. `aplica v-tooltip condicionalmente...` — injeta `directives: { tooltip: fn }` e verifica
   `callArgs[1].value` (`null` quando `showTooltip:false`; `'João'` quando `showTooltip:true` +
   `imageUrl`).

### 8.2 Adaptações necessárias após a migração

Como o componente `Avatar` deixa de existir, o **stub `Avatar` não terá efeito** e os seletores
`data-image` / `data-label` somem. Atualizar o teste (arquivo de teste PODE ser editado; a fonte,
não) para os novos elementos:

- **Caso 2 (imagem):** remover o stub `Avatar`; procurar `.max-user-avatar__image` (ou
  `img.max-user-avatar__image`) e verificar `attributes('src') === 'https://example.com/photo.jpg'`.
- **Casos 3 e 4 (iniciais):** procurar `.max-user-avatar__initials` (ou `.p-avatar`) e verificar
  `.text()` igual a `'MA'` / `'JO'`. Manter os mesmos `name` de entrada (`'Maria'`, `'joão silva'`).
- **Caso 5 (tooltip):** **permanece válido praticamente sem mudança** — a diretiva `tooltip`
  continua sendo aplicada no elemento raiz `.p-avatar` com o mesmo valor. Remover apenas o
  `stubs: { Avatar: true }` (não há mais Avatar). Verificar que `tooltipDirective` é chamada e que
  `callArgs[1].value` é `null` / `'João'` conforme os cenários. `mountAvatar` helper também deve
  perder o stub `Avatar`.
- Adicionar (opcional, recomendado) um caso para o **modo remove**: com `remove: true`, simular
  clique no `.p-avatar` (usar `attachTo`/mock de `getBoundingClientRect` se necessário) e verificar
  que `useConfirmStore().show === true`, `message`/`messageIcon`/`rejectProps`/`acceptProps`
  preenchidos, e que ao chamar `acceptProps.action()` o evento `remove` é emitido
  (`wrapper.emitted('remove')`). Sem `remove`, o clique deve ser no-op (`show` permanece `false`).

### 8.3 Observações de teste

- `beforeEach` já faz `setActivePinia(createPinia())` — necessário para `useConfirmStore`. Manter.
- `getBoundingClientRect()` em happy-dom retorna zeros por padrão; para o caso de remove basta que
  não lance erro. Se precisar de valores, mockar `Element.prototype.getBoundingClientRect`.
- `tests/setup.ts` já stuba globalmente as diretivas `tooltip` e `maska` (linhas 79-80), então o
  `v-tooltip` não quebra os mounts que não injetam a diretiva.

### 8.4 Checklist final

- [ ] Import de `primevue/avatar` removido.
- [ ] Elemento raiz `<div class="p-avatar ...">` com `v-tooltip.top`, `:class="{ removable }"` e
      `@click="onAvatarClick"`.
- [ ] Variante imagem (`<img>`) e variante iniciais (`substring(0,2).toUpperCase()`) preservadas.
- [ ] Cores `#ece9fc` / `#2a1261` das iniciais mantidas.
- [ ] `.p-avatar.removable::after` (overlay `×`) intacto.
- [ ] `onAvatarClick` e integração com `useConfirmStore` byte-a-byte iguais.
- [ ] Props/emits/JSDoc intactos (inclusive `route: null` órfão em `withDefaults`).
- [ ] Export `MaxUserAvatar` em `src/index.ts` (linha 104) intacto; manifesto não alterado.
- [ ] Testes adaptados e verdes: `npx vitest run tests/components/MaxUserAvatar.test.ts`.
- [ ] `npm run type-check` e `npm run lint` sem erros.

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills/` relevantes especificamente a este componente
(preferência por `vue-`; a skill de Pinia é pertinente por causa do `useConfirmStore`):

- `.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md` — convenções da própria
  lib: estrutura de componente `.vue`, ordem dos blocos, exports/aliases em `src/index.ts`,
  manifesto/resolver. Núcleo do "como editar corretamente" aqui.
- `.claude/skills/vue-max-components-ui-popovers-confirmations-best-practices/SKILL.md` — padrão de
  confirmação via store (`useConfirmStore`: `message`, `messageIcon`, `acceptProps`/`rejectProps`,
  `x/y/width/height`, `show`). Diretamente ligado ao `onAvatarClick`.
- `.claude/skills/vue-pinia-state-management-best-practices/SKILL.md` — uso correto de store Pinia
  (`useConfirmStore`) dentro do `<script setup>` e em testes (`setActivePinia`). Justificativa: a
  integração com o store é o comportamento crítico a preservar.
- `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` — comportamento da
  diretiva `v-tooltip` (aplicação condicional, valor `null` para desabilitar). Relevante para
  manter/entender o `v-tooltip.top` e o teste correspondente.
- `.claude/skills/vue-unocss-styling-best-practices/SKILL.md` — como o estilo circular/overlay é
  reproduzido em SCSS e a relação com o tema; fidelidade visual do avatar.
- `.claude/skills/vue-eslint-stylelint-quality-standards/SKILL.md` — 4 espaços, aspas simples, ponto
  e vírgula, ordem dos blocos — exigidos ao editar o `.vue`.
- `.claude/skills/vue-typescript-best-practices/SKILL.md` — tipagem em `<script setup lang="ts">`,
  `defineProps`/`withDefaults`/`defineEmits` preservando a assinatura pública.
- `.claude/skills/vue-vitest-testing-best-practices/SKILL.md` — adaptar/rodar
  `tests/components/MaxUserAvatar.test.ts` (mount, stubs, `directives`, `emitted`, Pinia em testes).

Skills deliberadamente **descartadas** (não pertinentes): image-cropping/uppy/upload (não há
upload aqui — apenas exibição de `imageUrl`), inputs-masks-validation (sem input/form),
virtual-scroller, dayjs, pdf-viewer, dynamic-components, keyboard-navigation, i18n.

---

## 10. Riscos e pontos de atenção

- **Diretiva `v-tooltip` é PrimeVue e é global (CRÍTICO de escopo):** `v-tooltip` vem de
  `primevue/tooltip`, registrada em `src/index.ts` (`app.directive('tooltip', Tooltip)`, linha 135).
  **Este plano NÃO migra a diretiva** — apenas mantém seu uso. Se a diretiva for removida/substituída
  na migração do `install()`/`index.ts`, o valor/atributos passados aqui devem continuar
  compatíveis. Não introduzir tooltip próprio neste componente.
- **Classe `p-avatar` (fidelidade visual):** o `<style>` local depende de `.p-avatar.removable`. Se
  o novo elemento não mantiver `p-avatar`, o overlay `×` some. Manter `class="p-avatar ..."` até uma
  eventual etapa dedicada de renomeação.
- **Tamanho/forma vinham do tema PrimeVue:** ao remover o Avatar, **é preciso adicionar** SCSS de
  `border-radius: 50%`, largura/altura e centralização (seção 7). Sem isso o avatar perde a forma
  circular e o dimensionamento. Validar visualmente no playground (`npm run dev:playground`).
- **Cobertura da imagem:** o Avatar do PrimeVue posiciona a `<img>` cobrindo o círculo; reproduzir
  com `object-fit: cover` + `overflow: hidden` no contêiner, senão a imagem pode vazar/deformar.
- **Testes acoplados ao stub `Avatar`:** os testes atuais leem `data-image`/`data-label` de um stub
  que **deixa de existir**. É **obrigatório** adaptar o teste (seção 8) — caso contrário todos os
  casos 2-4 quebram. O arquivo de teste pode ser editado; a fonte, não.
- **Prop `pointer` descartada:** era exclusiva do Avatar do PrimeVue; sem efeito observável testado.
  Remoção segura.
- **Props não usadas (`routeImage`, `requestImageData`, default órfão `route: null`):** manter na
  assinatura para não quebrar consumidores que as passem. Não "limpar" nesta migração.
- **`getBoundingClientRect` em ambiente de teste:** happy-dom retorna zeros; o fluxo de `remove` não
  deve depender de valores reais para funcionar. Mockar apenas se um teste específico precisar.
- **Escopo restrito:** este plano cobre SOMENTE `MaxUserAvatar.vue` (fonte) e
  `MaxUserAvatar.test.ts` (teste). NÃO editar `useConfirm.Store.ts`, `MaxPopoverConfirm.vue`,
  `src/index.ts` (além de conferir o export) nem o manifesto.
