# Plano de Migração — MaxBadgeComponent (Independência do PrimeVue)

> Documento autossuficiente. Uma IA executora deve conseguir realizar a migração lendo **apenas**
> este arquivo + o fonte referenciado (`src/components/MaxBadgeComponent.vue`) e o helper
> `getColorFromVar` de `@maxvue/max-use`. **Não** altere a API pública, os estilos nem o
> comportamento observável.

---

## 1. Componente

- **Nome:** `MaxBadgeComponent`
- **Caminho:** `src/components/MaxBadgeComponent.vue`
- **Export público:** `src/index.ts` linha 88 — `export { default as MaxBadgeComponent } from './components/MaxBadgeComponent.vue';`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** Substituir `Badge` e `OverlayBadge` do PrimeVue por um `<span>`
  estilizado (badge simples) e um badge sobreposto via CSS `position: absolute`. Manter o uso de
  `getColorFromVar` e todo o cálculo de cores atual, além do `MaxIcon`.

---

## 2. Dependências do PrimeVue (trechos reais)

O componente importa **dois** componentes PrimeVue:

```ts
import Badge from 'primevue/badge';
import OverlayBadge from 'primevue/overlaybadge';
```

Usos no template (fonte atual, linhas 4-5):

```html
<OverlayBadge v-if="is_overlay" />
<Badge width="300" v-bind="attrs" :value="message" v-else
    :class="`${props.icon || props.iconColor ? 'with-icon' : ''} ${props.iconValue ? 'with-icon-value' : ''}`"
    ref="badgeElem"
    :style="{backgroundColor: bg_color, color: text_color}" />
```

Observações importantes:

- `primevue/badge` renderiza internamente `<span class="p-badge p-component" ...>{{ value }}</span>`.
  O SCSS scoped deste componente estiliza `.p-badge`, `.p-badge-lg` e `.p-badge-xl` (ver seção 7).
  Ao trocar por `<span>` nativo precisamos **manter essas mesmas classes** no elemento novo para
  preservar 100% da aparência.
- As variantes de tamanho `.p-badge-lg` / `.p-badge-xl` eram adicionadas pelo PrimeVue conforme a
  prop `size` (`"large"` → `p-badge-lg`, `"xlarge"` → `p-badge-xl`). Como `attrs` é espalhado via
  `v-bind="attrs"`, o `size` do PrimeVue chegava por atributo. **Atenção:** existe também a prop
  `size` própria do componente (`props.size`), usada em `badge-component-main-div ${props.size}`.
  Ver seção 10 (Riscos) para a distinção entre os dois `size`.
- `OverlayBadge` do PrimeVue exige um slot com o elemento sobre o qual o badge flutua; aqui é
  usado **sem slot e sem value** (`<OverlayBadge v-if="is_overlay" />`), ou seja, o caminho
  `overlay = true` hoje renderiza um overlay badge vazio. A migração deve reproduzir esse
  comportamento com um `<span>` posicionado absolutamente (badge sobreposto), sem quebrar.

---

## 3. Dependências internas (preservar)

- **`MaxIcon`** — `import MaxIcon from './MaxIcon.vue';` (componente Max já existente; **não migrar
  aqui**). Usado com props `:icon`, `class="icon-badge"`, `dark="0.3"`, `:color="icon_color"`.
- **`getColorFromVar`** — `import { getColorFromVar } from '@maxvue/max-use';`
  (fonte: `../MaxUse/src/Helpers/Browser/getColorFromVar.ts`). Retorna uma instância `Color`
  (biblioteca `color`) e resolve valores como `var(--orange-600)` para RGB via
  `window.getComputedStyle(document.documentElement)`. **Manter exatamente** — não faz parte do
  escopo desta migração. Métodos usados sobre a instância: `.isLight()`, `.isDark()`, `.darken()`,
  `.lighten()`, `.hexa()`.
- **`useAttrs` / `computed`** do Vue — mantidos.

Nenhuma store Pinia é usada por este componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Preservar integralmente:

### Props (de `defineProps`, com defaults vazios `{}`)

