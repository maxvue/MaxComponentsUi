# Independência do PrimeVue — Infraestrutura Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a camada de infraestrutura de `@maxvue/max-components-ui` independente do Aura e de `@primeuix/themes`, sem alterar um pixel do resultado visual e sem quebrar nenhum consumidor.

**Architecture:** Hoje o PrimeVue gera em runtime 23 variáveis CSS `--max-*` que os componentes consomem e que nenhum arquivo do repositório define. Esta fase cria um arquivo SCSS próprio que declara essas 23 variáveis com os valores exatos hoje resolvidos pelo Aura (blocos `:root` e `.dark`), corta a herança do Aura no `MaxStyle`, substitui o tipo `ButtonProps` importado do PrimeVue por um tipo próprio, e liga um aviso de depreciação no entry point `./prime`. O `app.use(PrimeVue)` permanece intacto: durante toda a Fase 1 os tokens próprios e os gerados pelo PrimeVue coexistem com valores idênticos, e é essa igualdade que torna a fase verificável.

**Tech Stack:** Vue 3, TypeScript, SCSS (`sass`), Vite, Vitest + `@vue/test-utils` + happy-dom, UnoCSS.

**Spec:** [`docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md`](../specs/2026-08-13-primevue-infra-independencia-design.md)

## Global Constraints

- **Nada de Aura.** Nenhum arquivo pode importar de `@primeuix/themes` ao fim desta fase.
- **Zero mudança visual.** Todo valor de token escrito deve ser idêntico ao que o Aura resolve hoje.
- **Não-quebrante.** `app.use(PrimeVue, …)`, o entry `./prime` e o `PrimeVueResolver` permanecem funcionando. A remoção deles é Fase 2.
- **Nomes de token permanecem no formato PrimeVue** (`--max-inputtext-border-color`). A renomeação para nomenclatura própria é o sweep da Fase 2 — não antecipar.
- **Não migrar componentes.** Esta fase não toca em nenhum arquivo de `src/components/`. Os 30 componentes restantes seguem a fila do [`migration_executor.md`](../../../migration_executor.md).
- **Convenções do projeto:** indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório, sem vírgula final. Em `.vue`, ordem Template → Script → Style.
- **Baseline de testes:** 1357 testes verdes. Nenhum pode regredir.
- **Commits:** um por task, ao fim. Não fazer push.

---

## File Structure

| Arquivo | Responsabilidade | Ação |
|---------|------------------|------|
| `src/themes/tokens.scss` | Declara as 23 variáveis `--max-*` hoje geradas em runtime, em `:root` e `.dark`. Única fonte desses tokens. | Criar |
| `src/themes/all.scss` | Barril SCSS compilado como preflight do UnoCSS. | Modificar |
| `src/styles/style.ts` | Preset `MaxStyle` — as 5 rampas semânticas, sem herança externa. | Modificar |
| `src/types/index.ts` | Tipos públicos. `MaxButtonsType` deixa de herdar do PrimeVue. | Modificar |
| `src/prime/index.ts` | Entry point depreciado — passa a avisar em dev. | Modificar |
| `tests/themes/tokens.test.ts` | Trava os valores dos 23 tokens contra regressão. | Criar |
| `tests/styles/style.test.ts` | Trava as 5 rampas e a ausência de dependência do Aura. | Criar |
| `tests/prime/deprecation.test.ts` | Verifica o aviso de depreciação. | Criar |

**Por que `tokens.scss` separado de `params.scss`:** `src/themes/params.scss` já é grande e mistura responsabilidades. Os 23 tokens são um contrato específico com prazo de validade (serão renomeados em bloco na Fase 2). Mantê-los isolados torna o sweep da Fase 2 uma edição de um arquivo, não uma varredura.

**Como os tokens chegam ao consumidor:** `all.scss` é compilado por `sass` e injetado como preflight do UnoCSS em [`src/presetMaxUno.ts:101`](../../../src/presetMaxUno.ts). Adicionar `tokens.scss` ao barril basta para que as variáveis existam nas apps que usam o preset.

> **Risco conhecido, fora do escopo desta fase:** apps consumidoras que **não** usam o preset UnoCSS recebem esses tokens hoje pelo runtime do PrimeVue. Após a Fase 2 elas ficariam sem eles. A Fase 2 deve decidir se o `index.es.js` passa a injetar `tokens.scss` diretamente. Não agir agora — durante a Fase 1 o PrimeVue ainda supre esses casos.

