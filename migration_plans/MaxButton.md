# Plano de Migração — MaxButton (Independência do PrimeVue)

> Documento autossuficiente. Uma IA futura deve conseguir executar esta migração lendo apenas
> este arquivo + o código-fonte referenciado. **Não modificar código-fonte fora do escopo deste
> plano.** Convenções obrigatórias: `<script setup lang="ts">`, indentação de 4 espaços, aspas
> simples, ponto e vírgula, sem trailing commas, ordem de blocos **Template → Script → Style**.

---

## 1. Componente

- **Nome:** `MaxButton`
- **Caminho:** `src/components/MaxButton.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** substituir o `Button` do PrimeVue por um `<button>` nativo estilizado,
  preservando 100% da API pública (tipo `MaxButtonsType`), a navegação via `goToRoute`, os slots e
  o comportamento visual (severity, size, outlined/text/link, loading, ícone, dashed, uppercase).

---

## 2. Dependências do PrimeVue (trechos reais)

O componente hoje depende do PrimeVue em **três pontos**:

**a) Import + uso do componente `Button`** (`src/components/MaxButton.vue`):

```ts
import Button from 'primevue/button';
import type { ButtonProps as PrimeButtonProps } from 'primevue/button';
```

```vue
<Button v-bind="props as PrimeButtonProps" :iconPos="iconPos" uppercase :class="{ 'max-button-dashed': props.dashed }" @click="onClick" v-if="props.label" >
    <template #default>
        <slot></slot>
    </template>
    <template #icon>
        <MaxIcon v-if="props.icon ?? props.i" :icon="props.icon ?? props.i" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" :dark="props.dark" :light="light" :color="iconColor" />
    </template>
    <template #loadingicon>
        <MaxIcon  icon="loading" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" flex />
    </template>
</Button>
```

O `Button` do PrimeVue fornece hoje:
- Renderização do elemento `<button>` com classes `p-button`, `p-button-{severity}`,
  `p-button-outlined`, `p-button-text`, `p-button-link`, `p-button-sm`, `p-button-lg`, etc.
- Slot `#icon` (posicionado por `iconPos` = `left` | `right`) e slot `#loadingicon`.
- Estado `loading` (troca o ícone pelo `#loadingicon` e adiciona `p-disabled`).
- Estado `disabled`.
- Aplicação do atributo/prop `uppercase`, `severity`, `size`, `variant` (`outlined`/`text`/`link`).

**b) Tipo `ButtonProps` do PrimeVue em `src/types/index.ts`** (linha 1 e 15):

```ts
import type { ButtonProps as PrimeButtonProps } from 'primevue/button';

export interface MaxButtonsType extends /* @vue-ignore */ Omit<PrimeButtonProps, 'size' | 'iconPos'> {
    // ... todas as props próprias do Max já declaradas abaixo ...
}
```

> **Atenção:** este `extends Omit<PrimeButtonProps, ...>` é uma dependência de TIPO que precisa ser
> eliminada (ver Passo 3.2). Todas as props realmente usadas pelo componente já estão declaradas
> explicitamente dentro da interface (`label`, `icon`, `iconRight`, `iconPos`, `severity`, `size`,
> `sizeIcon`, `loading`, `variant`, `dashed`, `uppercase`, `route`, `params`, `data`, `query`,
> `action`, `dark`, `light`, etc.). O `extends PrimeButtonProps` só acrescenta props herdadas do
> PrimeVue (ex.: `disabled`, `type`, `badge`, `raised`, `rounded`, `text`, `outlined`, `link`,
> `fluid`, `plain`, `as`, `asChild`) que devem ser reproduzidas manualmente para preservar a API.

**c) Tokens de tema CSS gerados pelo preset PrimeVue** (usados no `<style>`):

```scss
color: var(--max-button-primary-border-color) !important;
/* e as variantes por severidade: */
--max-button-secondary-border-color
--max-button-success-border-color
--max-button-info-border-color
--max-button-warn-border-color
--max-button-help-border-color
--max-button-danger-border-color
--max-button-contrast-border-color
```