| Prop | Tipo | Papel |
|------|------|-------|
| `icon` | `string` | Nome do ícone (ex.: `'mdi:home'`) |
| `i` | `string` | Alias de `icon` |
| `label` | `string` | Texto do badge |
| `value` | `string` | Alias de texto |
| `msg` | `string` | Alias de texto |
| `mensagem` | `string` | Alias de texto |
| `text` | `string` | Alias de texto |
| `txt` | `string` | Alias de texto |
| `number` | `string` | Alias de texto |
| `rotate` | `number` | Rotação do ícone (repassado por `attrs`/props ao MaxIcon — hoje não é bind explícito) |
| `flip` | `'horizontal' \| 'vertical' \| 'h' \| 'v' \| 'x' \| 'y' \| 'xy'` | Inversão do ícone |
| `size` | `string \| number` | Classe no `div` principal + variante de tamanho |
| `scale` | `string \| number` | Alias de tamanho |
| `width` | `string \| number` | Largura |
| `height` | `string \| number` | Altura |
| `iconColor` | `string` | Cor do círculo de cor / ícone |
| `iconValue` | `string` | Texto do círculo de cor |
| `badge` | `any` | Usado apenas com overlay |
| `overlay` | `boolean \| undefined` | Ativa o modo badge sobreposto |
| `background` | `string` | Cor de fundo do badge |
| `textColor` | `string` | Cor do texto |

> **Todos os defaults são vazios** (`withDefaults(..., {})`). Manter a ordem e os comentários JSDoc.

### Emits
Nenhum `defineEmits`.

### Slots
Nenhum slot próprio declarado. **Atenção:** `v-bind="attrs"` no `Badge` repassa atributos/listeners
extras (fall-through). Preservar esse fall-through no novo `<span>` (ver seção 6).

### v-model
Não há.

### Comportamento observável a preservar (derivado do fonte + testes)

1. **Texto do badge** = `label ?? msg ?? value ?? mensagem ?? text ?? txt ?? number ?? ''`
   (computed `message`, coerção via `String(...)`).
2. **Ícone** renderiza **apenas** quando `props.icon || props.i` é verdadeiro
   (`.max-icon` presente/ausente — coberto por teste).
3. **Círculo de cor** (`.circle-color-badge-text`) exibe `props.iconValue ?? ''` e fundo
   `props.iconColor ?? 'none'` (coberto por teste).
4. **Cor de fundo** (`bg_color`), regra exata:
   - se `props.background` → usa `props.background`;
   - senão, varre `attrs`: para a **primeira** chave que começa com `color-`, remove `color-hover-`
     e `color-` e retorna `` `var(--${color}) !important` ``;
   - fallback: `'var(--orange-600)'`.
5. **Cor do texto** (`text_color`): se `props.textColor` → usa; senão
   `Color = getColorFromVar(bg_color)`; se `Color.isLight()` → `Color.darken(0.5).hexa()`, senão
   `Color.lighten(0.6).hexa()`.
6. **Cor do ícone** (`icon_color`): se `props.iconColor` → usa; senão
   `Color = getColorFromVar(text_color)`; se `Color.isDark()` → `Color.darken(0.5).hexa()`, senão
   `Color.lighten(0.6).hexa()`.
7. **Overlay**: `is_overlay = props.overlay === true`; quando `true`, renderiza o badge sobreposto
   (hoje vazio) **em vez** do badge simples.
8. **Classes condicionais no badge simples**: `with-icon` quando `props.icon || props.iconColor`;
   `with-icon-value` quando `props.iconValue`.

---

## 5. Estratégia de substituição

Substituição **puramente HTML/CSS** — não há necessidade de biblioteca headless.

| Elemento PrimeVue | Substituto |
|-------------------|-----------|
| `<Badge :value="message" ... />` | `<span class="p-badge p-component ...">{{ message }}</span>` — mesmas classes CSS que o SCSS já estiliza |
| `<OverlayBadge />` | `<span class="p-badge p-overlay-badge ...">` posicionado com `position: absolute` (badge sobreposto) |
| `getColorFromVar` | **Mantido** (não é PrimeVue) |
| `MaxIcon` | **Mantido** |

Pontos-chave da estratégia:

- Manter as classes `p-badge` / `p-badge-lg` / `p-badge-xl` no `<span>` novo para reaproveitar o
  SCSS existente **sem reescrevê-lo**. As variantes de tamanho que o PrimeVue adicionava via prop
  `size` devem ser reproduzidas mapeando o valor de tamanho recebido por `attrs`
  (`size="large"` → `p-badge-lg`, `size="xlarge"` → `p-badge-xl`).