---

## Tabela de valores resolvidos

Resolvidos a partir de `@primeuix/themes/dist/aura` na versão instalada (`^2.0.3`), seguindo as cadeias de referência. **Estes são os valores a escrever — não recalcular.**

Cadeias de exemplo:
- `inputtext.borderColor` → `{form.field.border.color}` → `base.semantic.colorScheme.light.formField.borderColor` → `{surface.300}` → `{slate.300}` → `#cbd5e1`
- No dark, `surface` do Aura muda de rampa: **light usa `slate`, dark usa `zinc`**. Não assumir simetria.
- `primary.color` → `{primary.500}` no light e `{primary.400}` no dark, resolvidos contra a rampa do próprio `MaxStyle`.

### Tokens independentes de esquema (só `:root`) — 9

| Token | Origem | Valor |
|---|---|---|
| `--max-primary-100` | `MaxStyle` | `#56C2D7` |
| `--max-primary-200` | `MaxStyle` | `#46BCD4` |
| `--max-primary-400` | `MaxStyle` | `#178DA5` |
| `--max-primary-500` | `MaxStyle` | `#00768E` |
| `--max-primary-600` | `MaxStyle` | `#005F77` |
| `--max-orange-500` | `orange.500` | `#f97316` |
| `--max-red-600` | `red.600` | `#dc2626` |
| `--max-floatlabel-active-font-weight` | literal do Aura | `400` |
| `--max-floatlabel-on-border-radius` | `border.radius.xs` | `2px` |

### Tokens dependentes de esquema (`:root` + `.dark`) — 14

| Token | Light | Dark |
|---|---|---|
| `--max-inputtext-border-color` | `#cbd5e1` | `#52525b` |
| `--max-inputtext-disabled-background` | `#e2e8f0` | `#3f3f46` |
| `--max-inputtext-focus-border-color` | `#00768E` | `#178DA5` |
| `--max-form-field-disabled-background` | `#e2e8f0` | `#3f3f46` |
| `--max-floatlabel-on-active-background` | `#ffffff` | `#09090b` |
| `--max-surface-400` | `#94a3b8` | `#a1a1aa` |
| `--max-button-primary-border-color` | `#00768E` | `#178DA5` |
| `--max-button-secondary-border-color` | `#f1f5f9` | `#27272a` |
| `--max-button-info-border-color` | `#0ea5e9` | `#38bdf8` |
| `--max-button-success-border-color` | `#22c55e` | `#4ade80` |
| `--max-button-warn-border-color` | `#f97316` | `#fb923c` |
| `--max-button-help-border-color` | `#a855f7` | `#c084fc` |
| `--max-button-danger-border-color` | `#ef4444` | `#f87171` |
| `--max-button-contrast-border-color` | `#020617` | `#ffffff` |

Total: 9 + 14 = **23 tokens**. Os dois tokens `--max-credit-card-*` já são próprios do projeto e **não** entram aqui.

---

## Task 1: Contrato de tokens (`tokens.scss`)

**Files:**
- Create: `src/themes/tokens.scss`
- Modify: `src/themes/all.scss`
- Test: `tests/themes/tokens.test.ts`

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: 23 custom properties CSS. Nomes exatos na tabela acima. Nenhuma outra task depende de símbolos JS desta.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/themes/tokens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as sass from 'sass';

const CSS = sass.compile(resolve(__dirname, '../../src/themes/tokens.scss')).css;

/** Extrai as declarações `--token: valor;` de um bloco seletor. */
const blockVars = (css: string, selector: string): Record<string, string> => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    if (!match) return {};
    const out: Record<string, string> = {};
    for (const decl of match[1].split(';')) {
        const [name, ...rest] = decl.split(':');
        if (!name || !rest.length) continue;
        const key = name.trim();
        if (key.startsWith('--')) out[key] = rest.join(':').trim();
    }
    return out;
};

const ROOT = blockVars(CSS, ':root');
const DARK = blockVars(CSS, '.dark');