Essas variáveis `--max-button-*-border-color` são geradas automaticamente pelo preset
`MaxStyle` (`src/styles/style.ts`, `definePreset(Aura, {...})` de `@primeuix/themes`). **Ao remover
o PrimeVue, essas variáveis deixarão de existir** e precisam ser substituídas por tokens do tema Max
(ver Seção 7 — Estilos).

---

## 3. Dependências internas (preservar)

- **`MaxIcon`** (`src/components/MaxIcon.vue`) — renderiza o ícone (props `icon`, `size`, `dark`,
  `light`, `color`, `flip`, `rotate`, `flex`). Continua sendo usado sem alteração.
- **`MaxIconButton`** (`src/components/MaxIconButton.vue`) — usado no ramo `v-else` quando **não há
  `label`** (`<MaxIconButton v-bind="props" v-else class="icon-button-b" />`). Este componente
  **não faz parte deste plano** e será migrado no seu próprio plano; aqui apenas mantemos o
  `v-else` intacto. Ele já implementa `goToRoute`/`action` internamente.
- **`goToRoute`** (`@maxvue/max-use` → `../MaxUse/src/Routes/goToRoute.ts`) — helper de navegação.
  Assinatura real:
  ```ts
  export const goToRoute = (route: string | null = null, data: any = {}): boolean
  ```
  Lança `Error('Router não configurado na biblioteca.')` se `setLibraryRouter` não foi chamado;
  retorna `false` para rota vazia/blank. **Preservar chamada idêntica.**
- **Tipo `MaxButtonsType`** (`src/types/index.ts`) — contrato público. Todas as props usadas já
  estão declaradas explicitamente na interface (linhas 15–78).

---

## 4. API pública a preservar (contrato — NÃO pode mudar)

### 4.1 Props (`MaxButtonsType`, definidas em `src/types/index.ts`)

| Prop | Tipo | Default (via `withDefaults`) | Papel |
|------|------|------------------------------|-------|
| `label` | `string?` | — | Se presente → renderiza `<button>` com texto; se ausente → renderiza `MaxIconButton`. |
| `icon` / `i` | `string?` | — | Nome do ícone (`i` é alias de `icon`). |
| `iconRight` | `string?` | — | Se truthy → força `iconPos = 'right'`. |
| `iconPos` | `'left' \| 'right'` | `'left'` (computed) | Posição do ícone. |
| `severity` | `'secondary' \| 'success' \| 'info' \| 'whatsapp' \| 'warning' \| 'help' \| 'danger' \| 'contrast'` | — | Cor semântica. |
| `size` | `string \| number \| null?` | — | Tamanho do botão (também usado como fallback do tamanho do ícone). |
| `sizeIcon` / `iconSize` | `string \| number \| null?` | `iconSize: 1.4` | Tamanho do ícone (fallback chain). |
| `loading` | `boolean?` | — | Mostra ícone de loading (`icon="loading"`) no lugar do ícone. |
| `variant` | `'outlined' \| 'text' \| 'link'` | — | Variante visual (fundo transparente). |
| `dashed` | `boolean?` | — | Borda tracejada + fundo transparente (classe `max-button-dashed`). |
| `uppercase` | `boolean?` | `false` | Texto em maiúsculas. |
| `dark` | `boolean \| string \| number?` | `undefined` | Passado para `MaxIcon`. |
| `light` | (computed interno) | — | Ver regra em 4.4. |
| `route` | `string \| null?` | `null` | Ao clicar navega via `goToRoute`. |
| `params` / `data` / `query` | `any` | `{}` | Mesclados e passados ao `goToRoute`/`action`. |
| `action` | `(data: { event: any; data?: any }) => void` | — | Callback de clique (tem prioridade sobre o emit `click`). |
| `disabled` | `boolean?` (herdada de `PrimeButtonProps`) | — | Desabilita o botão. **Deve continuar funcionando** (o teste cobre `disabled: true`). |

> **Importante:** `size`, `sizeIcon`, `iconSize` alimentam o tamanho do ícone via cadeia de
> fallback: `props.size ?? props.sizeIcon ?? props.iconSize ?? '1'`. Preservar EXATAMENTE.

### 4.2 Emits