- Preservar o fall-through de `attrs` no `<span>` (via `v-bind` explícito após extrair o que for
  tratado manualmente), mantendo `inheritAttrs` compatível.
- Para o overlay (`is_overlay`), reproduzir um `<span>` absolutamente posicionado. Como o uso atual
  é vazio (sem value/slot), basta um badge sobreposto sem texto; usar `props.badge`/`props.value`
  como conteúdo se quiser paridade futura, mas **hoje** ele é renderizado vazio — manter isso.

---

## 6. Passos de implementação

Siga a ordem. Convenções obrigatórias: `<script setup lang="ts">`, indentação de **4 espaços**,
aspas simples, ponto e vírgula, sem trailing commas, ordem **Template → Script → Style**.

1. **Remover imports PrimeVue** no `<script setup>`:
   - Remover `import Badge from 'primevue/badge';`
   - Remover `import OverlayBadge from 'primevue/overlaybadge';`

2. **Manter** os demais imports: `MaxIcon`, `useAttrs`, `computed`, `getColorFromVar`.

3. **Mapear a variante de tamanho** (para reproduzir `p-badge-lg` / `p-badge-xl` que o PrimeVue
   adicionava). Criar um `computed` que leia o tamanho recebido por `attrs` (a prop `size` do
   PrimeVue chegava por `v-bind="attrs"`, não pela `props.size` própria). Exemplo:
   ```ts
   const badge_size_class = computed<string>(() => {
       const size = (attrs.size ?? attrs['size']) as string | undefined;
       if (size === 'large') return 'p-badge-lg';
       if (size === 'xlarge') return 'p-badge-xl';
       return '';
   });
   ```
   > Verifique no fonte/consumidores se algum tamanho é realmente passado; se nunca for, este
   > computed apenas garante paridade e retorna `''`. **Não** confundir com `props.size`, que
   > continua indo para a classe do `div` principal.

4. **Isolar os attrs que não devem ir para o DOM** (as chaves `color-*` e a `size`), para o
   fall-through do `<span>` não emitir atributos inválidos:
   ```ts
   const passthrough_attrs = computed(() => {
       const out: Record<string, unknown> = {};
       for (const key in attrs) {
           if (key.startsWith('color-')) continue;
           if (key === 'size') continue;
           out[key] = attrs[key];
       }
       return out;
   });
   ```
   > Observação: hoje o `v-bind="attrs"` do Badge repassa **tudo** (inclusive `color-*` e `size`)
   > ao componente PrimeVue, que os consome/ignora internamente. Ao usar `<span>` nativo, atributos
   > desconhecidos vazariam para o HTML. Filtrar preserva o comportamento visual. Mantenha isso
   > mínimo — se a IA preferir, pode adicionar `defineOptions({ inheritAttrs: false })` e controlar
   > o bind manualmente.

5. **Substituir o template** do badge simples. De:
   ```html
   <Badge width="300" v-bind="attrs" :value="message" v-else :class="..." ref="badgeElem" :style="{backgroundColor: bg_color, color: text_color}" />
   ```
   Para:
   ```html
   <span
       v-else
       ref="badgeElem"
       v-bind="passthrough_attrs"
       :class="`p-badge p-component ${badge_size_class} ${props.icon || props.iconColor ? 'with-icon' : ''} ${props.iconValue ? 'with-icon-value' : ''}`"
       :style="{ backgroundColor: bg_color, color: text_color }"
   >{{ message }}</span>
   ```
   > A prop `width="300"` do Badge PrimeVue não tinha efeito visual real (Badge não usa `width`
   > como atributo de estilo); pode ser descartada. `ref="badgeElem"` não é usado em nenhum lugar
   > do script — pode ser mantido por segurança ou removido (não faz parte da API pública).

6. **Substituir o overlay**. De:
   ```html
   <OverlayBadge v-if="is_overlay" />
   ```
   Para um `<span>` sobreposto (badge vazio, como hoje):
   ```html
   <span v-if="is_overlay" class="p-badge p-overlay-badge" :style="{ backgroundColor: bg_color }"></span>
   ```
   E adicionar no SCSS o posicionamento absoluto de `.p-overlay-badge` (ver seção 7).