const SCHEME_INDEPENDENT: Record<string, string> = {
    '--max-primary-100': '#56C2D7',
    '--max-primary-200': '#46BCD4',
    '--max-primary-400': '#178DA5',
    '--max-primary-500': '#00768E',
    '--max-primary-600': '#005F77',
    '--max-orange-500': '#f97316',
    '--max-red-600': '#dc2626',
    '--max-floatlabel-active-font-weight': '400',
    '--max-floatlabel-on-border-radius': '2px'
};

const SCHEME_DEPENDENT: Record<string, { light: string; dark: string }> = {
    '--max-inputtext-border-color': { light: '#cbd5e1', dark: '#52525b' },
    '--max-inputtext-disabled-background': { light: '#e2e8f0', dark: '#3f3f46' },
    '--max-inputtext-focus-border-color': { light: '#00768E', dark: '#178DA5' },
    '--max-form-field-disabled-background': { light: '#e2e8f0', dark: '#3f3f46' },
    '--max-floatlabel-on-active-background': { light: '#ffffff', dark: '#09090b' },
    '--max-surface-400': { light: '#94a3b8', dark: '#a1a1aa' },
    '--max-button-primary-border-color': { light: '#00768E', dark: '#178DA5' },
    '--max-button-secondary-border-color': { light: '#f1f5f9', dark: '#27272a' },
    '--max-button-info-border-color': { light: '#0ea5e9', dark: '#38bdf8' },
    '--max-button-success-border-color': { light: '#22c55e', dark: '#4ade80' },
    '--max-button-warn-border-color': { light: '#f97316', dark: '#fb923c' },
    '--max-button-help-border-color': { light: '#a855f7', dark: '#c084fc' },
    '--max-button-danger-border-color': { light: '#ef4444', dark: '#f87171' },
    '--max-button-contrast-border-color': { light: '#020617', dark: '#ffffff' }
};