```ts
const emit = defineEmits<{
    click: [value: boolean];
}>();
```

Emite `click` com valor `true` **somente quando não há `route` nem `action`** (o teste
`emite click quando não há route nem action` valida isso).

### 4.3 Slots

- **`default`** — conteúdo do botão (envolve o `<slot></slot>` dentro do `#default`). Deve
  continuar sendo renderizado dentro do `<button>` nativo.

### 4.4 Comportamento observável a preservar (exato)

- **Ramificação por `label`:** `v-if="props.label"` → `<button>`; `v-else` → `<MaxIconButton>`.
- **`onClick(event)`** (ordem de prioridade — copiar 1:1):
  1. Se `props.route` → `goToRoute(props.route, { ...params, ...data, ...query })` e `return`.
  2. Senão se `props.action` → `props.action({ event, data: dataMerged })` e `return`.
  3. Senão → `emit('click', true)`.
  Onde `dataMerged = { ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }`.
  > Observação: em `goToRoute` a ordem de merge no código atual é `{ ...params, ...data, ...query }`;
  > em `action`/`data` computed é `{ ...data, ...query, ...params }`. **Manter as duas ordens
  > exatamente como estão no código atual** para não alterar precedência de chaves.
- **`light` (computed):** `props.dark || isTransparentVariant ? undefined : 0.7`.
- **`iconColor` (computed):** `isTransparentVariant ? 'currentColor' : undefined`.
- **`isTransparentVariant` (computed):** `variant === 'outlined' || 'text' || 'link' || dashed === true`.
- **`iconPos` (computed):** `iconRight ? 'right' : (iconPos ?? 'left')`.
- **Loading:** quando `loading` for `true`, o ícone exibido é `icon="loading"` (via `MaxIcon`) —
  o teste verifica que `max-icon-stub` aparece no HTML.
- **Uppercase:** texto em maiúsculas quando `uppercase` (default `false`).

---

## 5. Estratégia de substituição

**Substituição direta por `<button>` nativo** — sem biblioteca headless (nível `baixa`).

O `Button` do PrimeVue é apenas um `<button>` com classes de estilo e dois slots de ícone. Como o
Max já controla o layout via `MaxIcon` e o comportamento via `onClick`, basta:

1. Trocar `<Button>` por `<button type="button">` nativo.
2. Recriar a estrutura interna: `[ícone-esquerda] [slot texto] [ícone-direita]`, controlando a
   posição pelo computed `iconPos` (em vez do slot `#icon`/`iconPos` do PrimeVue).
3. Recriar o estado `loading` trocando o ícone renderizado por `icon="loading"`.
4. Aplicar `severity`, `variant`, `size` e `uppercase` via **classes próprias** (`max-button`,
   `max-button-{severity}`, `max-button-{variant}`, `max-button-sm/lg`, `max-button-uppercase`) —
   substituindo as classes `p-button-*` que hoje o PrimeVue gerava.
5. Substituir as variáveis CSS `--max-button-*-border-color` (que sumirão) por tokens do tema Max
   (`--primary-*`, `--success-*`, `--info-*`, `--warning-*`, `--danger-*`, etc.), definindo as cores
   de cada severidade diretamente no SCSS do componente.
6. Manter o ramo `v-else` (`MaxIconButton`) inalterado.

> **Sem dependência externa nova.** Nenhuma lib headless é necessária.

---

## 6. Passos de implementação (ordenados)

### Passo 6.1 — Remover o tipo `PrimeButtonProps` de `src/types/index.ts`
- Remover o `import type { ButtonProps as PrimeButtonProps } from 'primevue/button';` (linha 1).
- Alterar a assinatura de `MaxButtonsType` para **não estender** o PrimeVue:
  ```ts
  export interface MaxButtonsType {
      // ... manter TODAS as props já declaradas ...
  }
  ```
- **Acrescentar explicitamente** as props herdadas do PrimeVue que faziam parte do contrato público
  e ainda são úteis, para não quebrar consumidores:
  ```ts
  /** Desabilita o botão */
  disabled?: boolean;
  /** Tipo do botão nativo */
  type?: 'button' | 'submit' | 'reset';
  ```
  (Adicionar `rounded?`, `raised?`, `fluid?`, `badge?` etc. **apenas se** forem usadas em algum
  consumidor — fazer `grep` no monorepo antes; se não usadas, documentar como removidas.)