7. **Manter intactos** os computeds `message`, `is_overlay`, `bg_color`, `text_color`,
   `icon_color` — sem alterar nenhuma regra.

8. **Manter intacto** o `<div class="circle-color-badge">` e o `<MaxIcon>` do topo do template.

9. **Ajustar o SCSS** conforme seção 7 (adicionar `.p-overlay-badge`; o restante já existe e
   continua válido pois as classes `.p-badge*` foram preservadas).

10. Rodar lint e testes (seção 8).

---

## 7. Estilos

O bloco `<style lang="scss">` atual já estiliza `.p-badge`, `.p-badge-lg`, `.p-badge-xl`,
`.with-icon`, `.with-icon-value`, `.circle-color-badge`, `.circle-color-badge-text` e `.icon-badge`
dentro de `.badge-component-main-div`. **Como preservamos essas classes no `<span>` novo, este SCSS
NÃO precisa ser reescrito.**

Regras-chave que devem continuar valendo (não editar salvo o item de overlay):

- `.badge-component-main-div` → `position: relative; display: grid; place-items: center start; grid-template-columns: auto 1fr;`
- `.p-badge` → `font-size: 0.6rem; font-weight: 500; height: 22.5px; text-transform: uppercase; display: grid; place-items: center;`
- `.p-badge.p-badge-lg` / `.p-badge.p-badge-xl` → paddings e alturas específicos, incluindo os
  incrementos de `padding-left` para `.with-icon` (25px/23px) e `.with-icon-value` (28px!/25px).
- `.p-badge.with-icon, .p-badge.with-icon-value` → `padding-left: 26px;`
- `.circle-color-badge` → `position: absolute; top: 1px; left: 0; width: 21px; height: 100%;` etc.
- `.icon-badge` → `position: absolute; left: 4px;`

**Único acréscimo necessário** — o overlay. Adicionar dentro de `.badge-component-main-div`:

```scss
.p-overlay-badge {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    transform-origin: 100% 0;
    min-width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    padding: 0;
}
```

> Esses valores replicam o visual padrão de um overlay badge (bolinha no canto superior direito).
> Como o uso atual do `OverlayBadge` é vazio e não há teste cobrindo aparência do overlay, ajuste
> fino é permitido desde que o badge simples permaneça idêntico.

**Cores:** todas vêm dos computeds via `:style` (`bg_color`, `text_color`) e do helper
`getColorFromVar`, que resolve variáveis do tema Max (`var(--orange-600)`, `var(--<cor>)`).
Não há classes UnoCSS novas a introduzir.

---

## 8. Testes / verificação

Arquivo de teste existente: `tests/components/MaxBadgeComponent.test.ts` (Vitest +
`@vue/test-utils`, `MaxIcon` stubado, Pinia ativa no `beforeEach`).

Rodar:
```bash
npx vitest run tests/components/MaxBadgeComponent.test.ts
npm run type-check
npm run lint
```

Todos os casos existentes **devem continuar passando** sem alteração no arquivo de teste:

1. `renderiza corretamente` — monta com `{ label: 'Ativo' }`.
2. `exibe texto do badge via prop label` — `wrapper.text()` contém `'Pendente'`
   → **crítico**: o texto de `message` deve estar no DOM (agora dentro do `<span>`, não mais numa
   prop `:value` do Badge PrimeVue). Confirme que o texto é renderizado como conteúdo do `<span>`.
3. `exibe texto via aliases (msg, value, text)` — valida `msg`, `value`, `text`.
4. `renderiza ícone quando icon é fornecido` — `.max-icon` presente.
5. `não renderiza ícone quando icon não é fornecido` — `.max-icon` ausente.
6. `aceita iconColor e iconValue para círculo de cor` — `.circle-color-badge-text` contém `'A'`.

Checklist manual adicional (não coberto por testes automatizados):

- [ ] Badge simples com `background` e `textColor` explícitos aplica as cores corretas.
- [ ] Badge sem `background` usa fallback `var(--orange-600)`.
- [ ] Attr `color-primary` (ou `color-hover-primary`) resulta em fundo `var(--primary) !important`.
- [ ] `overlay: true` renderiza o badge sobreposto (bolinha no canto) e **não** o badge simples.
- [ ] Padding-left aumenta com `with-icon` / `with-icon-value` (comparar visualmente antes/depois).
- [ ] Nenhum atributo inválido (`color-*`, `size`) vaza para o HTML do `<span>`.
- [ ] `grep -rn "primevue" src/components/MaxBadgeComponent.vue` retorna vazio.