describe('themes/tokens.scss', () => {
    it('declara os 23 tokens em :root', () => {
        const total = Object.keys(SCHEME_INDEPENDENT).length + Object.keys(SCHEME_DEPENDENT).length;
        expect(Object.keys(ROOT)).toHaveLength(total);
    });

    it.each(Object.entries(SCHEME_INDEPENDENT))('%s vale %s em :root', (token, value) => {
        expect(ROOT[token]).toBe(value);
    });

    it.each(Object.entries(SCHEME_DEPENDENT))('%s tem valor light em :root', (token, pair) => {
        expect(ROOT[token]).toBe(pair.light);
    });

    it.each(Object.entries(SCHEME_DEPENDENT))('%s tem valor dark em .dark', (token, pair) => {
        expect(DARK[token]).toBe(pair.dark);
    });

    it('não redeclara tokens independentes de esquema no .dark', () => {
        for (const token of Object.keys(SCHEME_INDEPENDENT)) expect(DARK[token]).toBeUndefined();
    });

    it('não referencia o Aura nem deixa placeholders de token', () => {
        expect(CSS).not.toMatch(/\{[a-z.]+\}/);
    });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/themes/tokens.test.ts`
Expected: FAIL — o `sass.compile` lança porque `src/themes/tokens.scss` não existe.

- [ ] **Step 3: Criar `src/themes/tokens.scss`**

```scss
// Tokens que até a Fase 1 eram gerados em runtime pelo serviço de tema do PrimeVue.
// Valores resolvidos a partir do preset Aura (@primeuix/themes ^2.0.3) e congelados aqui.
// Os NOMES ainda seguem o formato PrimeVue de propósito: a renomeação para nomenclatura
// própria acontece no sweep único da Fase 2, junto com as classes .p-*.
// Ver docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md

:root {
    // Rampa primária — declarada em src/styles/style.ts (MaxStyle)
    --max-primary-100: #56C2D7;
    --max-primary-200: #46BCD4;
    --max-primary-400: #178DA5;
    --max-primary-500: #00768E;
    --max-primary-600: #005F77;

    // Primitivas independentes de esquema
    --max-orange-500: #f97316;
    --max-red-600: #dc2626;

    // FloatLabel — literais do Aura
    --max-floatlabel-active-font-weight: 400;
    --max-floatlabel-on-border-radius: 2px;

    // Esquema claro — surface deriva da rampa slate
    --max-inputtext-border-color: #cbd5e1;
    --max-inputtext-disabled-background: #e2e8f0;
    --max-inputtext-focus-border-color: #00768E;
    --max-form-field-disabled-background: #e2e8f0;
    --max-floatlabel-on-active-background: #ffffff;
    --max-surface-400: #94a3b8;

    --max-button-primary-border-color: #00768E;
    --max-button-secondary-border-color: #f1f5f9;
    --max-button-info-border-color: #0ea5e9;
    --max-button-success-border-color: #22c55e;
    --max-button-warn-border-color: #f97316;
    --max-button-help-border-color: #a855f7;
    --max-button-danger-border-color: #ef4444;
    --max-button-contrast-border-color: #020617;
}

// Esquema escuro — surface deriva da rampa zinc (o Aura troca de rampa no dark)
.dark {
    --max-inputtext-border-color: #52525b;
    --max-inputtext-disabled-background: #3f3f46;
    --max-inputtext-focus-border-color: #178DA5;
    --max-form-field-disabled-background: #3f3f46;
    --max-floatlabel-on-active-background: #09090b;
    --max-surface-400: #a1a1aa;

    --max-button-primary-border-color: #178DA5;
    --max-button-secondary-border-color: #27272a;
    --max-button-info-border-color: #38bdf8;
    --max-button-success-border-color: #4ade80;
    --max-button-warn-border-color: #fb923c;
    --max-button-help-border-color: #c084fc;
    --max-button-danger-border-color: #f87171;
    --max-button-contrast-border-color: #ffffff;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/themes/tokens.test.ts`
Expected: PASS (todos os casos).

- [ ] **Step 5: Ligar o arquivo ao barril**

Em `src/themes/all.scss`, acrescentar a linha ao final da lista de `@use`:

```scss
@use './app.scss' as app;
@use './colors.scss' as colors;
@use './font.scss' as font;
@use './params.scss' as params;
@use './tokens.scss' as tokens;
```

- [ ] **Step 6: Confirmar que os tokens saem no preflight do UnoCSS**

Run:
```bash
node --input-type=module -e "
import * as sass from 'sass';
const css = sass.compile('src/themes/all.scss').css;
const n = (css.match(/--max-(inputtext|button|floatlabel|surface|primary|orange|red)-/g) || []).length;
console.log('ocorrencias de token --max-*:', n);
if (n < 23) { console.error('FALHA: tokens ausentes no barril'); process.exit(1); }
"
```
Expected: imprime um número ≥ 23 e sai com código 0.

- [ ] **Step 7: Rodar os portões**

Run: `npm run lint && npm run test`
Expected: Stylelint limpo em `tokens.scss`; suíte completa verde (baseline 1357 + os novos casos).

- [ ] **Step 8: Commit**

```bash
git add src/themes/tokens.scss src/themes/all.scss tests/themes/tokens.test.ts
git commit -m "feat(themes): congela tokens --max-* gerados pelo PrimeVue em tokens.scss"
```

---

## Task 2: `MaxStyle` sem Aura — ❌ REVERTIDA, MOVIDA PARA A FASE 2

> **Executada, revertida e adiada em 2026-08-13.** A review final da branch mediu que remover
> `definePreset(Aura, …)` mantendo `app.use(PrimeVue)` colapsa a geração de tokens do PrimeVue de 436
> para 55 (folha comum de 18816 → 1676 chars, temas de componente vazios), deixando sem estilo os 26
> componentes que ainda importam `primevue` e os 82 reexportados por `./prime`. O commit foi revertido
> (`a22871b8` reverte `ef6825f3`) e o trabalho passou para a §5.0 da spec.
>
> **A causa foi um defeito desta task, não do implementador:** o plano tratou a herança do Aura como
> decorativa, quando é ela que alimenta o gerador de tokens em runtime. O teste que esta task
> especificava (`tests/styles/style.test.ts`) só fazia grep textual no fonte e conferia as 5 rampas —
> nada montava um componente PrimeVue, então o portão não tinha como pegar o problema.
>
> Os Steps abaixo ficam registrados como histórico. **Não os execute.**

### (histórico) Task 2: `MaxStyle` sem Aura

**Files:**
- Modify: `src/styles/style.ts`
- Test: `tests/styles/style.test.ts`

**Interfaces:**
- Consumes: nada da Task 1 em código; os valores da rampa primária devem bater com `--max-primary-*` de `tokens.scss`.
- Produces: `export const MaxStyle` — objeto com a forma `{ semantic: { primary, success, info, warning, danger } }`, cada rampa um `Record<string, string>` com as chaves `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`. Consumido por [`src/index.ts:194`](../../../src/index.ts).

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/styles/style.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MaxStyle } from '../../src/styles/style';

const SOURCE = readFileSync(resolve(__dirname, '../../src/styles/style.ts'), 'utf8');
const RAMPS = ['primary', 'success', 'info', 'warning', 'danger'] as const;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

describe('styles/style.ts — MaxStyle', () => {
    it('não depende do Aura nem de @primeuix/themes', () => {
        // Mira imports e chamadas reais — comentários explicativos podem citar os nomes.
        expect(SOURCE).not.toMatch(/^\s*import[\s\S]*?from\s*'@primeuix\/themes/m);
        expect(SOURCE).not.toMatch(/definePreset\s*\(/);
    });

    it.each(RAMPS)('declara a rampa semântica %s completa', (ramp) => {
        const value = (MaxStyle.semantic as Record<string, Record<string, string>>)[ramp];
        expect(value).toBeDefined();
        expect(Object.keys(value).sort()).toEqual([...SHADES].sort());
    });

    it('mantém os valores da rampa primária usados em tokens.scss', () => {
        expect(MaxStyle.semantic.primary['100']).toBe('#56C2D7');
        expect(MaxStyle.semantic.primary['200']).toBe('#46BCD4');
        expect(MaxStyle.semantic.primary['400']).toBe('#178DA5');
        expect(MaxStyle.semantic.primary['500']).toBe('#00768E');
        expect(MaxStyle.semantic.primary['600']).toBe('#005F77');
    });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/styles/style.test.ts`
Expected: FAIL no caso "não depende do Aura" — o arquivo ainda importa `Aura` e `definePreset`.

- [ ] **Step 3: Reescrever `src/styles/style.ts`**

Remover as duas linhas de import do topo e a chamada `definePreset(Aura, …)`, mantendo **exatamente** os mesmos valores de rampa já presentes no arquivo. O resultado é o mesmo objeto literal, sem o wrapper:

```typescript
/**
 * Preset de tema da biblioteca.
 *
 * Até a Fase 1 da independência do PrimeVue este preset era um `definePreset(Aura, …)`.
 * Agora é um objeto próprio: as 5 rampas semânticas abaixo já eram literais no arquivo,
 * e os tokens que o Aura fornecia por herança estão congelados em src/themes/tokens.scss.
 */
export const MaxStyle = {
    semantic: {
        primary: {
            50: '#67C8DB',
            100: '#56C2D7',
            200: '#46BCD4',
            300: '#2EA4BC',
            400: '#178DA5',
            500: '#00768E',
            600: '#005F77',
            700: '#004860',
            800: '#003048',
            900: '#001931',
            950: '#00152A'
        },
        success: {
            50: '#E8FDF3',
            100: '#D4FCE8',
            200: '#A5F3D3',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
            950: '#054232'
        },
        info: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            200: '#BAE6FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
            800: '#075985',
            900: '#0C4A6E',
            950: '#0A3F5E'
        },
        warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            950: '#662D0D'
        },
        danger: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
            950: '#6C1919'
        }
    }
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/styles/style.test.ts`
Expected: PASS.

- [ ] **Step 5: Confirmar que o app ainda sobe**

Run: `npm run type-check && npm run test`
Expected: type-check limpo (o `install()` em `src/index.ts` continua aceitando `MaxStyle` como `preset`, pois a opção é tipada como objeto de preset); suíte verde.

> Se o `type-check` reclamar do tipo de `preset` em `src/index.ts:194`, anotar `MaxStyle` com o tipo que o PrimeVue espera **sem importar valor em runtime**, usando `import type`. Não reintroduzir `definePreset`.

- [ ] **Step 6: Commit**

```bash
git add src/styles/style.ts tests/styles/style.test.ts
git commit -m "feat(styles): MaxStyle deixa de herdar do preset Aura"
```

---

## Task 3: `ButtonProps` próprio

**Files:**
- Modify: `src/types/index.ts:1` e `src/types/index.ts:15`
- Test: `tests/types/button-props.test.ts` (criar)

**Interfaces:**
- Consumes: nada das tasks anteriores.
- Produces: `export interface MaxButtonBaseProps` — as props do `Button` do PrimeVue que `MaxButtonsType` herdava e não redeclarava. `MaxButtonsType` passa a estender `MaxButtonBaseProps` no lugar de `Omit<PrimeButtonProps, 'size' | 'iconPos'>`. A superfície pública de `MaxButtonsType` é preservada exceto pelo descarte deliberado documentado abaixo.

**Contexto que o implementador precisa:** hoje a linha 15 é
`export interface MaxButtonsType extends /* @vue-ignore */ Omit<PrimeButtonProps, 'size' | 'iconPos'>`.
O marcador `/* @vue-ignore */` faz o compilador do Vue **ignorar essa herança na geração de props em runtime** — ela existe apenas para tipagem do consumidor. Por isso a troca não altera o comportamento do componente.

`MaxButtonsType` já redeclara localmente: `label`, `icon`, `iconRight`, `iconPos`, `severity`, `size`, `sizeIcon`, `loading`, `variant` e ~20 props próprias. O que a herança acrescenta e precisa ser preservado é apenas o conjunto abaixo.

**Descarte deliberado:** `dt`, `pt`, `ptOptions` e `unstyled` **não** são reproduzidos. São APIs de passthrough e theming do PrimeVue, sem significado após a migração, e são exatamente os "parâmetros do PrimeVue" que a restrição do projeto manda eliminar. Isso é um estreitamento de tipo público — registrar no commit.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/types/button-props.test.ts`:

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MaxButtonsType } from '../../src/types';

const SOURCE = readFileSync(resolve(__dirname, '../../src/types/index.ts'), 'utf8');

describe('types — MaxButtonsType', () => {
    it('não importa tipos do PrimeVue', () => {
        expect(SOURCE).not.toMatch(/from 'primevue/);
    });

    it('preserva as props herdadas que os consumidores usam', () => {
        expectTypeOf<MaxButtonsType>().toHaveProperty('outlined');
        expectTypeOf<MaxButtonsType>().toHaveProperty('text');
        expectTypeOf<MaxButtonsType>().toHaveProperty('rounded');
        expectTypeOf<MaxButtonsType>().toHaveProperty('raised');
        expectTypeOf<MaxButtonsType>().toHaveProperty('link');
        expectTypeOf<MaxButtonsType>().toHaveProperty('plain');
        expectTypeOf<MaxButtonsType>().toHaveProperty('fluid');
        expectTypeOf<MaxButtonsType>().toHaveProperty('disabled');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badge');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badgeClass');
        expectTypeOf<MaxButtonsType>().toHaveProperty('badgeSeverity');
        expectTypeOf<MaxButtonsType>().toHaveProperty('loadingIcon');
        expectTypeOf<MaxButtonsType>().toHaveProperty('iconClass');
        expectTypeOf<MaxButtonsType>().toHaveProperty('as');
        expectTypeOf<MaxButtonsType>().toHaveProperty('asChild');
    });

    it('preserva as props próprias e seus tipos estreitados', () => {
        expectTypeOf<MaxButtonsType['variant']>().toEqualTypeOf<'outlined' | 'text' | 'link' | undefined>();
        expectTypeOf<MaxButtonsType['iconPos']>().toEqualTypeOf<'left' | 'right' | undefined>();
        expectTypeOf<MaxButtonsType['dashed']>().toEqualTypeOf<boolean | undefined>();
    });

    it('aceita um objeto de props realista', () => {
        const props: MaxButtonsType = {
            label: 'Salvar',
            icon: 'check',
            severity: 'success',
            variant: 'outlined',
            outlined: true,
            loading: false,
            disabled: false,
            size: '2'
        };
        expect(props.label).toBe('Salvar');
    });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/types/button-props.test.ts`
Expected: FAIL no caso "não importa tipos do PrimeVue" — a linha 1 ainda importa de `primevue/button`.

- [ ] **Step 3: Substituir a herança em `src/types/index.ts`**

Apagar a linha 1 (`import type { ButtonProps as PrimeButtonProps } from 'primevue/button';`) e inserir, antes da declaração de `MaxButtonsType`:

```typescript
/**
 * Props visuais e de comportamento que o `MaxButtonsType` herdava do `ButtonProps`
 * do PrimeVue. Reproduzidas aqui para manter a superfície pública do tipo após a
 * remoção da dependência.
 *
 * Deliberadamente NÃO reproduzidas: `dt`, `pt`, `ptOptions` e `unstyled` — APIs de
 * passthrough/theming do PrimeVue, sem significado após a migração.
 */
export interface MaxButtonBaseProps {
    /** Desabilita o botão */
    disabled?: boolean;
    /** Estilo apenas com borda */
    outlined?: boolean;
    /** Estilo sem fundo nem borda */
    text?: boolean;
    /** Cantos arredondados */
    rounded?: boolean;
    /** Sombra elevada */
    raised?: boolean;
    /** Aparência de link */
    link?: boolean;
    /** Remove a cor de severidade, mantendo apenas o texto */
    plain?: boolean;
    /** Ocupa toda a largura disponível */
    fluid?: boolean;
    /** Conteúdo do badge */
    badge?: string;
    /** Classe CSS do badge */
    badgeClass?: string;
    /** Severidade visual do badge */
    badgeSeverity?: string;
    /** Ícone exibido durante o carregamento */
    loadingIcon?: string;
    /** Classe CSS aplicada ao ícone */
    iconClass?: string;
    /** Elemento ou componente renderizado como raiz */
    as?: string | Record<string, any>;
    /** Delega a renderização da raiz ao slot padrão */
    asChild?: boolean;
    /** Estilo CSS em linha ou objeto */
    style?: string | Record<string, any>;
    /** Classe CSS personalizada */
    class?: string;
}
```

E trocar a linha da declaração:

```typescript
export interface MaxButtonsType extends /* @vue-ignore */ MaxButtonBaseProps {
```

O corpo de `MaxButtonsType` permanece **inalterado** — todas as props próprias e seus comentários seguem como estão.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/types/button-props.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificar que o `MaxButton` ainda compila**

Run: `npm run type-check`
Expected: limpo.

> [`src/components/MaxButton.vue:24`](../../../src/components/MaxButton.vue) **continua** importando `ButtonProps` do PrimeVue para o cast `props as PrimeButtonProps`. Isso é esperado e **não deve ser tocado nesta task**: esse arquivo ainda renderiza o `Button` do PrimeVue e será reescrito no item #19 da fila de migração.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts tests/types/button-props.test.ts
git commit -m "feat(types): MaxButtonsType deixa de herdar ButtonProps do PrimeVue

Reproduz em MaxButtonBaseProps as props herdadas. Estreitamento deliberado:
dt, pt, ptOptions e unstyled nao sao reproduzidos por serem APIs de
passthrough/theming do PrimeVue."
```

---

## Task 4: Aviso de depreciação em `./prime`

**Files:**
- Modify: `src/prime/index.ts` (topo do arquivo)
- Modify: `README.md`
- Test: `tests/prime/deprecation.test.ts` (criar)

**Interfaces:**
- Consumes: nada das tasks anteriores.
- Produces: efeito colateral de módulo — um `console.warn` único em ambiente de desenvolvimento. Nenhum export novo. Os 82 re-exports permanecem intactos.

**Por que isso importa:** o resolver auto-importa desses 82 nomes ([`MaxComponentsUiResolver.ts:41`](../../../src/helpers/MaxComponentsUiResolver.ts)). Uma app consumidora escreve `<Dialog>` no template sem nenhum import e o unplugin resolve. Quando a Fase 2 remover o entry, a falha se manifesta como componente sumindo do template, sem erro de import. O aviso é a única janela de antecedência que o consumidor terá.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/prime/deprecation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('prime/index.ts — depreciação', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('avisa uma única vez em desenvolvimento', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubEnv('DEV', true);

        await import('../../src/prime/index');

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/@maxvue\/max-components-ui\/prime/);
        expect(warn.mock.calls[0][0]).toMatch(/depreciad/i);

        vi.unstubAllEnvs();
    });

    it('mantém os re-exports funcionando', async () => {
        const mod = await import('../../src/prime/index');

        expect(mod.Dialog).toBeDefined();
        expect(mod.Card).toBeDefined();
        expect(mod.DataTable).toBeDefined();
    });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/prime/deprecation.test.ts`
Expected: FAIL no primeiro caso — `console.warn` não é chamado (0 chamadas).

- [ ] **Step 3: Adicionar o aviso no topo de `src/prime/index.ts`**

Inserir **antes** do primeiro `export`, logo abaixo do bloco de comentários existente:

```typescript
// DEPRECIADO — este entry point será removido na próxima major, junto com a
// saída definitiva do PrimeVue (Fase 2 da migração de independência).
// Ver docs/superpowers/specs/2026-08-13-primevue-infra-independencia-design.md
if (import.meta.env?.DEV) {
    console.warn(
        '[max-components-ui] O entry point \'@maxvue/max-components-ui/prime\' está ' +
        'depreciado e será removido na próxima major. Os componentes expostos aqui são ' +
        'reexportações diretas do PrimeVue: passe a importá-los de \'primevue/*\' ou ' +
        'substitua-os por componentes Max equivalentes.'
    );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/prime/deprecation.test.ts`
Expected: PASS nos dois casos.

- [ ] **Step 5: Registrar a depreciação no README**

Acrescentar ao `README.md`, na seção que documenta os entry points (ou ao final, se não houver):

```markdown
### Depreciado: `@maxvue/max-components-ui/prime`

O entry point `./prime` reexporta componentes crus do PrimeVue que não têm
equivalente Max. Ele está **depreciado** e será removido na próxima major,
junto com a saída definitiva do PrimeVue.

Se a sua aplicação usa qualquer um desses componentes — inclusive via
auto-import, sem `import` explícito no arquivo — passe a importá-los
diretamente de `primevue/*`, declarando o `primevue` como dependência da
própria aplicação, ou substitua-os por componentes Max equivalentes.
```

- [ ] **Step 6: Rodar os portões completos da fase**

Run: `npm run type-check && npm run lint && npm run test && npm run build`
Expected: tudo limpo; suíte verde (baseline 1357 + os novos casos das tasks 1–4).

- [ ] **Step 7: Commit**

```bash
git add src/prime/index.ts README.md tests/prime/deprecation.test.ts
git commit -m "feat(prime): deprecia o entry point ./prime com aviso em dev"
```

---

## Verificação final da Fase 1

Executar após a Task 4. Não é uma task — é o portão de saída da fase.

- [ ] **Nenhuma dependência do Aura resta**

Run: `grep -rnE "from '@primeuix/themes|definePreset\s*\(" src/`
Expected: sem resultados. (O grep mira import e chamada; comentários explicativos que citem o nome do preset antigo são aceitáveis e esperados.)

- [ ] **O PrimeVue continua funcionando (a fase é não-quebrante)**

Run: `grep -n "app.use(PrimeVue" src/index.ts`
Expected: a linha existe — a remoção é Fase 2.

- [ ] **Zero mudança visual**

Run: `npm run dev:playground`

Percorrer o playground comparando com a `main`, com atenção aos componentes que consomem os tokens congelados: qualquer input (borda, borda em foco, fundo desabilitado), os float labels (peso da fonte ativa, fundo e raio do recorte) e os botões nas 8 severidades, em `outlined`. Alternar o tema escuro (classe `.dark` na raiz) e repetir — o dark é onde uma resolução errada apareceria, porque o Aura troca a rampa de `surface` de `slate` para `zinc`.

Este é o único portão que a suíte automatizada não cobre. A spec registra a ausência de teste de regressão visual como risco aceito (§7).

---

## Notas de auto-revisão

Cobertura da spec, seção a seção:

| Seção da spec | Task |
|---|---|
| §4.1 `src/themes/tokens.scss` | Task 1 |
| §4.2 `src/styles/style.ts` | Task 2 |
| §4.3 `src/types/index.ts` | Task 3 |
| §4.4 Aviso de depreciação | Task 4 |
| §4.5 Locale — nenhuma ação | — (deliberado) |
| §4.6 Critério de aceite | Verificação final |
| §5 Fase 2 | Fora deste plano — plano próprio quando o portão abrir |

Consistência verificada: os valores de `--max-primary-*` em `tokens.scss` (Task 1) batem com os asserts sobre `MaxStyle.semantic.primary` (Task 2); o nome `MaxButtonBaseProps` é usado de forma idêntica no teste, na implementação e no commit da Task 3.