- Rodar `npm run type-check` e corrigir qualquer uso remanescente de `PrimeButtonProps` no projeto
  (`grep -rn "PrimeButtonProps" src/`).

### Passo 6.2 — Reescrever `src/components/MaxButton.vue` (Template)
Substituir o `<Button>` por `<button>` nativo. Estrutura sugerida (mantendo classes/slots):

```vue
<template>
    <button
        v-if="props.label"
        type="button"
        class="max-button"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        @click="onClick"
    >
        <MaxIcon
            v-if="showIcon && iconPos === 'left'"
            :icon="loading ? 'loading' : (props.icon ?? props.i)"
            :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
            :flex="loading"
        />
        <span class="max-button-label"><slot></slot>{{ props.label && !$slots.default ? props.label : '' }}</span>
        <MaxIcon
            v-if="showIcon && iconPos === 'right'"
            :icon="loading ? 'loading' : (props.icon ?? props.i)"
            :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
            :flex="loading"
        />
    </button>
    <MaxIconButton v-bind="props" v-else class="icon-button-b"></MaxIconButton>
</template>
```

> **Cuidado com o texto:** o PrimeVue renderiza `label` automaticamente quando não há slot. No
> código atual, o `<slot></slot>` está dentro de `#default` e o `label` era renderizado pelo próprio
> `Button`. Verificar no playground se os consumidores passam texto via slot ou via `label`. Regra
> segura: renderizar o `slot` default e, se não houver conteúdo de slot, renderizar `props.label`.
> Ajustar a expressão acima conforme o resultado do teste `renderiza com label` (que espera
> `wrapper.text()` conter `'Salvar'`).

### Passo 6.3 — Ajustar o Script
Adicionar os computeds de classe e de exibição do ícone; **manter todos os computeds existentes**
(`isTransparentVariant`, `light`, `iconColor`, `iconPos`, `data`) e o `onClick` **sem alteração de
lógica**:

```ts
import { computed } from 'vue';
import MaxIcon from './MaxIcon.vue';
import MaxIconButton from './MaxIconButton.vue';
import { goToRoute } from '@maxvue/max-use';
import type { MaxButtonsType } from '../types';

const props = withDefaults(defineProps<MaxButtonsType>(), { iconSize: 1.4, dark: undefined, route: null, params: {}, data: {}, query: {}, uppercase: false });

const isTransparentVariant = computed(() => props.variant === 'outlined' || props.variant === 'text' || props.variant === 'link' || props.dashed === true);
const light = computed(() => props.dark || isTransparentVariant.value ? undefined : 0.7);
const iconColor = computed(() => isTransparentVariant.value ? 'currentColor' : undefined);

const iconPos = computed<'left' | 'right'>(() => {
    if (props.iconRight) return 'right';
    if (props.iconPos) return props.iconPos;
    return 'left';
});

const showIcon = computed(() => Boolean(props.loading || props.icon || props.i));

const buttonClasses = computed(() => ({
    [`max-button-${props.severity}`]: Boolean(props.severity),
    [`max-button-${props.variant}`]: Boolean(props.variant),
    'max-button-dashed': props.dashed,
    'max-button-uppercase': props.uppercase,
    'max-button-loading': props.loading
}));

const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

const emit = defineEmits<{
    click: [value: boolean];
}>();

const onClick = (event: any) => {
    if (props.route) {
        goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
        return;
    }

    if (props.action) {
        props.action({ event: event, data: data.value });
        return;
    }

    emit('click', true);
};
```

> **Não** remover a exposição de `onClick` para o teste — o teste chama `(wrapper.vm as any).onClick(...)`.
> Em `<script setup>`, funções de nível superior ficam acessíveis ao `vm` quando referenciadas no
> template; como `@click="onClick"` já referencia, permanece acessível. Manter esse binding.