Recomenda-se validar visualmente no playground: `npm run dev:playground`.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (symlink para `/home/johnattas/GitHub/Skills/created-skills`),
apenas as pertinentes a este componente:

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (estrutura de `.vue`, ordem Template→Script→Style, aliases de export) que a migração deve seguir.
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `getColorFromVar` e
  demais utilitários de `@maxvue/max-use`, que devem ser preservados.
- `.claude/skills/vue-unocss-styling-best-practices` — padrões de estilização/CSS do tema Max e
  variáveis (`var(--...)`) usadas nas cores do badge.
- `.claude/skills/vue-typescript-best-practices` — tipagem correta de `defineProps`/computeds em
  `<script setup lang="ts">` ao remover os componentes PrimeVue.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — garantir 4 espaços, aspas simples,
  ponto e vírgula, sem trailing commas (lint deve passar).
- `.claude/skills/vue-vitest-testing-best-practices` — manter e validar os testes existentes de
  `MaxBadgeComponent` sem alterar o arquivo de teste.
- `.claude/skills/frontend-design-best-practices` — fidelidade visual do badge simples e do overlay
  (posicionamento, paddings, cores) ao substituir os componentes PrimeVue por HTML/CSS.

Skills descartadas (não pertinentes a este componente): inputs/máscaras, floating-vue/popovers,
navegação por teclado, virtual-scroller, dayjs, uppy, pdf-viewer, pinia (o componente não usa
store), dynamic-components.

---

## 10. Riscos e pontos de atenção

1. **Dois `size` diferentes.** Existe `props.size` (classe do `div` principal:
   `` `badge-component-main-div ${props.size}` ``) **e** um `size` que chegava via `attrs` para o
   Badge PrimeVue (que gerava `p-badge-lg`/`p-badge-xl`). Não misture os dois. A variante de
   tamanho do `.p-badge` deve derivar do `attrs.size`, e `props.size` continua na classe do `div`.
   Verifique nos consumidores qual `size` é realmente usado; se apenas `props.size` for usado,
   `p-badge-lg`/`p-badge-xl` podem nunca aparecer — mantenha o mapeamento por segurança.

2. **Fall-through de atributos.** O `v-bind="attrs"` original repassava tudo ao componente PrimeVue.
   No `<span>` nativo, atributos como `color-primary` e `size` **vazariam** para o HTML. Filtrar
   esses attrs (passo 4) é obrigatório para não gerar atributos inválidos, mas **não** filtre
   demais — event listeners e atributos válidos (ex.: `id`, `title`, `data-*`) devem continuar
   passando (preserva o comportamento de fall-through).

3. **Ordem de leitura de `attrs` em `bg_color`.** A regra usa `for (const key in attrs)` e retorna
   na **primeira** chave `color-*`. A ordem de iteração de `attrs` deve ser preservada — **não**
   reordene nem transforme `attrs` antes desse loop.

4. **`getColorFromVar` depende do DOM.** Ele lê `window.getComputedStyle(document.documentElement)`.
   Em testes, o `tests/setup.ts` mocka `getComputedStyle` com valores de variáveis CSS. Não altere
   a lógica; apenas confie no mock existente.

5. **Overlay vazio.** O comportamento atual renderiza um overlay **sem conteúdo**. Não invente
   texto/slot para ele — reproduza vazio para não mudar o comportamento observável. Não há teste
   cobrindo o overlay, então valide manualmente.

6. **Classes preservadas = SCSS intocado.** O maior risco de regressão visual é renomear/remover as
   classes `.p-badge*`. **Mantenha-as** no `<span>` para reaproveitar o SCSS existente. Só adicione
   `.p-overlay-badge` (seção 7).

7. **Sem dependências transitivas de migração.** Este componente **não** depende de `InputBase` nem
   de outros componentes ainda-a-migrar; `MaxIcon` já existe. Pode ser migrado a qualquer momento,
   de forma independente (nível `baixa`).

8. **`ref="badgeElem"`** não é referenciado no script — é código morto. Manter ou remover é
   indiferente à API pública; se remover, garanta que nenhum consumidor externo dependa dele (não
   há evidência disso).