### Passo 6.4 — Reescrever o `<style>` (ver Seção 7)
- Remover as referências a `--max-button-*-border-color` e às classes `.p-button-*` /
  `[data-p~='...']`.
- Definir as cores por severidade/variante com tokens do tema Max.
- Preservar `.max-button-dashed` (borda tracejada, fundo transparente, `color` = cor da severidade)
  e o tratamento de `.content-button-icon svg { fill: currentcolor }` para variantes transparentes.

### Passo 6.5 — Verificação
- `npm run type-check`
- `npx vitest run tests/components/MaxButton.test.ts`
- `npm run lint`
- `npm run dev:playground` e conferir visualmente (Seção 8).

### Passo 6.6 — Resolver / manifest
Não é necessário rodar `generateResolver.ts` (nenhum arquivo `.vue` novo foi adicionado). Confirmar
que `MaxButton` continua listado em `src/components-manifest.json` e exportado em `src/index.ts`.

---

## 7. Estilos

### 7.1 O que existe hoje (preservar aparência)
Bloco `<style lang="scss">` atual (linhas 59–141) define:
- `.icon-button-b` (vazio, apenas placeholder — pode manter).
- `.max-button-dashed`: `background: transparent`, `border-style: dashed`, `border-width: 1px`,
  `color: var(--max-button-primary-border-color)`, e overrides por severidade
  (`&.p-button-secondary`, `&.p-button-success`, `&.p-button-info`, `&.p-button-warn/warning`,
  `&.p-button-help`, `&.p-button-danger`, `&.p-button-contrast`), mais tratamento do ícone
  (`.content-button-icon svg { fill: currentcolor; color: inherit; }`).
- Regras `.p-button-outlined/.p-button-text/.p-button-link` (+ `[data-p~='...']`) que forçam o
  ícone a herdar a cor do texto.

### 7.2 Tokens de cor do tema Max (fonte da verdade)
O preset `MaxStyle` (`src/styles/style.ts`) define as escalas semânticas `primary`, `success`,
`info`, `warning`, `danger` (50–900). Essas escalas viram CSS vars do tema (ex.: `--primary-500`,
`--success-600`, `--danger-500`, etc.) — usar essas variáveis em vez de `--max-button-*-border-color`.
Verificar os nomes reais gerados inspecionando o `:root` no playground (DevTools) ou os arquivos em
`src/themes/*.scss` (`colors.scss`, `params.scss`). Severidades sem escala própria no preset
(`secondary`, `help`, `contrast`, `whatsapp`) devem mapear para variáveis Max equivalentes:
- `secondary` → cinza neutro do tema (ex.: `--background-500` / token cinza existente).
- `help` → roxo (definir literal se não houver token).
- `contrast` → cor de texto/primária de contraste.
- `whatsapp` → verde WhatsApp (`#25D366` ou token já existente — fazer `grep -rn "whatsapp" src/`).

### 7.3 Novo SCSS (esboço)
```scss
.max-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: var(--border-radius, 6px);
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s, color 0.2s, border-color 0.2s;

    &:disabled { opacity: 0.6; cursor: default; }
}

.max-button-uppercase { text-transform: uppercase; }

/* Preenchido por severidade (exemplo primary) */
.max-button-primary,
.max-button:not([class*='max-button-']) {
    background: var(--primary-500);
    color: #fff;
    border-color: var(--primary-500);
    &:hover { background: var(--primary-600); border-color: var(--primary-600); }
}
/* Repetir para success/info/warning/danger/help/contrast/secondary/whatsapp usando tokens Max. */

/* Variantes transparentes */
.max-button-outlined { background: transparent; color: var(--primary-500); }
.max-button-text,
.max-button-link { background: transparent; border-color: transparent; color: var(--primary-500); }
.max-button-link { text-decoration: underline; }

/* Dashed — porta 1:1 do comportamento atual, trocando tokens */
.max-button-dashed {
    background: transparent !important;
    border-style: dashed !important;
    border-width: 1px;
    color: var(--primary-500) !important; /* era --max-button-primary-border-color */

    &:hover, &:active, &:focus { background: transparent !important; }

    &.max-button-secondary { color: var(--secondary-color) !important; }
    &.max-button-success { color: var(--success-500) !important; }
    &.max-button-info { color: var(--info-500) !important; }
    &.max-button-warning { color: var(--warning-500) !important; }
    &.max-button-help { color: var(--help-color) !important; }
    &.max-button-danger { color: var(--danger-500) !important; }
    &.max-button-contrast { color: var(--contrast-color) !important; }

    .content-button-icon {
        .max-icon-div, .max-icon { color: inherit !important; }
        svg { fill: currentcolor !important; color: inherit !important; }
    }
}

/* Ícone herda cor do texto em variantes transparentes */
.max-button-outlined, .max-button-text, .max-button-link {
    .content-button-icon {
        .max-icon-div, .max-icon { color: inherit !important; }
        svg { fill: currentcolor !important; color: inherit !important; }
    }
}

.icon-button-b { /* placeholder mantido */ }
```

> **Ajustar os nomes exatos das CSS vars** após confirmar quais são geradas pelo tema Max
> (`src/themes/colors.scss`, `params.scss`). O importante é **manter o resultado visual** idêntico:
> preenchido = cor sólida da severidade; outlined/text/link/dashed = fundo transparente + texto na
> cor da severidade + ícone via `currentColor`.

### 7.4 Tamanho (`size`)
O PrimeVue mapeava `size` para `p-button-sm`/`p-button-lg`. Como aqui `size` também alimenta o
tamanho do ícone (numérico), tratar `size` textual (`'small'`/`'large'`) via classe e `size`
numérico apenas para o ícone. Verificar no playground como `size` é usado pelos consumidores antes
de decidir; se hoje só é usado como tamanho de ícone, basta não gerar classe de tamanho de botão.

---

## 8. Testes / verificação

### 8.1 Suite existente (deve continuar passando SEM alteração de asserts)
Arquivo: `tests/components/MaxButton.test.ts`. Casos:
1. `renderiza com label` → `wrapper.text()` contém `'Salvar'`.
2. `renderiza como MaxIconButton quando não tem label` → monta com `icon` e sem `label`.
3. `aplica severity` → `severity: 'danger'`.
4. `fica desabilitado quando disabled=true`.
5. `renderiza com ícone quando icon é passado`.
6. `renderiza ícone de loading quando loading=true` → HTML contém `max-icon-stub` (o `MaxIcon` é
   stubbed). **Garantir que o `MaxIcon` de loading seja renderizado** quando `loading=true`.
7. `emite click quando não há route nem action` → `onClick` emite `['true']`.
8. `chama action ao invés de click se existir`.
9. `chama goToRoute quando route for passado` → `goToRoute('home', { id: 1 })`.

> O teste faz stub de `MaxIconButton` e `MaxIcon` e mocka `goToRoute`. **Não alterar os asserts.**
> O `onClick` precisa continuar acessível via `wrapper.vm`, o emit `click` precisa continuar com
> payload `true`, e a chamada `goToRoute('home', { id: 1 })` precisa continuar com esses argumentos
> (o merge `{ ...params, ...data, ...query }` com apenas `params: { id: 1 }` resulta em `{ id: 1 }`).

### 8.2 Checklist manual (playground — `npm run dev:playground`)
- [ ] Botão preenchido em cada severidade (secondary, success, info, whatsapp, warning, help,
      danger, contrast) com a mesma cor de antes.
- [ ] `variant="outlined" | "text" | "link"` com fundo transparente e ícone na cor do texto.
- [ ] `dashed` com borda tracejada e cor por severidade.
- [ ] `uppercase` aplicando maiúsculas.
- [ ] Ícone à esquerda e `iconRight`/`iconPos="right"` à direita.
- [ ] `loading` trocando o ícone por spinner.
- [ ] `disabled` desabilitando o clique.
- [ ] Clique com `route` navega; com `action` chama callback; sem ambos emite `click`.
- [ ] Sem `label` renderiza `MaxIconButton`.

### 8.3 Comandos
```bash
npx vitest run tests/components/MaxButton.test.ts
npm run type-check
npm run lint
```

---

## 9. Skills necessárias

Skills selecionadas da pasta `.claude/skills` (apenas as pertinentes a este componente):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções de arquitetura,
  estilização, exports/aliases e testes da própria lib `@maxvue/max-components-ui`; base obrigatória.
- `.claude/skills/vue-typescript-best-practices` — reescrever a interface `MaxButtonsType` sem o
  `extends PrimeButtonProps`, com `defineProps<...>()`/`defineEmits<...>()` corretamente tipados.
- `.claude/skills/vue-unocss-styling-best-practices` — recriar a aparência com utilitários/UnoCSS e
  variáveis CSS do tema Max no lugar dos tokens `--max-button-*` do PrimeVue.
- `.claude/skills/frontend-design-best-practices` — garantir fidelidade visual (cores por
  severidade, variantes transparentes, dashed, hover) equivalente ao Button atual.
- `.claude/skills/vue-vitest-testing-best-practices` — manter a suíte `MaxButton.test.ts` verde
  (stubs de `MaxIcon`/`MaxIconButton`, mock de `goToRoute`, acesso a `onClick` via `vm`).
- `.claude/skills/vue-max-use-development-best-practices` — preservar corretamente a integração com
  `goToRoute` (assinatura, ordem dos argumentos, comportamento de rota vazia/router não configurado).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — conformidade final com ESLint/Stylelint
  (4 espaços, aspas simples, sem trailing commas, ordem de blocos).

---

## 10. Riscos e pontos de atenção

1. **Variáveis CSS `--max-button-*-border-color` deixam de existir** ao remover o PrimeVue. É o
   maior risco visual: todo o bloco `.max-button-dashed` depende delas. Substituir por tokens do
   tema Max (Seção 7.2) e validar cor por cor no playground.
2. **`MaxButtonsType extends Omit<PrimeButtonProps, ...>`** é uma dependência de tipo transversal:
   outros componentes usam `MaxButtonsType` (ex.: `MaxIconButton`). Ao remover o `extends`, rodar
   `grep -rn "PrimeButtonProps" src/` e `npm run type-check` para garantir que nenhum consumidor
   quebra. Props herdadas do PrimeVue realmente usadas (`disabled`, `type`) devem ser declaradas
   explicitamente na nova interface.
3. **Renderização do texto `label` vs slot `default`**: o PrimeVue renderizava `label`
   automaticamente. No `<button>` nativo é preciso decidir a precedência slot × `label` sem
   duplicar texto — cobrir com o teste `renderiza com label`.
4. **Slots `#icon`/`#loadingicon` do PrimeVue não existem mais**: a lógica de loading e de posição
   do ícone passa a ser controlada no template do Max (computeds `iconPos`, `showIcon`, `loading`).
   Garantir que `loading=true` renderiza `icon="loading"` (teste `max-icon-stub`).
5. **Ordem de merge de `params/data/query`** difere entre `goToRoute` (`params,data,query`) e
   `action`/`data` computed (`data,query,params`). **Não normalizar** — manter exatamente como no
   código atual para não alterar precedência de chaves observável.
6. **Ramo `MaxIconButton` (`v-else`)** depende de outro componente que ainda usa PrimeVue via
   `MaxIcon`/`goToRoute` — não migrar aqui. Este plano só cobre o ramo com `label`. Sequência
   recomendada: migrar `MaxButton` (este plano) de forma independente; `MaxIconButton` tem plano
   próprio. Não há dependência de `InputBase`.
7. **`size` polissêmico**: serve tanto para tamanho de botão (PrimeVue `sm`/`lg`) quanto como
   fallback do tamanho do ícone. Confirmar o uso real nos consumidores antes de mapear para classes
   de tamanho, para não introduzir regressão.
8. **Atributos passados via `v-bind="props"`**: o código antigo fazia `v-bind="props as PrimeButtonProps"`,
   o que repassava props arbitrárias ao `<button>`. Com `<button>` nativo, repassar `props` inteiro
   como atributos pode poluir o DOM (`route`, `action`, etc. viram atributos inválidos). **Não** usar
   `v-bind="props"` no `<button>`; bind apenas o necessário (`disabled`, `type`, `@click`).
